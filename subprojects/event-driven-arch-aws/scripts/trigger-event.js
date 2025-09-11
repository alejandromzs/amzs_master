#!/usr/bin/env node

const AWS = require('aws-sdk');
const readline = require('readline');

// Configure AWS SDK for LocalStack
const localstackConfig = {
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
  accessKeyId: 'test',
  secretAccessKey: 'test',
};

AWS.config.update(localstackConfig);

const sns = new AWS.SNS();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function triggerEvent() {
  try {
    const topicArn = process.env.SNS_TOPIC_ARN || 'arn:aws:sns:us-east-1:000000000000:event-driven-main-topic';
    const tableName = process.env.DYNAMODB_TABLE || 'event-driven-events-test';

    console.log('🚀 Event Trigger Script');
    console.log('======================\n');

    // Get event type from user
    const eventType = await question('Enter event type (FILE_UPLOADED, MANUAL_EVENT, CLICK_EVENT): ');
    
    let eventData = {};
    
    switch (eventType.toUpperCase()) {
      case 'FILE_UPLOADED':
        const fileName = await question('Enter file name: ');
        const fileSize = await question('Enter file size (bytes): ');
        const bucketName = await question('Enter S3 bucket name: ');
        
        eventData = {
          fileName,
          fileSize: parseInt(fileSize),
          bucketName,
          objectKey: `uploads/${fileName}`,
        };
        break;
        
      case 'MANUAL_EVENT':
        const description = await question('Enter event description: ');
        const priority = await question('Enter priority (LOW, MEDIUM, HIGH): ');
        const userId = await question('Enter user ID: ');
        
        eventData = {
          description,
          priority: priority.toUpperCase(),
          userId,
          timestamp: new Date().toISOString(),
        };
        break;
        
      case 'CLICK_EVENT':
        const elementId = await question('Enter element ID: ');
        const pageUrl = await question('Enter page URL: ');
        const sessionId = await question('Enter session ID: ');
        
        eventData = {
          elementId,
          pageUrl,
          sessionId,
          clickTime: new Date().toISOString(),
          userAgent: 'Test User Agent',
        };
        break;
        
      default:
        console.log('❌ Invalid event type. Using default event data.');
        eventData = {
          type: eventType,
          description: 'Manual event triggered via script',
          timestamp: new Date().toISOString(),
        };
    }

    const eventId = `manual-trigger-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Create SNS message
    const snsMessage = {
      eventId,
      timestamp,
      eventType: eventType.toUpperCase(),
      source: 'MANUAL_TRIGGER',
      data: eventData,
    };

    console.log('\n📡 Publishing event to SNS...');
    console.log(`📋 Event ID: ${eventId}`);
    console.log(`📅 Timestamp: ${timestamp}`);
    console.log(`🏷️  Event Type: ${eventType.toUpperCase()}`);

    // Publish to SNS
    const snsParams = {
      TopicArn: topicArn,
      Message: JSON.stringify(snsMessage),
      MessageAttributes: {
        eventType: {
          DataType: 'String',
          StringValue: eventType.toUpperCase(),
        },
        source: {
          DataType: 'String',
          StringValue: 'MANUAL_TRIGGER',
        },
      },
    };

    const snsResult = await sns.publish(snsParams).promise();
    console.log(`✅ Event published to SNS`);
    console.log(`📨 Message ID: ${snsResult.MessageId}`);

    // Save to DynamoDB
    console.log('\n💾 Saving event to DynamoDB...');
    const dbRecord = {
      eventId,
      timestamp,
      eventType: eventType.toUpperCase(),
      source: 'MANUAL_TRIGGER',
      status: 'TRIGGERED',
      data: eventData,
      ttl: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 días
    };

    await dynamodb.put({
      TableName: tableName,
      Item: dbRecord,
    }).promise();

    console.log(`✅ Event saved to DynamoDB`);
    console.log(`📊 Table: ${tableName}`);

    console.log('\n🎉 Event triggered successfully!');
    console.log('📋 Summary:');
    console.log(`   - Event ID: ${eventId}`);
    console.log(`   - Type: ${eventType.toUpperCase()}`);
    console.log(`   - SNS Message ID: ${snsResult.MessageId}`);
    console.log(`   - DynamoDB Table: ${tableName}`);
    console.log(`   - Data: ${JSON.stringify(eventData, null, 2)}`);

  } catch (error) {
    console.error('❌ Error triggering event:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

  // Function to trigger event with predefined data
async function triggerPredefinedEvent(eventType = 'MANUAL_EVENT', customData = {}) {
  try {
    const topicArn = process.env.SNS_TOPIC_ARN || 'arn:aws:sns:us-east-1:000000000000:event-driven-main-topic';
    const tableName = process.env.DYNAMODB_TABLE || 'event-driven-events-test';

    const eventId = `predefined-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const defaultData = {
      description: 'Predefined event triggered via script',
      timestamp,
      ...customData,
    };

    const snsMessage = {
      eventId,
      timestamp,
      eventType: eventType.toUpperCase(),
      source: 'PREDEFINED_TRIGGER',
      data: defaultData,
    };

    // Publish to SNS
    const snsResult = await sns.publish({
      TopicArn: topicArn,
      Message: JSON.stringify(snsMessage),
      MessageAttributes: {
        eventType: {
          DataType: 'String',
          StringValue: eventType.toUpperCase(),
        },
        source: {
          DataType: 'String',
          StringValue: 'PREDEFINED_TRIGGER',
        },
      },
    }).promise();

    // Save to DynamoDB
    await dynamodb.put({
      TableName: tableName,
      Item: {
        eventId,
        timestamp,
        eventType: eventType.toUpperCase(),
        source: 'PREDEFINED_TRIGGER',
        status: 'TRIGGERED',
        data: defaultData,
        ttl: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
      },
    }).promise();

    return {
      eventId,
      messageId: snsResult.MessageId,
      timestamp,
    };
  } catch (error) {
    console.error('Error in predefined event trigger:', error);
    throw error;
  }
}

  // Execute if called directly
if (require.main === module) {
  triggerEvent();
}

module.exports = { triggerEvent, triggerPredefinedEvent };
