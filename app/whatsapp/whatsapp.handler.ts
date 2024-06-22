import { SQSEvent } from 'aws-lambda'

export async function handler(event: SQSEvent) {
  for (const record of event.Records) {
    console.log(record.body)
  }
}
