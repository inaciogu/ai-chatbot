#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { WhatsAppStack } from '../app/whatsapp/iac/stack'

const app = new cdk.App()
const tenant = app.node.tryGetContext('tenant')

new WhatsAppStack(app, ['chatbot-ai', tenant].join('-'), {})
