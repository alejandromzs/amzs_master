import { SQSEvent, SQSRecord } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamodb = new DynamoDB.DocumentClient();

interface ConfirmationMessage {
  eventId: string;
  timestamp: string;
  status: 'PROCESSED' | 'COMPLETED' | 'ERROR';
  source: string;
  details: any;
}

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log('Confirmation Sender triggered:', JSON.stringify(event, null, 2));

  try {
    for (const record of event.Records) {
      await processConfirmation(record);
    }
  } catch (error) {
    console.error('Error processing confirmations:', error);
    throw error;
  }
};

async function processConfirmation(record: SQSRecord): Promise<void> {
  try {
    const confirmationMessage: ConfirmationMessage = JSON.parse(record.body);
    
    console.log(`Processing confirmation for event: ${confirmationMessage.eventId}`);

    // Update final status in DynamoDB
    const updateParams = {
      TableName: process.env.DYNAMODB_TABLE!,
      Key: {
        eventId: confirmationMessage.eventId,
        timestamp: confirmationMessage.timestamp,
      },
      UpdateExpression: 'SET finalStatus = :finalStatus, confirmedAt = :confirmedAt, confirmationSource = :confirmationSource, confirmationDetails = :confirmationDetails',
      ExpressionAttributeValues: {
        ':finalStatus': confirmationMessage.status,
        ':confirmedAt': new Date().toISOString(),
        ':confirmationSource': confirmationMessage.source,
        ':confirmationDetails': confirmationMessage.details,
      },
    };

    await dynamodb.update(updateParams).promise();
    console.log(`Confirmation saved to DynamoDB: ${confirmationMessage.eventId}`);

    // Simulate notification sending (email, SMS, etc.)
    await sendNotification(confirmationMessage);

    console.log(`Confirmation processed successfully: ${confirmationMessage.eventId}`);

  } catch (error) {
    console.error('Error processing confirmation:', error);
    throw error;
  }
}

async function sendNotification(confirmation: ConfirmationMessage): Promise<void> {
  // Simulate notification sending
  const notificationTime = Math.random() * 1000 + 200; // 200-1200ms
  
  console.log(`Sending notification for ${notificationTime}ms...`);
  
  await new Promise(resolve => setTimeout(resolve, notificationTime));
  
  // Simulate different notification types based on status
  switch (confirmation.status) {
    case 'COMPLETED':
      console.log(`✅ SUCCESS: File processing completed for event ${confirmation.eventId}`);
      console.log(`📧 Email notification sent: "Your file has been processed successfully"`);
      break;
    case 'PROCESSED':
      console.log(`🔄 PROCESSING: File is being processed for event ${confirmation.eventId}`);
      console.log(`📧 Email notification sent: "Your file is being processed"`);
      break;
    case 'ERROR':
      console.log(`❌ ERROR: File processing failed for event ${confirmation.eventId}`);
      console.log(`📧 Email notification sent: "There was an error processing your file"`);
      console.log(`📱 SMS notification sent: "File processing error - please check your email"`);
      break;
  }
}
