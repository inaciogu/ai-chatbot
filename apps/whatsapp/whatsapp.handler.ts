import { SQSEvent } from 'aws-lambda'
import { CommunicationMessagePayload } from '../core/message'
import { WhatsAppGateway } from './whatsapp.gateway'

const whatsAppGateway = new WhatsAppGateway()

function toWhatsAppMessage(message: CommunicationMessagePayload) {
  if (message.contentType === 'text') {
    return {
      content: {
        body: message.content,
      },
      type: 'text',
    }
  }
  return {} as any
}

export async function handler(event: SQSEvent) {
  for (const record of event.Records) {
    const message: CommunicationMessagePayload = JSON.parse(record.body)

    if (message.sender === 'ai') {
      const whatsAppMessage = toWhatsAppMessage(message)
      await whatsAppGateway.sendMessage({
        recipient: message.recipient,
        type: whatsAppMessage.type,
        body: whatsAppMessage.content,
        phoneId: 'phoneId',
      })
    }
  }
}
