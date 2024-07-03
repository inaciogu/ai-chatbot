import { AxiosClient } from '../commons/axios/client'

type SendMessageOutput = {
  message_id: string
  conversation_id: string
  answer: string
}

type SendMessageInput = {
  inputs: Record<string, string>
  conversation_id?: string
  response_mode: string
  user: string
  query: string
}

type GetConversationOutput = {
  data: {
    id: string
    name: string
    inputs: Record<string, string>
  }[]
}

export class DifyAiGateway {
  private axios: AxiosClient

  constructor() {
    this.axios = new AxiosClient({
      baseUrl: 'https://api.dify.ai/v1',
      headers: {
        Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
      },
    })
  }

  public async sendChatMessage(input: SendMessageInput) {
    const conversation = await this.getConversation(input.user)

    if (conversation) {
      input.conversation_id = conversation.id
    }

    const response = await this.axios.request<SendMessageOutput>({
      url: '/chat-messages',
      method: 'POST',
      data: input,
    })

    return response.data
  }

  private async getConversation(userId: string) {
    const { data } = await this.axios.request<GetConversationOutput>({
      url: `/conversations?user=${userId}`,
      method: 'GET',
    })

    return data.data[0]
  }
}
