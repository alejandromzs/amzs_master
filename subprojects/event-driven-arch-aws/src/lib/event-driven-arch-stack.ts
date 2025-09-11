import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

export class EventDrivenArchStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket for files
    const fileBucket = new s3.Bucket(this, 'FileBucket', {
      bucketName: `${this.account}-${this.region}-event-driven-files`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // DynamoDB Table for event tracking
    const eventsTable = new dynamodb.Table(this, 'EventsTable', {
      tableName: 'event-driven-events',
      partitionKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
    });

    // Main SNS Topic
    const mainTopic = new sns.Topic(this, 'MainTopic', {
      topicName: 'event-driven-main-topic',
      displayName: 'Event Driven Architecture Main Topic',
    });

    // Main SQS Queue with DLQ
    const dlq = new sqs.Queue(this, 'DeadLetterQueue', {
      queueName: 'event-driven-dlq',
      retentionPeriod: cdk.Duration.days(14),
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    const mainQueue = new sqs.Queue(this, 'MainQueue', {
      queueName: 'event-driven-main-queue',
      visibilityTimeout: cdk.Duration.seconds(30),
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
    });

    // SQS Queue for confirmations
    const confirmationQueue = new sqs.Queue(this, 'ConfirmationQueue', {
      queueName: 'event-driven-confirmation-queue',
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    // Lambda Function to process S3 events
    const s3EventProcessor = new nodejs.NodejsFunction(this, 'S3EventProcessor', {
      functionName: 's3-event-processor',
      entry: path.join(__dirname, '../lambda/s3-event-processor.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        SNS_TOPIC_ARN: mainTopic.topicArn,
        DYNAMODB_TABLE: eventsTable.tableName,
        CONFIRMATION_QUEUE_URL: confirmationQueue.queueUrl,
      },
    });

    // Lambda Function to process SQS messages
    const sqsMessageProcessor = new nodejs.NodejsFunction(this, 'SQSMessageProcessor', {
      functionName: 'sqs-message-processor',
      entry: path.join(__dirname, '../lambda/sqs-message-processor.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        DYNAMODB_TABLE: eventsTable.tableName,
        CONFIRMATION_QUEUE_URL: confirmationQueue.queueUrl,
      },
    });

    // Lambda Function to send confirmations
    const confirmationSender = new nodejs.NodejsFunction(this, 'ConfirmationSender', {
      functionName: 'confirmation-sender',
      entry: path.join(__dirname, '../lambda/confirmation-sender.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        DYNAMODB_TABLE: eventsTable.tableName,
      },
    });

    // Lambda Function for API Gateway
    const apiHandler = new nodejs.NodejsFunction(this, 'ApiHandler', {
      functionName: 'api-handler',
      entry: path.join(__dirname, '../lambda/api-handler.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        SNS_TOPIC_ARN: mainTopic.topicArn,
        S3_BUCKET: fileBucket.bucketName,
        DYNAMODB_TABLE: eventsTable.tableName,
      },
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'EventDrivenApi', {
      restApiName: 'Event Driven API',
      description: 'API para la arquitectura event-driven',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const eventsResource = api.root.addResource('events');
    eventsResource.addMethod('POST', new apigateway.LambdaIntegration(apiHandler));
    eventsResource.addMethod('GET', new apigateway.LambdaIntegration(apiHandler));

    const uploadResource = api.root.addResource('upload');
    uploadResource.addMethod('POST', new apigateway.LambdaIntegration(apiHandler));

    // EventBridge Rule for S3
    const s3EventRule = new events.Rule(this, 'S3EventRule', {
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: {
            name: [fileBucket.bucketName],
          },
        },
      },
    });
    s3EventRule.addTarget(new targets.LambdaFunction(s3EventProcessor));

    // EventBridge Rule for SNS
    const snsEventRule = new events.Rule(this, 'SNSEventRule', {
      eventPattern: {
        source: ['aws.sns'],
        detailType: ['AWS API Call via CloudTrail'],
        detail: {
          eventSource: ['sns.amazonaws.com'],
          eventName: ['Publish'],
        },
      },
    });

    // SNS Subscription for SQS
    mainTopic.addSubscription(new sns.Subscriptions.SqsSubscription(mainQueue));

    // SQS Event Source Mapping
    const sqsEventSource = new lambda.EventSourceMapping(this, 'SQSEventSource', {
      target: sqsMessageProcessor,
      eventSourceArn: mainQueue.queueArn,
      batchSize: 1,
      maxBatchingWindow: cdk.Duration.seconds(5),
    });

    const confirmationEventSource = new lambda.EventSourceMapping(this, 'ConfirmationEventSource', {
      target: confirmationSender,
      eventSourceArn: confirmationQueue.queueArn,
      batchSize: 1,
      maxBatchingWindow: cdk.Duration.seconds(5),
    });

    // Permissions
    fileBucket.grantReadWrite(s3EventProcessor);
    mainTopic.grantPublish(s3EventProcessor);
    mainTopic.grantPublish(apiHandler);
    eventsTable.grantReadWriteData(s3EventProcessor);
    eventsTable.grantReadWriteData(sqsMessageProcessor);
    eventsTable.grantReadWriteData(confirmationSender);
    eventsTable.grantReadWriteData(apiHandler);
    fileBucket.grantReadWrite(apiHandler);
    mainQueue.grantConsumeMessages(sqsMessageProcessor);
    confirmationQueue.grantConsumeMessages(confirmationSender);
    confirmationQueue.grantSendMessages(sqsMessageProcessor);

    // CloudWatch Log Groups
    new logs.LogGroup(this, 'S3EventProcessorLogs', {
      logGroupName: `/aws/lambda/${s3EventProcessor.functionName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new logs.LogGroup(this, 'SQSMessageProcessorLogs', {
      logGroupName: `/aws/lambda/${sqsMessageProcessor.functionName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new logs.LogGroup(this, 'ConfirmationSenderLogs', {
      logGroupName: `/aws/lambda/${confirmationSender.functionName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new logs.LogGroup(this, 'ApiHandlerLogs', {
      logGroupName: `/aws/lambda/${apiHandler.functionName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: fileBucket.bucketName,
      description: 'S3 bucket name',
    });

    new cdk.CfnOutput(this, 'SNSTopicArn', {
      value: mainTopic.topicArn,
      description: 'SNS topic ARN',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: eventsTable.tableName,
      description: 'DynamoDB table name',
    });
  }
}
