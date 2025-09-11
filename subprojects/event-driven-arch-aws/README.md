# Event-Driven Architecture with AWS CDK and LocalStack

This project demonstrates a complete event-driven architecture in AWS using CDK for IaC, LocalStack for local development, and a complete event processing flow with S3, SNS, SQS, Lambda, and DynamoDB.

## 🏗️ Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   S3 Bucket │───▶│ SNS Topic   │───▶│ SQS Queue   │───▶│ Lambda      │
│             │    │             │    │             │    │ Processor   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │                   │                   │                   ▼
       │                   │                   │            ┌─────────────┐
       │                   │                   │            │ DynamoDB    │
       │                   │                   │            │ Events      │
       │                   │                   │            └─────────────┘
       │                   │                   │                   │
       │                   │                   │                   ▼
       │                   │                   │            ┌─────────────┐
       │                   │                   │            │ Confirmation│
       │                   │                   │            │ Queue       │
       │                   │                   │            └─────────────┘
       │                   │                   │                   │
       │                   │                   │                   ▼
       │                   │                   │            ┌─────────────┐
       │                   │                   │            │ Lambda      │
       │                   │                   │            │ Confirmation│
       │                   │                   │            └─────────────┘
       │                   │                   │
       │                   │                   └───▶┌─────────────┐
       │                   │                         │ DLQ         │
       │                   │                         │ (Dead Letter│
       │                   │                         │  Queue)     │
       │                   │                         └─────────────┘
       │                   │
       │                   └───▶┌─────────────┐
       │                         │ API Gateway│
       │                         │             │
       │                         └─────────────┘
       │
       └───▶┌─────────────┐
            │ EventBridge│
            │ Rules      │
            └─────────────┘
```

## 🚀 Features

- **Event Broker**: SNS as central event broker
- **Event Publisher**: Multiple sources (S3, API Gateway, scripts)
- **Event Subscriber**: SQS with asynchronous processing
- **IaC with CDK**: Complete infrastructure as code
- **LocalStack**: Local development and testing
- **Dead Letter Queue**: Error handling and retries
- **Idempotency**: Safe processing of duplicate events
- **Complete Testing**: Unit, integration and E2E tests
- **Polling with Backoff**: Robust result verification
- **Confirmations**: Status notification system

## 📋 Prerequisites

- Node.js 18+
- Docker and Docker Compose
- AWS CLI (optional, for production)
- CDK CLI: `npm install -g aws-cdk`

## 🛠️ Installation

1. **Clone and install dependencies:**
```bash
cd subprojects/event-driven-arch-aws
npm install
```

2. **Start LocalStack:**
```bash
npm run localstack:start
```

3. **Build the project:**
```bash
npm run build
```

## 🏃‍♂️ Usage

### Local Development

1. **Start LocalStack:**
```bash
npm run localstack:start
```

2. **Deploy local infrastructure:**
```bash
npm run cdk:deploy
```

3. **Run tests:**
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# All tests
npm test
```

### Utility Scripts

1. **Upload test file:**
```bash
npm run upload:test
```

2. **Trigger manual event:**
```bash
npm run trigger:event
```

### Production

1. **Configure AWS:**
```bash
aws configure
```

2. **Deploy to AWS:**
```bash
npm run cdk:deploy
```

3. **Destroy infrastructure:**
```bash
npm run cdk:destroy
```

## 🧪 Testing

### Test Types

1. **Unit Tests** (`test/unit/`)
   - Individual Lambda function tests
   - AWS service mocks
   - Business logic validation

2. **Integration Tests** (`test/integration/`)
   - Complete event flow
   - Service interaction
   - Error handling and DLQ

3. **End-to-End Tests** (`test/e2e/`)
   - Complete user journey
   - Concurrency tests
   - Idempotency validation

### Testing Features

- **Await/Timeouts**: Tests wait for asynchronous processing
- **Polling with Backoff**: Exponential result verification
- **DLQ Testing**: Error injection and DLQ validation
- **Idempotency**: Duplicate event sending
- **Concurrency**: Multiple simultaneous events

### Run Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Test coverage
npm run test:coverage

