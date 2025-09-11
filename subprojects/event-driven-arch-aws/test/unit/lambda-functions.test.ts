import { handler as s3EventProcessor } from '../../src/lambda/s3-event-processor';
import { handler as sqsMessageProcessor } from '../../src/lambda/sqs-message-processor';
import { handler as confirmationSender } from '../../src/lambda/confirmation-sender';
import { handler as apiHandler } from '../../src/lambda/api-handler';
import AWS from 'aws-sdk';

// Mock AWS SDK
jest.mock('aws-sdk');

describe('Lambda Functions Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('S3 Event Processor', () => {
    it('should process S3 event and publish to SNS', async () => {
      const mockS3Event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'test-file.txt', size: 1024 },
            },
          },
        ],
      };

      const mockSNS = {
        publish: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) }),
      };

      const mockDynamoDB = {
        put: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) }),
      };

      const mockSQS = {
        sendMessage: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) }),
      };

      (AWS.SNS as jest.MockedClass<typeof AWS.SNS>).mockImplementation(() => mockSNS as any);
      (AWS.DynamoDB.DocumentClient as jest.MockedClass<typeof AWS.DynamoDB.DocumentClient>).mockImplementation(() => mockDynamoDB as any);
      (AWS.SQS as jest.MockedClass<typeof AWS.SQS>).mockImplementation(() => mockSQS as any);

      await s3EventProcessor(mockS3Event as any);

      expect(mockDynamoDB.put).toHaveBeenCalled();
      expect(mockSNS.publish).toHaveBeenCalled();
      expect(mockSQS.sendMessage).toHaveBeenCalled();
    });
  });

  describe('SQS Message Processor', () => {
    it('should process SQS message and update DynamoDB', async () => {
      const mockSQSMessage = {
        body: JSON.stringify({
          Message: JSON.stringify({
            eventId: 'test-event-id',
            timestamp: '2023-01-01T00:00:00Z',
            eventType: 'FILE_UPLOADED',
            source: 'S3',
            data: { objectKey: 'test-file.txt' },
          }),
        }),
        messageId: 'test-message-id',
      };

      const mockSQSEvent = {
        Records: [mockSQSMessage],
      };

      const mockDynamoDB = {
        update: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) }),
      };

      const mockSQS = {
        sendMessage: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) }),
      };

      (AWS.DynamoDB.DocumentClient as jest.MockedClass<typeof AWS.DynamoDB.DocumentClient>).mockImplementation(() => mockDynamoDB as any);
      (AWS.SQS as jest.MockedClass<typeof AWS.SQS>).mockImplementation(() => mockSQS as any);

      await sqsMessageProcessor(mockSQSEvent as any);

      expect(mockDynamoDB.update).toHaveBeenCalled();
      expect(mockSQS.sendMessage).toHaveBeenCalled();
    });

    it('should handle processing errors and send to DLQ', async () => {
      const mockSQSMessage = {
        body: JSON.stringify({
          Message: JSON.stringify({
            eventId: 'test-event-id',
            timestamp: '2023-01-01T00:00:00Z',
            eventType: 'FILE_UPLOADED',
            source: 'S3',
            data: { objectKey: 'test-file.txt' },
          }),
        }),
        messageId: 'test-message-id',
      };

      const mockSQSEvent = {
        Records: [mockSQSMessage],
      };

      const mockDynamoDB = {
        update: jest.fn().mockReturnValue({ promise: jest.fn().mockRejectedValue(new Error('DynamoDB error')) }),
      };

      const mockSQS = {
        sendMessage: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) }),
      };

      (AWS.DynamoDB.DocumentClient as jest.MockedClass<typeof AWS.DynamoDB.DocumentClient>).mockImplementation(() => mockDynamoDB as any);
      (AWS.SQS as jest.MockedClass<typeof AWS.SQS>).mockImplementation(() => mockSQS as any);

      await expect(sqsMessageProcessor(mockSQSEvent as any)).rejects.toThrow('DynamoDB error');
      expect(mockSQS.sendMessage).toHaveBeenCalled();
    });
  });

  describe('Confirmation Sender', () => {
    it('should process confirmation and update DynamoDB', async () => {
      const mockConfirmationMessage = {
        eventId: 'test-event-id',
        timestamp: '2023-01-01T00:00:00Z',
        status: 'COMPLETED',
        source: 'SQS_PROCESSOR',
        details: { message: 'Test confirmation' },
      };

      const mockSQSEvent = {
        Records: [
          {
            body: JSON.stringify(mockConfirmationMessage),
          },
        ],
      };

      const mockDynamoDB = {
        update: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) }),
      };

      (AWS.DynamoDB.DocumentClient as jest.MockedClass<typeof AWS.DynamoDB.DocumentClient>).mockImplementation(() => mockDynamoDB as any);

      await confirmationSender(mockSQSEvent as any);

      expect(mockDynamoDB.update).toHaveBeenCalled();
    });
  });

  describe('API Handler', () => {
    it('should handle POST /events request', async () => {
      const mockEvent = {
        httpMethod: 'POST',
        path: '/events',
        body: JSON.stringify({ test: 'data' }),
      };

      const mockSNS = {
        publish: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) }),
      };

      const mockDynamoDB = {
        put: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) }),
      };

      (AWS.SNS as jest.MockedClass<typeof AWS.SNS>).mockImplementation(() => mockSNS as any);
      (AWS.DynamoDB.DocumentClient as jest.MockedClass<typeof AWS.DynamoDB.DocumentClient>).mockImplementation(() => mockDynamoDB as any);

      const result = await apiHandler(mockEvent as any);

      expect(result.statusCode).toBe(201);
      expect(mockDynamoDB.put).toHaveBeenCalled();
      expect(mockSNS.publish).toHaveBeenCalled();
    });

    it('should handle GET /events request', async () => {
      const mockEvent = {
        httpMethod: 'GET',
        path: '/events',
      };

      const mockDynamoDB = {
        scan: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({ Items: [], Count: 0 }) }),
      };

      (AWS.DynamoDB.DocumentClient as jest.MockedClass<typeof AWS.DynamoDB.DocumentClient>).mockImplementation(() => mockDynamoDB as any);

      const result = await apiHandler(mockEvent as any);

      expect(result.statusCode).toBe(200);
      expect(mockDynamoDB.scan).toHaveBeenCalled();
    });

    it('should handle POST /upload request', async () => {
      const mockEvent = {
        httpMethod: 'POST',
        path: '/upload',
        body: JSON.stringify({
          fileName: 'test.txt',
          fileContent: 'test content',
          fileType: 'text/plain',
        }),
      };

      const mockS3 = {
        putObject: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) }),
      };

      const mockSNS = {
        publish: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) }),
      };

      const mockDynamoDB = {
        put: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) }),
      };

      (AWS.S3 as jest.MockedClass<typeof AWS.S3>).mockImplementation(() => mockS3 as any);
      (AWS.SNS as jest.MockedClass<typeof AWS.SNS>).mockImplementation(() => mockSNS as any);
      (AWS.DynamoDB.DocumentClient as jest.MockedClass<typeof AWS.DynamoDB.DocumentClient>).mockImplementation(() => mockDynamoDB as any);

      const result = await apiHandler(mockEvent as any);

      expect(result.statusCode).toBe(201);
      expect(mockS3.putObject).toHaveBeenCalled();
      expect(mockDynamoDB.put).toHaveBeenCalled();
      expect(mockSNS.publish).toHaveBeenCalled();
    });

    it('should handle OPTIONS request for CORS', async () => {
      const mockEvent = {
        httpMethod: 'OPTIONS',
        path: '/events',
      };

      const result = await apiHandler(mockEvent as any);

      expect(result.statusCode).toBe(200);
      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
    });

    it('should handle 404 for unknown endpoints', async () => {
      const mockEvent = {
        httpMethod: 'GET',
        path: '/unknown',
      };

      const result = await apiHandler(mockEvent as any);

      expect(result.statusCode).toBe(404);
    });
  });
});
