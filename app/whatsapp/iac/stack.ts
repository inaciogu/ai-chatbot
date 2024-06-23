import { StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { BaseStack } from '../../commons/iac/base-stack'

export class WhatsAppStack extends BaseStack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      ...props,
      serviceName: 'whatsapp',
    })

    this.createDynamoDb()
    this.createWebhookFunction('app/whatsapp/webhook.handler.ts')
    this.createEventHandlingFunction('app/whatsapp/whatsapp.handler.ts')
  }
}
