import { SQSEvent, SQSRecord } from 'aws-lambda';
import { DynamoDB, SQS } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const dynamodb = new DynamoDB.DocumentClient();
const sqs = new SQS();

interface SNSMessage {
  eventId: string;
  timestamp: string;
  eventType: string;
  source: string;
  data: any;
}

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log('SQS Message Processor triggered:', JSON.stringify(event, null, 2));

  try {
    for (const record of event.Records) {
      await processMessage(record);
    }
  } catch (error) {
    console.error('Error processing SQS messages:', error);
    throw error;
  }
};

async function processMessage(record: SQSRecord): Promise<void> {
  try {
    const messageBody = JSON.parse(record.body);
    const snsMessage: SNSMessage = JSON.parse(messageBody.Message);
    
    console.log(`Processing SNS message: ${snsMessage.eventId}`);

    // Simulate file processing
    await simulateFileProcessing(snsMessage);

    // Update status in DynamoDB
    const updateParams = {
      TableName: process.env.DYNAMODB_TABLE!,
      Key: {
        eventId: snsMessage.eventId,
        timestamp: snsMessage.timestamp,
      },
      UpdateExpression: 'SET #status = :status, processedAt = :processedAt, #source = :source',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#source': 'source',
      },
      ExpressionAttributeValues: {
        ':status': 'COMPLETED',
        ':processedAt': new Date().toISOString(),
        ':source': 'SQS_PROCESSOR',
      },
    };

    await dynamodb.update(updateParams).promise();
    console.log(`Event updated in DynamoDB: ${snsMessage.eventId}`);

    // Send confirmation
    const confirmationMessage = {
      eventId: snsMessage.eventId,
      timestamp: new Date().toISOString(),
      status: 'COMPLETED',
      source: 'SQS_MESSAGE_PROCESSOR',
      details: {
        originalEvent: snsMessage,
        message: `File ${snsMessage.data.objectKey} processing completed`,
        processingTime: Date.now() - new Date(snsMessage.timestamp).getTime(),
      },
    };

    await sqs.sendMessage({
      QueueUrl: process.env.CONFIRMATION_QUEUE_URL!,
      MessageBody: JSON.stringify(confirmationMessage),
      MessageAttributes: {
        eventId: {
          DataType: 'String',
          StringValue: snsMessage.eventId,
        },
        status: {
          DataType: 'String',
          StringValue: 'COMPLETED',
        },
      },
    }).promise();

    console.log(`Confirmation sent to queue: ${snsMessage.eventId}`);

  } catch (error) {
    console.error('Error processing individual message:', error);
    
    // Send to DLQ if there's an error
    const errorMessage = {
      eventId: record.messageId,
      timestamp: new Date().toISOString(),
      status: 'ERROR',
      source: 'SQS_MESSAGE_PROCESSOR',
      error: error.message,
      originalMessage: record.body,
    };

    await sqs.sendMessage({
      QueueUrl: process.env.CONFIRMATION_QUEUE_URL!,
      MessageBody: JSON.stringify(errorMessage),
      MessageAttributes: {
        eventId: {
          DataType: 'String',
          StringValue: record.messageId,
        },
        status: {
          DataType: 'String',
          StringValue: 'ERROR',
        },
      },
    }).promise();

    throw error; // Esto hará que el mensaje vaya a la DLQ
  }
}

async function simulateFileProcessing(message: SNSMessage): Promise<void> {
  // Simulate file processing
  const processingTime = Math.random() * 2000 + 500; // 500-2500ms
  
  console.log(`Simulating file processing for ${processingTime}ms...`);
  
  await new Promise(resolve => setTimeout(resolve, processingTime));
  
  // Simulate random error (5% probability)
  if (Math.random() < 0.05) {
    throw new Error('Simulated processing error');
  }
  
  console.log(`File processing simulation completed for: ${message.data.objectKey}`);
}
