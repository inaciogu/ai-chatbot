import { Construct } from 'constructs'
import { Topic } from 'aws-cdk-lib/aws-sns'
import { IQueue } from 'aws-cdk-lib/aws-sqs'
import { SqsSubscription } from 'aws-cdk-lib/aws-sns-subscriptions'
import { Stack } from 'aws-cdk-lib'

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
    const region = Stack.of(this).region
    const account = Stack.of(this).account

    const communicationTopic = Topic.fromTopicArn(
      this,
      `ai-communication-topic-${tenant}`,
      `arn:aws:sns:${region}:${account}:ai-communication-${tenant}.fifo`,
    )

    this.topicArn = communicationTopic.topicArn

    communicationTopic.addSubscription(
      new SqsSubscription(queue, {
        filterPolicy: {
          service: { conditions: [this.props.serviceName] },
        },
        rawMessageDelivery: true,
      }),
    )
  }
}