# Tests in watch mode
npm run test:watch
```

## 📁 Project Structure

```
event-driven-arch-aws/
├── src/
│   ├── bin/
│   │   └── event-driven-arch.ts      # CDK entry point
│   ├── lib/
│   │   └── event-driven-arch-stack.ts # Main stack
│   └── lambda/
│       ├── s3-event-processor.ts     # Processes S3 events
│       ├── sqs-message-processor.ts  # Processes SQS messages
│       ├── confirmation-sender.ts    # Sends confirmations
│       └── api-handler.ts            # Handles API Gateway
├── test/
│   ├── setup.ts                      # Test configuration
│   ├── unit/                         # Unit tests
│   ├── integration/                  # Integration tests
│   └── e2e/                          # End-to-end tests
├── scripts/
│   ├── upload-test-file.js           # Upload script
│   └── trigger-event.js              # Event script
├── docker-compose.yml                # LocalStack
├── cdk.json                          # CDK configuration
├── jest.config.js                    # Jest configuration
└── package.json                      # Dependencies
```

## 🔧 Configuration

### Environment Variables

```bash
# LocalStack
AWS_ENDPOINT_URL=http://localhost:4566
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# Services
DYNAMODB_TABLE=event-driven-events
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:000000000000:event-driven-main-topic
S3_BUCKET=test-event-driven-files
CONFIRMATION_QUEUE_URL=http://localhost:4566/000000000000/event-driven-confirmation-queue
```

### LocalStack

The `docker-compose.yml` file configures LocalStack with:
- S3, SQS, SNS, Lambda, DynamoDB
- Data persistence
- Debug enabled
- Exposed ports

## 📊 Monitoring

### CloudWatch Logs

Each Lambda function has its own Log Group:
- `/aws/lambda/s3-event-processor`
- `/aws/lambda/sqs-message-processor`
- `/aws/lambda/confirmation-sender`
- `/aws/lambda/api-handler`

### Metrics

- Events processed per minute
- Processing time
- Errors and retries
- Messages in DLQ

## 🔒 Security

- Minimum required IAM roles
- Encryption in transit and at rest
- CORS configured for API Gateway
- TTL in DynamoDB for automatic cleanup

## 🚨 Error Handling

### Dead Letter Queue (DLQ)
- Failed messages after 3 attempts
- 14-day retention
- Monitoring and alerts

### Retries
- Exponential backoff
- Configurable timeouts
- Detailed logging

### Idempotency
- Unique IDs for events
- Duplicate verification
- Consistent state

## 📈 Scalability

- Lambda auto-scaling
- SQS with parallel processing
- DynamoDB on-demand billing
- S3 with versioning

## 🔄 Event Flow

1. **Trigger**: File upload to S3 or manual event
2. **S3 Event**: EventBridge triggers Lambda
3. **SNS**: Lambda publishes to SNS topic
4. **SQS**: SNS delivers to SQS queue
5. **Processing**: Lambda processes message
6. **Storage**: Event saved to DynamoDB
7. **Confirmation**: Confirmation sent
8. **Notification**: User notified

## 🛠️ Useful Commands

```bash
# View LocalStack logs
npm run localstack:logs

# Stop LocalStack
npm run localstack:stop

# View CDK differences
npm run cdk:diff

# Synthesize CloudFormation
npm run cdk:synth

# Clean build
rm -rf dist/
```

## 🤝 Contributing

1. Fork the project
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🆘 Troubleshooting

### LocalStack won't start
```bash
# Check Docker
docker --version
docker-compose --version

# Clean containers
docker-compose down -v
docker system prune -f

# Restart LocalStack
npm run localstack:start
```

### Tests fail
```bash
# Check LocalStack
curl http://localhost:4566/health

# Clean test data
npm run test:clean

# Run individual tests
npm run test:unit
```

### CDK deployment fails
```bash
# Check AWS configuration
aws configure list

# Clean CDK cache
rm -rf cdk.out/

# Reinstall dependencies
rm -rf node_modules/
npm install
```

## 📞 Support

For questions or issues:
1. Review the documentation
2. Check LocalStack logs
3. Run diagnostic tests
4. Create issue in the repository
