import { PublishCommand, SNS } from "@aws-sdk/client-sns";
import {randomUUID} from "node:crypto";

export async function handler(event: any) {
    const httpMethod = event.requestContext.http.method;

    // webhook validation verification
    if (httpMethod === 'GET') {
        const qs = event?.queryStringParameters;

        console.log('qs', qs)

        if (!qs) {
            return 'nothing to see here';
        }

        if (qs['hub.mode'] === 'subscribe' && qs['hub.verify_token'] === process.env.VERIFY_TOKEN) {
            console.log('challenge', qs['hub.challenge'])
            return qs['hub.challenge'];
        }
    }

    // webhook event handling
    if (httpMethod === 'POST') {
        const client = new SNS()

        const command = new PublishCommand({
            Message: event.body,
            TopicArn: process.env.TOPIC_ARN,
            MessageGroupId: 'whatsapp-messages',
            MessageDeduplicationId: randomUUID()
        })

        await client.send(command as any)
    }

    return 'nothing to see here';
}