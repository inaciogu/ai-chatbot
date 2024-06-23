import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import {
  AttributeType,
  BillingMode,
  StreamViewType,
  Table,
} from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs'
import {
  FunctionUrlAuthType,
  HttpMethod,
  InvokeMode,
} from 'aws-cdk-lib/aws-lambda'
import { Topic } from 'aws-cdk-lib/aws-sns'
import { Queue } from 'aws-cdk-lib/aws-sqs'
import { IGrantable } from 'aws-cdk-lib/aws-iam'
import { SqsSubscription } from 'aws-cdk-lib/aws-sns-subscriptions'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'

export type BaseStackProps = StackProps & {
  serviceName: string
}

export class BaseStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    private props: BaseStackProps,
  ) {
    super(scope, id, props)
  }

  public createDynamoDb() {
    const tenant = this.node.getContext('tenant')
    const id = this.node.id

    return new Table(this, `${id}-table`, {
      tableName: `ai-chatbot-${this.props.serviceName}-${tenant}`,
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'pk', type: AttributeType.STRING },
      sortKey: { name: 'sk', type: AttributeType.STRING },
      timeToLiveAttribute: 'ttl',
      removalPolicy: RemovalPolicy.DESTROY,
    })
  }

  public createWebhookFunction(entry: string) {
    const tenant = this.node.getContext('tenant')
    const id = this.node.id

    const handler = new lambda.NodejsFunction(this, `${id}-webhook`, {
      entry,
      handler: 'handler',
      functionName: `whatsAppWebhookIntegration-${tenant}`,
      environment: {
        TENANT: tenant,
      },
    })

    const { url } = handler.addFunctionUrl({
      cors: {
        allowedMethods: [HttpMethod.GET, HttpMethod.POST],
        allowedHeaders: ['*'],
        allowedOrigins: ['*'],
      },
      authType: FunctionUrlAuthType.NONE,
      invokeMode: InvokeMode.BUFFERED,
    })

    new CfnOutput(this, 'AiChatbotTsFunctionArn', {
      value: url,
    })

    const { topic } = this.createPubSubForWebhook(handler)

    handler.addEnvironment('TOPIC_ARN', topic.topicArn)

    return handler
  }

  public createEventHandlingFunction(entry: string) {
    const tenant = this.node.getContext('tenant')
    const id = this.node.id

    const handler = new NodejsFunction(this, `${id}-event-handler`, {
      entry,
      handler: 'handler',
      functionName: `${this.props.serviceName}-events-${tenant}`,
      environment: {
        TENANT: tenant,
      },
    })

    const { topic } = this.createPubSubForEventHandling(handler)

    handler.addEnvironment('TOPIC_ARN', topic.topicArn)

    return handler
  }

  private createPubSubForEventHandling(grantee: IGrantable) {
    const tenant = this.node.getContext('tenant')
    const id = this.node.id

    const topic = new Topic(this, `${id}-topic`, {
      topicName: `${this.props.serviceName}-event-${tenant}-topic`,
    })

    const queue = new Queue(this, `${id}-queue`, {
      queueName: `${this.props.serviceName}-events-${tenant}-queue`,
    })

    topic.grantPublish(grantee)
    queue.grantConsumeMessages(grantee)

    topic.addSubscription(
      new SqsSubscription(queue, {
        rawMessageDelivery: true,
      }),
    )

    return { topic, queue }
  }

  private createPubSubForWebhook(grantee: IGrantable) {
    const tenant = this.node.getContext('tenant')
    const id = this.node.id

    const topic = new Topic(this, `${id}-topic`, {
      topicName: `${this.props.serviceName}-message-${tenant}-topic`,
    })

    const queue = new Queue(this, `${id}-queue`, {
      queueName: `${this.props.serviceName}-webhook-${tenant}-queue`,
    })

    topic.grantPublish(grantee)
    queue.grantConsumeMessages(grantee)

    topic.addSubscription(
      new SqsSubscription(queue, {
        rawMessageDelivery: true,
      }),
    )

    return { topic, queue }
  }
}
