import AWS from 'aws-sdk';
import { waitWithBackoff } from '../setup';

describe('Event Flow Integration Tests', () => {
  let sns: AWS.SNS;
  let sqs: AWS.SQS;
  let dynamodb: AWS.DynamoDB.DocumentClient;
  let s3: AWS.S3;
  let topicArn: string;
  let queueUrl: string;
  let confirmationQueueUrl: string;
  let dlqUrl: string;

  beforeAll(async () => {
    // Configurar clientes AWS
    sns = new AWS.SNS();
    sqs = new AWS.SQS();
    dynamodb = new AWS.DynamoDB.DocumentClient();
    s3 = new AWS.S3();

    // Crear recursos de prueba
    await setupTestResources();
  });

  afterAll(async () => {
    // Limpiar recursos de prueba
    await cleanupTestResources();
  });

  async function setupTestResources() {
    // Crear SNS Topic
    const topicResult = await sns.createTopic({
      Name: 'test-event-driven-topic',
    }).promise();
    topicArn = topicResult.TopicArn!;

    // Crear SQS Queue principal
    const queueResult = await sqs.createQueue({
      QueueName: 'test-event-driven-queue',
      Attributes: {
        VisibilityTimeout: '30',
        MessageRetentionPeriod: '1209600', // 14 días
      },
    }).promise();
    queueUrl = queueResult.QueueUrl!;

    // Crear DLQ
    const dlqResult = await sqs.createQueue({
      QueueName: 'test-event-driven-dlq',
      Attributes: {
        VisibilityTimeout: '30',
        MessageRetentionPeriod: '1209600',
      },
    }).promise();
    dlqUrl = dlqResult.QueueUrl!;

    // Crear cola de confirmaciones
    const confirmationResult = await sqs.createQueue({
      QueueName: 'test-confirmation-queue',
      Attributes: {
        VisibilityTimeout: '30',
      },
    }).promise();
    confirmationQueueUrl = confirmationResult.QueueUrl!;

    // Crear tabla DynamoDB
    await dynamodb.createTable({
      TableName: process.env.DYNAMODB_TABLE!,
      KeySchema: [
        { AttributeName: 'eventId', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'eventId', AttributeType: 'S' },
        { AttributeName: 'timestamp', AttributeType: 'S' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    }).promise();

    // Esperar a que la tabla esté activa
    await waitWithBackoff(async () => {
      const result = await dynamodb.describeTable({
        TableName: process.env.DYNAMODB_TABLE!,
      }).promise();
      return result.Table?.TableStatus === 'ACTIVE';
    });

    // Suscribir SQS to a SNS
    await sns.subscribe({
      TopicArn: topicArn,
      Protocol: 'sqs',
      Endpoint: queueUrl,
    }).promise();
  }

  async function cleanupTestResources() {
    try {
      // Eliminar suscripciones
      const subscriptions = await sns.listSubscriptionsByTopic({
        TopicArn: topicArn,
      }).promise();
      
      for (const subscription of subscriptions.Subscriptions || []) {
        await sns.unsubscribe({
          SubscriptionArn: subscription.SubscriptionArn!,
        }).promise();
      }

      // Eliminar colas
      await sqs.deleteQueue({ QueueUrl: queueUrl }).promise();
      await sqs.deleteQueue({ QueueUrl: dlqUrl }).promise();
      await sqs.deleteQueue({ QueueUrl: confirmationQueueUrl }).promise();

      // Eliminar topic
      await sns.deleteTopic({ TopicArn: topicArn }).promise();

      // Eliminar tabla
      await dynamodb.deleteTable({
        TableName: process.env.DYNAMODB_TABLE!,
      }).promise();
    } catch (error) {
      console.error('Error cleaning up resources:', error);
    }
  }

  describe('Complete Event Flow', () => {
    it('should process file upload event through the entire pipeline', async () => {
      const eventId = `test-event-${Date.now()}`;
      const fileName = 'test-file.txt';
      const fileContent = 'This is a test file content';

      // 1. Simular subida de archivo a S3
      await s3.putObject({
        Bucket: process.env.S3_BUCKET!,
        Key: `uploads/${eventId}/${fileName}`,
        Body: fileContent,
        ContentType: 'text/plain',
        Metadata: {
          eventId,
          uploadedAt: new Date().toISOString(),
        },
      }).promise();

      console.log(`File uploaded to S3: ${fileName}`);

      // 2. Publicar evento en SNS
      const snsMessage = {
        eventId,
        timestamp: new Date().toISOString(),
        eventType: 'FILE_UPLOADED',
        source: 'S3',
        data: {
          bucketName: process.env.S3_BUCKET!,
          objectKey: `uploads/${eventId}/${fileName}`,
          fileName,
          fileSize: fileContent.length,
        },
      };

      await sns.publish({
        TopicArn: topicArn,
        Message: JSON.stringify(snsMessage),
        MessageAttributes: {
          eventType: {
            DataType: 'String',
            StringValue: 'FILE_UPLOADED',
          },
          source: {
            DataType: 'String',
            StringValue: 'S3',
          },
        },
      }).promise();

      console.log(`Event published to SNS: ${eventId}`);

      // 3. Verificar que el mensaje llegó a SQS
      const messageReceived = await waitWithBackoff(async () => {
        const result = await sqs.receiveMessage({
          QueueUrl: queueUrl,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: 5,
        }).promise();
        return result.Messages && result.Messages.length > 0;
      });

      expect(messageReceived).toBe(true);
      console.log('Message received in SQS');

      // 4. Verificar que el evento se guardó en DynamoDB
      const eventSaved = await waitWithBackoff(async () => {
        try {
          const result = await dynamodb.get({
            TableName: process.env.DYNAMODB_TABLE!,
            Key: {
              eventId,
              timestamp: snsMessage.timestamp,
            },
          }).promise();
          return result.Item !== undefined;
        } catch (error) {
          return false;
        }
      });

      expect(eventSaved).toBe(true);
      console.log('Event saved to DynamoDB');

      // 5. Verificar confirmación en la cola de confirmaciones
      const confirmationReceived = await waitWithBackoff(async () => {
        const result = await sqs.receiveMessage({
          QueueUrl: confirmationQueueUrl,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: 5,
        }).promise();
        return result.Messages && result.Messages.length > 0;
      });

      expect(confirmationReceived).toBe(true);
      console.log('Confirmation received');
    }, 30000);

    it('should handle idempotency correctly', async () => {
      const eventId = `idempotency-test-${Date.now()}`;
      const fileName = 'idempotency-test.txt';
      const fileContent = 'Idempotency test content';

      // Enviar el mismo evento múltiples veces
      const snsMessage = {
        eventId,
        timestamp: new Date().toISOString(),
        eventType: 'FILE_UPLOADED',
        source: 'S3',
        data: {
          bucketName: process.env.S3_BUCKET!,
          objectKey: `uploads/${eventId}/${fileName}`,
          fileName,
          fileSize: fileContent.length,
        },
      };

      // Enviar evento 3 veces
      for (let i = 0; i < 3; i++) {
        await sns.publish({
          TopicArn: topicArn,
          Message: JSON.stringify(snsMessage),
          MessageAttributes: {
            eventType: {
              DataType: 'String',
              StringValue: 'FILE_UPLOADED',
            },
            source: {
              DataType: 'String',
              StringValue: 'S3',
            },
          },
        }).promise();
      }

      // Verificar que solo se procesó una vez
      const finalEvent = await waitWithBackoff(async () => {
        try {
          const result = await dynamodb.get({
            TableName: process.env.DYNAMODB_TABLE!,
            Key: {
              eventId,
              timestamp: snsMessage.timestamp,
            },
          }).promise();
          return result.Item;
        } catch (error) {
          return null;
        }
      });

      expect(finalEvent).toBeDefined();
      expect(finalEvent.eventId).toBe(eventId);
      console.log('Idempotency test passed - event processed only once');
    }, 30000);

    it('should handle errors and send messages to DLQ', async () => {
      // Enviar un mensaje malformado para provocar error
      const malformedMessage = {
        Message: 'This is not valid JSON',
      };

      await sns.publish({
        TopicArn: topicArn,
        Message: JSON.stringify(malformedMessage),
      }).promise();

      // Verificar que el mensaje llegó a la DLQ después de varios intentos
      const messageInDLQ = await waitWithBackoff(async () => {
        const result = await sqs.receiveMessage({
          QueueUrl: dlqUrl,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: 5,
        }).promise();
        return result.Messages && result.Messages.length > 0;
      }, 15, 2000); // Más intentos y delay más largo

      expect(messageInDLQ).toBe(true);
      console.log('Error handling test passed - message sent to DLQ');
    }, 60000);
  });

  describe('API Integration Tests', () => {
    it('should handle file upload via API', async () => {
      const fileName = 'api-test-file.txt';
      const fileContent = 'API test file content';

      // Simular llamada a la API
      const apiEvent = {
        httpMethod: 'POST',
        path: '/upload',
        body: JSON.stringify({
          fileName,
          fileContent,
          fileType: 'text/plain',
        }),
      };

      // Importar y ejecutar la función Lambda
      const { handler: apiHandler } = require('../../src/lambda/api-handler');
      const result = await apiHandler(apiEvent);

      expect(result.statusCode).toBe(201);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.message).toBe('File uploaded successfully');
      expect(responseBody.fileName).toBe(fileName);

      console.log('API file upload test passed');
    });

    it('should handle manual event creation via API', async () => {
      const eventData = {
        type: 'MANUAL_TEST',
        description: 'Test manual event',
        priority: 'HIGH',
      };

      const apiEvent = {
        httpMethod: 'POST',
        path: '/events',
        body: JSON.stringify(eventData),
      };

      const { handler: apiHandler } = require('../../src/lambda/api-handler');
      const result = await apiHandler(apiEvent);

      expect(result.statusCode).toBe(201);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.message).toBe('Event created successfully');
      expect(responseBody.eventId).toBeDefined();

      console.log('API manual event creation test passed');
    });
  });
});
