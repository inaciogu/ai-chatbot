import { Entity } from 'dynamodb-onetable'

export const ConversationSchema = {
  fields: {
    pk: { type: String, value: '${typename}', hidden: true },
    sk: { type: String, value: '${typename}#${userId}', hidden: true },

    id: { type: String, required: true, generate: true },
    threadId: { type: String, required: true },
    userId: { type: String, required: true }, // phone number or any other unique identifier for the user

    typename: { type: String, required: true },
    ttl: { type: Date, ttl: true },

    createdAt: { type: Date },
    deletedAt: { type: Date },
  },
}

export type Conversation = Entity<typeof ConversationSchema.fields>
