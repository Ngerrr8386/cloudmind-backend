import { Schema, model, Types } from 'mongoose'
import { baseToJSON } from '../utils/model'

export interface IChatSource {
  fileId: Types.ObjectId
  fileName: string
  snippet: string
  relevance: number
}

export interface IMessage {
  conversation: Types.ObjectId
  owner: Types.ObjectId
  role: 'user' | 'assistant'
  content: string
  sources?: IChatSource[]
  thinking?: string
  createdAt: Date
  updatedAt: Date
}

const messageSchema = new Schema<IMessage>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    sources: [
      {
        _id: false,
        fileId: { type: Schema.Types.ObjectId, ref: 'File' },
        fileName: String,
        snippet: String,
        relevance: Number,
      },
    ],
    thinking: { type: String },
  },
  { timestamps: true, toJSON: baseToJSON },
)

export const Message = model<IMessage>('Message', messageSchema)
