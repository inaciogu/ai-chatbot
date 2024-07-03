import { PublishCommand, SNSClient } from '@aws-sdk/client-sns'

type DispatchEventInput = {
  message: Record<string, any>
  toService: string
}

export class SnsEventEmitter {
  private static instance: SnsEventEmitter
  private readonly sns: SNSClient

  private constructor() {
    this.sns = new SNSClient()
  }

  public static getInstance(): SnsEventEmitter {
    if (!SnsEventEmitter.instance) {
      SnsEventEmitter.instance = new SnsEventEmitter()
    }

    return SnsEventEmitter.instance
  }

  public async dispatch(input: DispatchEventInput): Promise<void> {
    const command = new PublishCommand({
      Message: JSON.stringify(input.message),
      TopicArn: process.env.TOPIC_ARN,
      MessageAttributes: {
        service: { DataType: 'String', StringValue: input.toService },
      },
    })

    await this.sns.send(command)
  }
}
