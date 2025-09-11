#!/usr/bin/env node

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configure AWS SDK for LocalStack
const localstackConfig = {
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
  accessKeyId: 'test',
  secretAccessKey: 'test',
};

AWS.config.update(localstackConfig);

const s3 = new AWS.S3();
const sns = new AWS.SNS();

async function uploadTestFile() {
  try {
    const fileName = `test-file-${Date.now()}.txt`;
    const fileContent = `This is a test file uploaded at ${new Date().toISOString()}\nContent for testing event-driven architecture.`;
    
    const bucketName = process.env.S3_BUCKET || 'test-event-driven-files';
    const topicArn = process.env.SNS_TOPIC_ARN || 'arn:aws:sns:us-east-1:000000000000:event-driven-main-topic';
    
    console.log(`📁 Uploading test file: ${fileName}`);
    console.log(`📦 Bucket: ${bucketName}`);
    console.log(`📡 Topic: ${topicArn}`);

    // Upload file to S3
    const uploadParams = {
      Bucket: bucketName,
      Key: `uploads/${fileName}`,
      Body: fileContent,
      ContentType: 'text/plain',
      Metadata: {
        uploadedAt: new Date().toISOString(),
        testType: 'manual-upload',
      },
    };

    const uploadResult = await s3.putObject(uploadParams).promise();
    console.log(`✅ File uploaded successfully to S3`);
    console.log(`🔗 S3 Object Key: uploads/${fileName}`);

    // Publish event to SNS
    const eventId = `manual-upload-${Date.now()}`;
    const snsMessage = {
      eventId,
      timestamp: new Date().toISOString(),
      eventType: 'FILE_UPLOADED',
      source: 'MANUAL_SCRIPT',
      data: {
        bucketName,
        objectKey: `uploads/${fileName}`,
        fileName,
        fileSize: fileContent.length,
        uploadResult: uploadResult.ETag,
      },
    };

    const snsParams = {
      TopicArn: topicArn,
      Message: JSON.stringify(snsMessage),
      MessageAttributes: {
        eventType: {
          DataType: 'String',
          StringValue: 'FILE_UPLOADED',
        },
        source: {
          DataType: 'String',
          StringValue: 'MANUAL_SCRIPT',
        },
      },
    };

    const snsResult = await sns.publish(snsParams).promise();
    console.log(`✅ Event published to SNS`);
    console.log(`📨 Message ID: ${snsResult.MessageId}`);
    console.log(`🆔 Event ID: ${eventId}`);

    console.log(`\n🎉 Test file upload completed successfully!`);
    console.log(`📋 Summary:`);
    console.log(`   - File: ${fileName}`);
    console.log(`   - Size: ${fileContent.length} bytes`);
    console.log(`   - Event ID: ${eventId}`);
    console.log(`   - S3 Key: uploads/${fileName}`);
    console.log(`   - SNS Message ID: ${snsResult.MessageId}`);

  } catch (error) {
    console.error('❌ Error uploading test file:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  uploadTestFile();
}

module.exports = { uploadTestFile };
