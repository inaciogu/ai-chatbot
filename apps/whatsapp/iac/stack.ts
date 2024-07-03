import { StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { BaseStack } from '../../commons/cdk/base-stack'

export default class WhatsAppStack extends BaseStack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      ...props,
      serviceName: 'whatsapp',
      withWebhook: true,
    })
  }
}
