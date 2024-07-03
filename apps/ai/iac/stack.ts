import { BaseStack } from '../../commons/cdk/base-stack'
import { Construct } from 'constructs'
import { StackProps } from 'aws-cdk-lib'

export default class AIStack extends BaseStack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      ...props,
      serviceName: 'ai',
    })
  }
}
