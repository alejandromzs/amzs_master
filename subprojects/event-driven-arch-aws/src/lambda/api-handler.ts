import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SNS, S3, DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const sns = new SNS();
const s3 = new S3();
const dynamodb = new DynamoDB.DocumentClient();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('API Handler triggered:', JSON.stringify(event, null, 2));

  try {
    const { httpMethod, path, body } = event;

    // Configure CORS headers
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    };

    // Handle preflight requests
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: '',
      };
    }

    // API routes
    if (path === '/events' && httpMethod === 'POST') {
      return await handleCreateEvent(body);
    } else if (path === '/events' && httpMethod === 'GET') {
      return await handleGetEvents();
    } else if (path === '/upload' && httpMethod === 'POST') {
      return await handleFileUpload(body);
    } else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Endpoint not found' }),
      };
    }
  } catch (error) {
    console.error('Error in API handler:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

async function handleCreateEvent(body: string | null): Promise<APIGatewayProxyResult> {
  if (!body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Request body is required' }),
    };
  }

  try {
    const eventData = JSON.parse(body);
    const eventId = uuidv4();
    const timestamp = new Date().toISOString();

    // Create event in DynamoDB
    const eventRecord = {
      eventId,
      timestamp,
      eventType: 'MANUAL_EVENT',
      source: 'API',
      status: 'CREATED',
      data: eventData,
      ttl: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 días
    };

    await dynamodb.put({
      TableName: process.env.DYNAMODB_TABLE!,
      Item: eventRecord,
    }).promise();

    // Publish to SNS
    const snsMessage = {
      eventId,
      timestamp,
      eventType: 'MANUAL_EVENT',
      source: 'API',
      data: eventData,
    };

    await sns.publish({
      TopicArn: process.env.SNS_TOPIC_ARN!,
      Message: JSON.stringify(snsMessage),
      MessageAttributes: {
        eventType: {
          DataType: 'String',
          StringValue: 'MANUAL_EVENT',
        },
        source: {
          DataType: 'String',
          StringValue: 'API',
        },
      },
    }).promise();

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        message: 'Event created successfully',
        eventId,
        timestamp,
      }),
    };
  } catch (error) {
    console.error('Error creating event:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to create event' }),
    };
  }
}

async function handleGetEvents(): Promise<APIGatewayProxyResult> {
  try {
    const result = await dynamodb.scan({
      TableName: process.env.DYNAMODB_TABLE!,
      Limit: 50,
    }).promise();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        events: result.Items || [],
        count: result.Count || 0,
      }),
    };
  } catch (error) {
    console.error('Error getting events:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to get events' }),
    };
  }
}

async function handleFileUpload(body: string | null): Promise<APIGatewayProxyResult> {
  if (!body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Request body is required' }),
    };
  }

  try {
    const uploadData = JSON.parse(body);
    const { fileName, fileContent, fileType = 'text/plain' } = uploadData;
    
    if (!fileName || !fileContent) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'fileName and fileContent are required' }),
      };
    }

    const eventId = uuidv4();
    const timestamp = new Date().toISOString();
    const objectKey = `uploads/${eventId}/${fileName}`;

    // Upload file to S3
    await s3.putObject({
      Bucket: process.env.S3_BUCKET!,
      Key: objectKey,
      Body: fileContent,
      ContentType: fileType,
      Metadata: {
        eventId,
        uploadedAt: timestamp,
      },
    }).promise();

    // Create event in DynamoDB
    const eventRecord = {
      eventId,
      timestamp,
      eventType: 'FILE_UPLOAD',
      source: 'API',
      status: 'UPLOADED',
      bucketName: process.env.S3_BUCKET!,
      objectKey,
      fileName,
      fileType,
      ttl: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 días
    };

    await dynamodb.put({
      TableName: process.env.DYNAMODB_TABLE!,
      Item: eventRecord,
    }).promise();

    // Publish to SNS
    const snsMessage = {
      eventId,
      timestamp,
      eventType: 'FILE_UPLOADED',
      source: 'API',
      data: {
        bucketName: process.env.S3_BUCKET!,
        objectKey,
        fileName,
        fileType,
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
          StringValue: 'API',
        },
      },
    }).promise();

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        message: 'File uploaded successfully',
        eventId,
        fileName,
        objectKey,
        timestamp,
      }),
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to upload file' }),
    };
  }
}
