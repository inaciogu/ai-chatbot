import { SQSEvent } from 'aws-lambda'
import {
  CommunicationMessage,
  CommunicationMessagePayload,
} from '../core/message'
import { DifyAiGateway } from './dify-ai.gateway'
import { randomUUID } from 'node:crypto'
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns'

const aiGateway = new DifyAiGateway()
const snsClient = new SNSClient()

export async function handler(event: SQSEvent) {
  for (const record of event.Records) {
    const message: CommunicationMessagePayload = JSON.parse(record.body)
    console.log('message', message)

    const response = await aiGateway.sendChatMessage({
      response_mode: 'blocking',
      query: message.content,
      user: message.recipient,
      inputs: {},
    })

    console.log('response', response)

    const communicationMessage = new CommunicationMessage({
      content: response.answer,
      service: 'ai',
      sender: message.sender,
      recipient: message.recipient,
      contentType: 'text',
    })

    console.log('communicationMessage', communicationMessage)

    const command = new PublishCommand({
      Message: JSON.stringify(communicationMessage.toJson()),
      TopicArn: process.env.TOPIC_ARN,
      MessageDeduplicationId: randomUUID(),
      MessageGroupId: 'whatsapp',
      MessageAttributes: {
        service: { DataType: 'String', StringValue: message.service },
      },
    })

    await snsClient.send(command)
  }
}
