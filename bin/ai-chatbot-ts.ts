#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { resolve, join } from 'path'
import { existsSync } from 'node:fs'

const app = new cdk.App()
const tenant = app.node.tryGetContext('tenant')
const service = app.node.tryGetContext('service')

const id = ['chatbot-ai', tenant].join('-')
const appsDir = resolve(__dirname, '..', 'apps')

const defineStacks = async () => {
  const stackPath = join(appsDir, service, 'iac', 'stack.ts')
  try {
    if (existsSync(stackPath)) {
      const stack = await import(stackPath)
      new stack.default(app, `${id}-${service}`, {})
    }
  } catch (error) {
    console.error(`Erro ao carregar a stack do serviço ${service.name}:`, error)
  }
}

defineStacks()
