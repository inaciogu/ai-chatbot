import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import {
  AttributeType,
  BillingMode,
  StreamViewType,
  Table,
} from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import {
  FunctionUrlAuthType,
  HttpMethod,
  InvokeMode,
} from 'aws-cdk-lib/aws-lambda'
import { Topic } from 'aws-cdk-lib/aws-sns'
import { Queue } from 'aws-cdk-lib/aws-sqs'
import { SqsSubscription } from 'aws-cdk-lib/aws-sns-subscriptions'
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'

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

    handler.addFunctionUrl({
      cors: {
        allowedMethods: [HttpMethod.GET, HttpMethod.POST],
        allowedHeaders: ['*'],
        allowedOrigins: ['*'],
      },
      authType: FunctionUrlAuthType.NONE,
      invokeMode: InvokeMode.BUFFERED,
    })
  }

  public createEventHandlingFunction(entry: string) {
    const tenant = this.node.getContext('tenant')
    const id = this.node.id

    return new NodejsFunction(this, `${id}-event-handler`, {
      entry,
      handler: 'handler',
      functionName: `${this.props.serviceName}-events-${tenant}`,
      environment: {
        TENANT: tenant,
      },
      logGroup: new LogGroup(this, `${this.props.serviceName}-events-lambda`, {
        logGroupName: `/aws/lambda/${this.props.serviceName}-events-${tenant}`,
        removalPolicy: RemovalPolicy.DESTROY,
        retention: RetentionDays.TWO_MONTHS,
      }),
    })
  }

  public createPubSubForEventHandling(grantee: NodejsFunction) {
    const tenant = this.node.getContext('tenant')
    const id = this.node.id

    const topic = new Topic(this, `${id}-ai-communication-topic`, {
      topicName: `${this.props.serviceName}-event-${tenant}-topic`,
    })

    const queue = new Queue(this, `${id}-ai-communication-queue`, {
      queueName: `${this.props.serviceName}-events-${tenant}-queue`,
    })

    topic.grantPublish(grantee)
    queue.grantConsumeMessages(grantee)

    topic.addSubscription(
      new SqsSubscription(queue, {
        rawMessageDelivery: true,
        filterPolicy: {
          service: { conditions: [this.props.serviceName] },
        },
      }),
    )

    grantee.addEventSource(new SqsEventSource(queue))
    grantee.addEnvironment('TOPIC_ARN', topic.topicArn)

    return { topic, queue }
  }

  public createPubSubForWebhook(grantee: NodejsFunction) {
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

    grantee.addEventSource(new SqsEventSource(queue))

    return { topic, queue }
  }
}
