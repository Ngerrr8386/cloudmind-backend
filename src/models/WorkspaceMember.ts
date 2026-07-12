import { Schema, model, Types } from 'mongoose'
import { baseToJSON } from '../utils/model'

export type WsRole = 'owner' | 'wsadmin' | 'member'

export interface IWorkspaceMember {
  workspace: Types.ObjectId
  user: Types.ObjectId
  wsRole: WsRole
  joinedAt: Date
  createdAt: Date
  updatedAt: Date
}

const memberSchema = new Schema<IWorkspaceMember>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    wsRole: { type: String, enum: ['owner', 'wsadmin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true, toJSON: baseToJSON },
)

memberSchema.index({ workspace: 1, user: 1 }, { unique: true })

export const WorkspaceMember = model<IWorkspaceMember>('WorkspaceMember', memberSchema)
