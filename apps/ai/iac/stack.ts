import { BaseStack } from '../../commons/iac/base-stack'
import { Construct } from 'constructs'
import { StackProps } from 'aws-cdk-lib'

export class AIStack extends BaseStack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      ...props,
      serviceName: 'ai',
    })
  }
}
