import { S3Event } from 'aws-lambda';
import { SNS, DynamoDB, SQS } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const sns = new SNS();
const dynamodb = new DynamoDB.DocumentClient();
const sqs = new SQS();

export const handler = async (event: S3Event): Promise<void> => {
  console.log('S3 Event Processor triggered:', JSON.stringify(event, null, 2));

  try {
    for (const record of event.Records) {
      const bucketName = record.s3.bucket.name;
      const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      const eventId = uuidv4();
      const timestamp = new Date().toISOString();

      console.log(`Processing file: ${objectKey} from bucket: ${bucketName}`);

      // Create event for DynamoDB
      const eventRecord = {
        eventId,
        timestamp,
        eventType: 'S3_OBJECT_CREATED',
        source: 'S3',
        bucketName,
        objectKey,
        status: 'PROCESSING',
        ttl: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 días
      };

      // Save to DynamoDB
      await dynamodb.put({
        TableName: process.env.DYNAMODB_TABLE!,
        Item: eventRecord,
      }).promise();

      console.log(`Event saved to DynamoDB: ${eventId}`);

      // Publish message to SNS
      const snsMessage = {
        eventId,
        timestamp,
        eventType: 'FILE_UPLOADED',
        source: 'S3',
        data: {
          bucketName,
          objectKey,
          fileSize: record.s3.object.size,
          eventId,
        },
      };

      await sns.publish({
        TopicArn: process.env.SNS_TOPIC_ARN!,
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

      console.log(`Message published to SNS: ${eventId}`);

      // Send confirmation to confirmation queue
      const confirmationMessage = {
        eventId,
        timestamp,
        status: 'PROCESSED',
        source: 'S3_EVENT_PROCESSOR',
        details: {
          bucketName,
          objectKey,
          message: `File ${objectKey} processed successfully`,
        },
      };

      await sqs.sendMessage({
        QueueUrl: process.env.CONFIRMATION_QUEUE_URL!,
        MessageBody: JSON.stringify(confirmationMessage),
        MessageAttributes: {
          eventId: {
            DataType: 'String',
            StringValue: eventId,
          },
          status: {
            DataType: 'String',
            StringValue: 'PROCESSED',
          },
        },
      }).promise();

      console.log(`Confirmation sent to queue: ${eventId}`);
    }
  } catch (error) {
    console.error('Error processing S3 event:', error);
    throw error;
  }
};
