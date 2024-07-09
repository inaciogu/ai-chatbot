import { SQSEvent } from 'aws-lambda'
import {
  CommunicationMessage,
  CommunicationMessagePayload,
} from '../core/message'
import { DifyAiGateway } from './dify-ai.gateway'
import { SnsEventEmitter } from '../commons/events/sns-event-emitter'

const aiGateway = new DifyAiGateway()
const eventEmitter = new SnsEventEmitter()

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

    await eventEmitter.dispatch({
      message: communicationMessage.toJson(),
      toService: message.service,
      messageGroupId: 'ai',
    })
  }
}
