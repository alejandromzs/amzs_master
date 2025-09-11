import AWS from 'aws-sdk';

// Configure AWS SDK for LocalStack
const localstackConfig = {
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
  accessKeyId: 'test',
  secretAccessKey: 'test',
};

// Configure AWS services for LocalStack
AWS.config.update(localstackConfig);

// Configure environment variables for tests
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test';
process.env.AWS_SECRET_ACCESS_KEY = 'test';
process.env.DYNAMODB_TABLE = 'event-driven-events-test';
process.env.SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:000000000000:event-driven-main-topic';
process.env.S3_BUCKET = 'test-event-driven-files';
process.env.CONFIRMATION_QUEUE_URL = 'http://localhost:4566/000000000000/event-driven-confirmation-queue';

// Configure timeouts for tests
jest.setTimeout(30000);

// Helper function to wait with exponential backoff
export const waitWithBackoff = async (
  condition: () => Promise<boolean>,
  maxAttempts: number = 10,
  baseDelay: number = 1000
): Promise<boolean> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (await condition()) {
        return true;
      }
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error.message);
    }
    
    if (attempt < maxAttempts) {
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
};

// Helper function to clean up test resources
export const cleanupTestResources = async (): Promise<void> => {
      // Implement resource cleanup if necessary
    console.log('Cleaning up test resources...');
};
