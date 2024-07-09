import { PublishCommand, SNSClient } from '@aws-sdk/client-sns'
import { randomUUID } from 'node:crypto'

type DispatchEventInput = {
  message: Record<string, any>
  toService: string
  messageGroupId: string
}

export class SnsEventEmitter {
  private readonly sns: SNSClient

  constructor() {
    this.sns = new SNSClient()
  }

  public async dispatch(input: DispatchEventInput): Promise<void> {
    const command = new PublishCommand({
      Message: JSON.stringify(input.message),
      TopicArn: process.env.TOPIC_ARN,
      MessageGroupId: input.messageGroupId,
      MessageDeduplicationId: randomUUID(),
      MessageAttributes: {
        service: { DataType: 'String', StringValue: input.toService },
      },
    })

    await this.sns.send(command)
  }
}
