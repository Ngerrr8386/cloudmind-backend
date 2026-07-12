import { Schema, model, Types } from 'mongoose'
import { baseToJSON } from '../utils/model'

export type ReportStatus = 'open' | 'resolved' | 'dismissed'

export interface IReport {
  file: Types.ObjectId
  reporter?: Types.ObjectId | null
  reason: string
  status: ReportStatus
  resolvedBy?: Types.ObjectId | null
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const reportSchema = new Schema<IReport>(
  {
    file: { type: Schema.Types.ObjectId, ref: 'File', required: true, index: true },
    reporter: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reason: { type: String, required: true },
    status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open', index: true },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date },
  },
  { timestamps: true, toJSON: baseToJSON },
)

export const Report = model<IReport>('Report', reportSchema)
