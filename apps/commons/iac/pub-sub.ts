import { Construct } from 'constructs'
import { Topic } from 'aws-cdk-lib/aws-sns'
import { IQueue } from 'aws-cdk-lib/aws-sqs'
import { SqsSubscription } from 'aws-cdk-lib/aws-sns-subscriptions'

export type PubSubProps = {
  serviceName: string
}

export class PubSub extends Construct {
  topicArn: string
  props: PubSubProps

  constructor(scope: Construct, id: string, props: PubSubProps) {
    super(scope, id)
    this.props = props
  }

  public subscribe(queue: IQueue) {
    const tenant = this.node.getContext('tenant')

    const communicationTopic = new Topic(this, `CommunicationTopic-${tenant}`, {
      topicName: `ai-communication-${tenant}`,
      fifo: true,
    })

    this.topicArn = communicationTopic.topicArn

    communicationTopic.addSubscription(
      new SqsSubscription(queue, {
        filterPolicy: {
          service: { conditions: [this.props.serviceName] },
        },
      }),
    )
  }
}
