import { Schema, model, Types } from 'mongoose'
import { baseToJSON } from '../utils/model'

export type AiFeature = 'search' | 'chat' | 'summarize' | 'insights' | 'suggest' | 'embedding' | 'moderation'

export interface IAiUsage {
  owner?: Types.ObjectId
  feature: AiFeature
  model: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
  createdAt: Date
  updatedAt: Date
}

const aiUsageSchema = new Schema<IAiUsage>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    feature: { type: String, required: true, index: true },
    model: { type: String, required: true },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    latencyMs: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: baseToJSON },
)

export const AiUsage = model<IAiUsage>('AiUsage', aiUsageSchema)
