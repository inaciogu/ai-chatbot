import { PublishCommand, SNSClient } from '@aws-sdk/client-sns'
import { randomUUID } from 'node:crypto'

export async function handler(event: any) {
  const httpMethod = event.requestContext.http.method

  // webhook validation verification
  if (httpMethod === 'GET') {
    const qs = event?.queryStringParameters

    if (!qs) {
      return 'nothing to see here'
    }

    if (
      qs['hub.mode'] === 'subscribe' &&
      qs['hub.verify_token'] === process.env.VERIFY_TOKEN
    ) {
      console.log('challenge', qs['hub.challenge'])
      return qs['hub.challenge']
    }
  }

  // webhook event handling
  if (httpMethod === 'POST') {
    const client = new SNSClient()

    const command = new PublishCommand({
      Message: JSON.stringify({
        source: 'webhook',
        data: event.body,
      }),
      TopicArn: process.env.TOPIC_ARN,
      MessageDeduplicationId: randomUUID(),
      MessageGroupId: 'webhook',
      MessageAttributes: {
        service: { DataType: 'String', StringValue: 'whatsapp' },
      },
    })

    await client.send(command)
  }

  return 'nothing to see here'
}
