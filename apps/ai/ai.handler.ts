import { SQSEvent } from 'aws-lambda'
import { CommunicationMessagePayload } from '../core/message'

export async function handler(event: SQSEvent) {
  for (const record of event.Records) {
    const message: CommunicationMessagePayload = JSON.parse(record.body)
    console.log('message', message)

    // const answer = ai.generateAnswer({ question: message.content })
    // const communicationMessage = new CommunicationMessage({
    //   content: answer,
    //   service: 'ai',
    //   sender: message.sender,
    //   recipient: message.recipient,
    //   contentType: 'text',
    // })
    // const command = new PublishCommand({
    //   Message: JSON.stringify(communicationMessage.toJson()),
    //   TopicArn: process.env.TOPIC_ARN,
    //   MessageDeduplicationId: randomUUID(),
    //   MessageGroupId: 'ai',
    //   MessageAttributes: {
    //     service: { DataType: 'String', StringValue: message.service },
    //   },
    // })
  }
}
