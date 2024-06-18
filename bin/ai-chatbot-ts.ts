#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AiChatbotTsStack } from '../lib/ai-chatbot-ts-stack';

const app = new cdk.App();
const tenant = app.node.tryGetContext('tenant');

new AiChatbotTsStack(app, ['chatbot-ai', tenant].join('-'), {});