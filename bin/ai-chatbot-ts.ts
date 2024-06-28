#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { WhatsAppStack } from '../apps/whatsapp/iac/stack'
import { AIStack } from '../apps/ai/iac/stack'
import { CoreStack } from '../apps/core/iac/stack'

const app = new cdk.App()
const tenant = app.node.tryGetContext('tenant')

const id = ['chatbot-ai', tenant].join('-')

new CoreStack(app, `${id}-core`, {})
new WhatsAppStack(app, `${id}-whatsapp`, {})
new AIStack(app, `${id}-ai`, {})
