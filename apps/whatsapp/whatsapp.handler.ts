import { SQSEvent } from 'aws-lambda'

type MessageBody = {
  source: string
  data: Record<string, any>
}

export async function handler(event: SQSEvent) {
  for (const record of event.Records) {
    console.log(record.body)
  }
}
