#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { resolve, join } from 'path'
import { existsSync, readdirSync } from 'node:fs'

const app = new cdk.App()
const tenant = app.node.tryGetContext('tenant')

const id = ['chatbot-ai', tenant].join('-')
const appsDir = resolve(__dirname, '..', 'apps')

const defineStacks = () => {
  const services = readdirSync(appsDir, { withFileTypes: true })

  services.forEach(async (service) => {
    if (service.isDirectory()) {
      const stackPath = join(appsDir, service.name, 'iac', 'stack.ts')
      try {
        if (existsSync(stackPath)) {
          const stack = await import(stackPath)
          new stack.default(app, `${id}-${service.name}`, {})
        }
      } catch (error) {
        console.error(
          `Erro ao carregar a stack do serviço ${service.name}:`,
          error,
        )
      }
    }
  })
}

defineStacks()
