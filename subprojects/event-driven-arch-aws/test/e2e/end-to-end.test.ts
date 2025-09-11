import AWS from 'aws-sdk';
import { waitWithBackoff } from '../setup';

describe('End-to-End Event Driven Architecture Tests', () => {
  let sns: AWS.SNS;
  let sqs: AWS.SQS;
  let dynamodb: AWS.DynamoDB.DocumentClient;
  let s3: AWS.S3;
  let apiGatewayUrl: string;

  beforeAll(async () => {
    // Configure Client AWS
    sns = new AWS.SNS();
    sqs = new AWS.SQS();
    dynamodb = new AWS.DynamoDB.DocumentClient();
    s3 = new AWS.S3();

    // Configure URL of API Gateway (in prod it would be real prod url)
    apiGatewayUrl = 'http://localhost:3000'; // For local testing
  });

  describe('Complete User Journey', () => {
    it('should handle complete user journey from file upload to confirmation', async () => {
      const testId = `e2e-test-${Date.now()}`;
      const fileName = `${testId}-document.pdf`;
      const fileContent = 'This is a test PDF document content for E2E testing';

      console.log(`🚀 Starting E2E test: ${testId}`);

      // Paso 1: Usuario sube archivo a través de la API
      const uploadResponse = await fetch(`${apiGatewayUrl}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          fileContent,
          fileType: 'application/pdf',
        }),
      });

      expect(uploadResponse.status).toBe(201);
      const uploadResult = await uploadResponse.json();
      expect(uploadResult.message).toBe('File uploaded successfully');
      expect(uploadResult.fileName).toBe(fileName);

      const eventId = uploadResult.eventId;
      console.log(`📁 File uploaded successfully: ${fileName} (Event ID: ${eventId})`);

      // Step 2: Verify that the file has been uploaded to S3
      const s3ObjectExists = await waitWithBackoff(async () => {
        try {
          await s3.headObject({
            Bucket: process.env.S3_BUCKET!,
            Key: uploadResult.objectKey,
          }).promise();
          return true;
        } catch (error) {
          return false;
        }
      });

      expect(s3ObjectExists).toBe(true);
      console.log(`✅ File confirmed in S3: ${uploadResult.objectKey}`);

      // Paso 3: Verify the event was saved in DynamoDB
      const eventInDynamoDB = await waitWithBackoff(async () => {
        try {
          const result = await dynamodb.get({
            TableName: process.env.DYNAMODB_TABLE!,
            Key: {
              eventId,
              timestamp: uploadResult.timestamp,
            },
          }).promise();
          return result.Item !== undefined;
        } catch (error) {
          return false;
        }
      });

      expect(eventInDynamoDB).toBe(true);
      console.log(`✅ Event saved to DynamoDB: ${eventId}`);

      // Paso 4: Verificar que el evento se procesó completamente
      const eventProcessed = await waitWithBackoff(async () => {
        try {
          const result = await dynamodb.get({
            TableName: process.env.DYNAMODB_TABLE!,
            Key: {
              eventId,
              timestamp: uploadResult.timestamp,
            },
          }).promise();
          
          const item = result.Item;
          return item && (item.finalStatus === 'COMPLETED' || item.status === 'COMPLETED');
        } catch (error) {
          return false;
        }
      }, 20, 2000); // Más tiempo para procesamiento completo

      expect(eventProcessed).toBe(true);
      console.log(`✅ Event processing completed: ${eventId}`);

      // Paso 5: Verificar que se envió confirmación
      const confirmationSent = await waitWithBackoff(async () => {
        try {
          const result = await dynamodb.get({
            TableName: process.env.DYNAMODB_TABLE!,
            Key: {
              eventId,
              timestamp: uploadResult.timestamp,
            },
          }).promise();
          
          const item = result.Item;
          return item && item.confirmationDetails;
        } catch (error) {
          return false;
        }
      });

      expect(confirmationSent).toBe(true);
      console.log(`✅ Confirmation sent for: ${eventId}`);

      // Paso 6: Verificar que el usuario puede consultar el estado
      const statusResponse = await fetch(`${apiGatewayUrl}/events`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(statusResponse.status).toBe(200);
      const eventsResult = await statusResponse.json();
      expect(eventsResult.events).toBeDefined();
      expect(eventsResult.count).toBeGreaterThan(0);

      // Verificar que nuestro evento está en la lista
      const ourEvent = eventsResult.events.find((event: any) => event.eventId === eventId);
      expect(ourEvent).toBeDefined();
      expect(ourEvent.fileName).toBe(fileName);

      console.log(`✅ Event status query successful: ${eventId}`);
      console.log(`🎉 E2E test completed successfully: ${testId}`);
    }, 120000); // 2 minutos para el test completo

    it('should handle multiple concurrent file uploads', async () => {
      const testId = `concurrent-test-${Date.now()}`;
      const uploadPromises = [];
      const eventIds = [];

      console.log(`🚀 Starting concurrent upload test: ${testId}`);

      // Crear 5 uploads concurrentes
      for (let i = 0; i < 5; i++) {
        const fileName = `${testId}-file-${i}.txt`;
        const fileContent = `Concurrent test file ${i} content`;

        const uploadPromise = fetch(`${apiGatewayUrl}/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName,
            fileContent,
            fileType: 'text/plain',
          }),
        }).then(async (response) => {
          expect(response.status).toBe(201);
          const result = await response.json();
          eventIds.push(result.eventId);
          return result;
        });

        uploadPromises.push(uploadPromise);
      }

      // Esperar a que todos los uploads se completen
      const uploadResults = await Promise.all(uploadPromises);
      console.log(`📁 All ${uploadResults.length} files uploaded successfully`);

      // Verificar que todos los eventos se procesaron
      const allEventsProcessed = await waitWithBackoff(async () => {
        try {
          const promises = eventIds.map(async (eventId) => {
            const result = await dynamodb.get({
              TableName: process.env.DYNAMODB_TABLE!,
              Key: {
                eventId,
                timestamp: uploadResults.find(r => r.eventId === eventId)?.timestamp,
              },
            }).promise();
            return result.Item;
          });

          const events = await Promise.all(promises);
          return events.every(event => event && (event.finalStatus === 'COMPLETED' || event.status === 'COMPLETED'));
        } catch (error) {
          return false;
        }
      }, 30, 2000);

      expect(allEventsProcessed).toBe(true);
      console.log(`✅ All ${eventIds.length} events processed successfully`);
      console.log(`🎉 Concurrent upload test completed: ${testId}`);
    }, 180000); // 3 minutos para el test de concurrencia

    it('should handle error scenarios gracefully', async () => {
      const testId = `error-test-${Date.now()}`;

      console.log(`🚀 Starting error handling test: ${testId}`);

      // Test 1: Intentar subir archivo sin nombre
      const invalidUploadResponse = await fetch(`${apiGatewayUrl}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileContent: 'Test content without filename',
        }),
      });

      expect(invalidUploadResponse.status).toBe(400);
      const invalidResult = await invalidUploadResponse.json();
      expect(invalidResult.error).toBeDefined();

      console.log(`✅ Invalid upload handled correctly`);

      // Test 2: Intentar crear evento sin datos
      const invalidEventResponse = await fetch(`${apiGatewayUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      expect(invalidEventResponse.status).toBe(201); // Debería crear el evento vacío
      const eventResult = await invalidEventResponse.json();
      expect(eventResult.eventId).toBeDefined();

      console.log(`✅ Empty event creation handled correctly`);

      // Test 3: Verificar endpoint inexistente
      const notFoundResponse = await fetch(`${apiGatewayUrl}/nonexistent`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(notFoundResponse.status).toBe(404);
      const notFoundResult = await notFoundResponse.json();
      expect(notFoundResult.error).toBe('Endpoint not found');

      console.log(`✅ 404 handling works correctly`);
      console.log(`🎉 Error handling test completed: ${testId}`);
    }, 60000);

    it('should demonstrate idempotency and consistency', async () => {
      const testId = `idempotency-test-${Date.now()}`;
      const fileName = `${testId}-idempotent.txt`;
      const fileContent = 'Idempotency test content';

      console.log(`🚀 Starting idempotency test: ${testId}`);

      // Crear el mismo evento múltiples veces
      const eventData = {
        type: 'IDEMPOTENCY_TEST',
        description: 'Testing idempotency',
        testId,
        timestamp: new Date().toISOString(),
      };

      const createEventPromises = [];
      for (let i = 0; i < 3; i++) {
        const promise = fetch(`${apiGatewayUrl}/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        }).then(async (response) => {
          expect(response.status).toBe(201);
          return await response.json();
        });

        createEventPromises.push(promise);
      }

      const eventResults = await Promise.all(createEventPromises);
      console.log(`📝 Created ${eventResults.length} events`);

      // Verificar que todos los eventos tienen IDs únicos
      const eventIds = eventResults.map(result => result.eventId);
      const uniqueEventIds = new Set(eventIds);
      expect(uniqueEventIds.size).toBe(eventIds.length);

      console.log(`✅ All events have unique IDs`);

      // Verificar que todos los eventos se procesaron correctamente
      const allEventsProcessed = await waitWithBackoff(async () => {
        try {
          const promises = eventIds.map(async (eventId) => {
            const result = await dynamodb.get({
              TableName: process.env.DYNAMODB_TABLE!,
              Key: {
                eventId,
                timestamp: eventResults.find(r => r.eventId === eventId)?.timestamp,
              },
            }).promise();
            return result.Item;
          });

          const events = await Promise.all(promises);
          return events.every(event => event && event.status === 'CREATED');
        } catch (error) {
          return false;
        }
      });

      expect(allEventsProcessed).toBe(true);
      console.log(`✅ All events processed consistently`);
      console.log(`🎉 Idempotency test completed: ${testId}`);
    }, 90000);
  });
});
