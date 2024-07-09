import { PublishCommand, SNSClient } from '@aws-sdk/client-sns'
import { randomUUID } from 'node:crypto'
import { CommunicationMessage } from '../core/message'
import { SnsEventEmitter } from '../commons/events/sns-event-emitter'

type TextMessage = {
  body: string
}

type MediaMessage = {
  id: string
  mime_type: string
}

type WhatsAppMessage = {
  text: TextMessage
  image: MediaMessage
  from: string
  type: string
}

type WebhookPayload = {
  entry: {
    id: string
    changes: {
      field: string
      value: {
        metadata: {
          phone_number_id: string
        }
        contacts: {
          profile: { name: string }
        }[]
        messages: WhatsAppMessage[]
      }
    }[]
  }[]
}

const eventEmitter = new SnsEventEmitter()

function mapWhatsAppMessage(message: WhatsAppMessage): string {
  const { text } = message

  if (text) {
    return text.body
  }

  return ''
}

async function dispatchCommunicationMessage(payload: WebhookPayload) {
  const { entry } = payload

  const entries = entry ?? []

  for (const entry of entries) {
    const changes = entry.changes ?? []
    for (const change of changes) {
      const { value } = change
      const { messages, metadata } = value

      for (const message of messages) {
        const communicationMessage = new CommunicationMessage({
          content: mapWhatsAppMessage(message),
          service: 'whatsapp',
          sender: metadata.phone_number_id,
          recipient: message.from,
          contentType: message.type,
        })

        await eventEmitter.dispatch({
          message: communicationMessage.toJson(),
          messageGroupId: 'whatsapp',
          toService: 'ai',
        })
      }
    }
  }
}

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
      return qs['hub.challenge']
    }
  }

  // webhook event handling
  if (httpMethod === 'POST') {
    const body = JSON.parse(event.body)
    await dispatchCommunicationMessage(body)
  }

  return 'nothing to see here'
}
