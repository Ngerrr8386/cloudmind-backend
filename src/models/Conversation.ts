import { Schema, model, Types } from 'mongoose'
import { baseToJSON } from '../utils/model'

export interface IConversation {
  owner: Types.ObjectId
  title: string
  lastMessageAt?: Date
  messageCount: number
  createdAt: Date
  updatedAt: Date
}

const conversationSchema = new Schema<IConversation>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'Cuộc trò chuyện mới', maxlength: 200 },
    lastMessageAt: { type: Date },
    messageCount: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: baseToJSON },
)

export const Conversation = model<IConversation>('Conversation', conversationSchema)
