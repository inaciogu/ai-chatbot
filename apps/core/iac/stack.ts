import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { Topic } from 'aws-cdk-lib/aws-sns'

export default class CoreStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)
    this.createCommunicationTopic()
  }

  createCommunicationTopic() {
    const tenant = this.node.getContext('tenant')

    new Topic(this, `ai-communication-${tenant}`, {
      topicName: `ai-communication-${tenant}.fifo`,
      fifo: true,
    })
  }
}
