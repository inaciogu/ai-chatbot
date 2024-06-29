import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
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
import { Queue } from 'aws-cdk-lib/aws-sqs'
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import { PubSub } from './pub-sub'
import { Topic } from 'aws-cdk-lib/aws-sns'

export type BaseStackProps = StackProps & {
  serviceName: string
  withWebhook?: boolean
}

export class BaseStack extends Stack {
  pubsub: PubSub

  constructor(
    scope: Construct,
    id: string,
    private props: BaseStackProps,
  ) {
    super(scope, id, props)
    this.pubsub = new PubSub(this, `${id}-pubsub`, {
      serviceName: props.serviceName,
    })
    this.createDynamoDb()
    this.createEventHandlingFunction(
      `apps/${props.serviceName}/${props.serviceName}.handler.ts`,
    )
    if (props.withWebhook) {
      this.createWebhookFunction(`apps/${props.serviceName}/webhook.handler.ts`)
    }
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
      functionName: `${this.props.serviceName}-webhook-${tenant}`,
      environment: {
        TENANT: tenant,
        TOPIC_ARN: this.pubsub.topicArn,
      },
    })

    const topic = Topic.fromTopicArn(this, `${id}-topic`, this.pubsub.topicArn)
    topic.grantPublish(handler)

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

    const lambda = new NodejsFunction(this, `${id}-event-handler`, {
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

    this.createPubSubForEvents(lambda)

    lambda.addEnvironment('TOPIC_ARN', this.pubsub.topicArn)
  }

  private createPubSubForEvents(lambda: NodejsFunction) {
    const tenant = this.node.getContext('tenant')
    const id = this.node.id

    const queue = new Queue(this, `${id}-queue`, {
      queueName: `${this.props.serviceName}-queue-${tenant}.fifo`,
      visibilityTimeout: Duration.seconds(30),
      retentionPeriod: Duration.days(14),
      fifo: true,
    })

    this.pubsub.subscribe(queue)

    lambda.addEventSource(new SqsEventSource(queue))
  }
}
