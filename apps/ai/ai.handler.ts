import { SQSEvent } from 'aws-lambda'
import {
  CommunicationMessage,
  CommunicationMessagePayload,
} from '../core/message'
import { SnsEventEmitter } from '../commons/events/sns-event-emitter'
import { AiService } from './ai.service'
import { OnetableService } from '../commons/dynamodb/onetable.service'

const eventEmitter = new SnsEventEmitter()
const oneTableService = new OnetableService(
  `ai-chatbot-ai-${process.env.TENANT}`,
)
const aiService = new AiService(oneTableService)

export async function handler(event: SQSEvent) {
  for (const record of event.Records) {
    const message: CommunicationMessagePayload = JSON.parse(record.body)
    console.log('message', message)

    const response = await aiService.generateResponse(message)

    console.log('response', response)

    const communicationMessage = new CommunicationMessage({
      content: response as string,
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
