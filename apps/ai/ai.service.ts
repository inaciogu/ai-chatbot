import { OpenaiGateway } from './openai.gateway'
import { Model } from 'dynamodb-onetable'
import { Conversation, ConversationSchema } from './ai-conversation.model'
import { OnetableService } from '../commons/dynamodb/onetable.service'
import { CommunicationMessagePayload } from '../core/message'
import { Run } from 'openai/resources/beta/threads'

const assistantId = 'asst_7jFOEaBx5A9QU2EWVFvIJzNX'

export class AiService {
  private openaiGateway: OpenaiGateway
  private conversation: Model<Conversation>

  constructor(oneTableService: OnetableService) {
    this.openaiGateway = new OpenaiGateway()
    this.conversation = oneTableService.createModel(
      'Conversation',
      ConversationSchema.fields,
    )
  }

  public async generateResponse(message: CommunicationMessagePayload) {
    const conversation = await this.conversation.get({
      userId: message.recipient,
    })

    if (!conversation) {
      const run = await this.openaiGateway.createThreadAndRun({
        assistant_id: assistantId,
        thread: {
          messages: [{ role: 'user', content: message.content }],
        },
      })

      await this.conversation.create({
        threadId: run.thread_id,
        userId: message.recipient,
        ttl: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      })

      return this.getMessage(run)
    }

    await this.openaiGateway.addMessageToThread(
      conversation.threadId as string,
      message.content,
    )

    const run = await this.openaiGateway.createRun(
      conversation.threadId as string,
      assistantId,
    )

    return this.getMessage(run)
  }

  private async getMessage(run: Run) {
    if (run.status === 'completed') {
      const messages = await this.openaiGateway.listThreadMessages(
        run.thread_id,
      )
      console.log('messages', messages.data[0])

      // The first message is the assistant's response
      const lastMessage = messages.data[0]

      const content = lastMessage.content[0]
      if (content.type === 'text') {
        return content.text.value
      }
    }

    return
  }
}
