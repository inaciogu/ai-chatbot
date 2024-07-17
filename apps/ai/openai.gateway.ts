import OpenAI from 'openai'
import { ThreadCreateAndRunParamsNonStreaming } from 'openai/resources/beta'

export class OpenaiGateway {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI()
  }

  public async createThreadAndRun(
    params: ThreadCreateAndRunParamsNonStreaming,
  ) {
    return await this.client.beta.threads.createAndRunPoll(params)
  }

  public async addMessageToThread(threadId: string, message: string) {
    await this.client.beta.threads.messages.create(threadId, {
      content: message,
      role: 'user',
    })
  }

  public async listThreadMessages(threadId: string) {
    return this.client.beta.threads.messages.list(threadId)
  }

  public async createRun(threadId: string, assistantId: string) {
    return this.client.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: assistantId,
    })
  }
}
