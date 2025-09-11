#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EventDrivenArchStack } from '../lib/event-driven-arch-stack';

const app = new cdk.App();
new EventDrivenArchStack(app, 'EventDrivenArchStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1' 
  },
});
