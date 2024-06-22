import * as cdk from 'aws-cdk-lib'
import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions'
import * as iam from 'aws-cdk-lib/aws-iam'
import {
  FunctionUrlAuthType,
  HttpMethod,
  InvokeMode,
} from 'aws-cdk-lib/aws-lambda'
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources'
import {
  AttributeType,
  BillingMode,
  StreamViewType,
  Table,
} from 'aws-cdk-lib/aws-dynamodb'

export class WhatsAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const webhook = this.createWebhookFunction()
    const { topic, queue } = this.createPubSubForWebhook(webhook)

    this.createWhatsAppMessageHandler(queue)

    webhook.addEnvironment('TOPIC_ARN', topic.topicArn)
  }

  createWebhookFunction() {
    const tenant = this.node.getContext('tenant')
    const id = this.node.id

    const handler = new lambda.NodejsFunction(this, `${id}-webhook`, {
      entry: 'app/whatsapp/webhook.handler.ts',
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

    return handler
  }

  createPubSubForWebhook(grantee: iam.IGrantable) {
    const tenant = this.node.getContext('tenant')
    const id = this.node.id

    const topic = new sns.Topic(this, `${id}-topic`, {
      topicName: `new-whatsapp-message-${tenant}.fifo`,
      fifo: true,
    })

    const queue = new sqs.Queue(this, `${id}-queue`, {
      visibilityTimeout: cdk.Duration.seconds(30),
      queueName: `whatsapp-messages-${tenant}.fifo`,
      fifo: true,
    })

    topic.addSubscription(
      new subs.SqsSubscription(queue, {
        rawMessageDelivery: true,
      }),
    )

    topic.grantPublish(grantee)
    queue.grantSendMessages(grantee)

    return {
      topic,
      queue,
    }
  }

  createWhatsAppMessageHandler(queue: sqs.Queue) {
    const tenant = this.node.getContext('tenant')
    const id = this.node.id

    const handler = new lambda.NodejsFunction(this, `${id}-wpp`, {
      entry: 'app/whatsapp/whatsapp.handler.ts',
      handler: 'handler',
      functionName: `whatsAppMessageHandler-${tenant}`,
      environment: {
        TENANT: tenant,
      },
    })

    // trigger the handler when a message is sent to the queue
    queue.grantConsumeMessages(handler)
    handler.addEventSource(new SqsEventSource(queue))

    return handler
  }

  createDynamodb() {
    const tenant = this.node.getContext('tenant')
    const id = this.node.id

    return new Table(this, `${id}-table`, {
      tableName: `whatsapp-sessions-${tenant}`,
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'pk', type: AttributeType.STRING },
      sortKey: { name: 'sk', type: AttributeType.STRING },
      timeToLiveAttribute: 'ttl',
      removalPolicy: RemovalPolicy.DESTROY,
    })
  }
}
