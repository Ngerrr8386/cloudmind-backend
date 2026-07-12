import { Schema, model, Types } from 'mongoose'
import { baseToJSON } from '../utils/model'

export interface INotification {
  owner: Types.ObjectId
  type: string // 'payment' | 'ai' | 'workspace' | 'system' ...
  title: string
  message: string
  link?: string
  read: boolean
  meta?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

const notificationSchema = new Schema<INotification>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, default: 'system' },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    link: { type: String },
    read: { type: Boolean, default: false },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true, toJSON: baseToJSON },
)

notificationSchema.index({ owner: 1, read: 1, createdAt: -1 })

export const Notification = model<INotification>('Notification', notificationSchema)
