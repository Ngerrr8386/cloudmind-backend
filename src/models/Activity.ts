import { Schema, model, Types } from 'mongoose'
import { baseToJSON } from '../utils/model'

/** Nhật ký hoạt động — dùng cho workspace (M5) và dòng hoạt động cá nhân (M6). */
export interface IActivity {
  workspace?: Types.ObjectId | null
  owner?: Types.ObjectId | null
  actor: Types.ObjectId
  type: string
  message: string
  meta?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

const activitySchema = new Schema<IActivity>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', default: null, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true, toJSON: baseToJSON },
)

activitySchema.index({ workspace: 1, createdAt: -1 })
activitySchema.index({ owner: 1, createdAt: -1 })

export const Activity = model<IActivity>('Activity', activitySchema)
