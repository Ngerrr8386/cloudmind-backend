import { Schema, model, Types } from 'mongoose'
import { baseToJSON } from '../utils/model'

export type SummaryLength = 'short' | 'medium' | 'detailed'

export interface ISummary {
  file: Types.ObjectId
  owner: Types.ObjectId
  length: SummaryLength
  content: string
  keyPoints: string[]
  keywords: string[]
  createdAt: Date
  updatedAt: Date
}

const summarySchema = new Schema<ISummary>(
  {
    file: { type: Schema.Types.ObjectId, ref: 'File', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    length: { type: String, enum: ['short', 'medium', 'detailed'], default: 'medium' },
    content: { type: String, required: true },
    keyPoints: { type: [String], default: [] },
    keywords: { type: [String], default: [] },
  },
  { timestamps: true, toJSON: baseToJSON },
)

summarySchema.index({ file: 1, length: 1 }, { unique: true })

export const Summary = model<ISummary>('Summary', summarySchema)
