import { AxiosClient } from '../commons/axios/client'

type SendMessageInput = {
  recipient: string
  type: 'text' | 'image' | 'video'
  body: Record<string, any>
  phoneId: string
}

export class WhatsAppGateway {
  constructor(private readonly axios: AxiosClient) {
    this.axios = new AxiosClient({
      baseUrl: 'https://graph.facebook.com/v18.0',
    })
  }

  async sendMessage(input: SendMessageInput) {
    return this.axios.request({
      url: `/${input.phoneId}/messages`,
      method: 'POST',
      data: {
        messaging_product: 'whatsapp',
        to: input.recipient,
        recipient_type: 'individual',
        type: input.type,
        [input.type]: input.body,
      },
    })
  }
}
