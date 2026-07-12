import { Schema, model, Types } from 'mongoose'
import { baseToJSON } from '../utils/model'
import type { WsRole } from './WorkspaceMember'

export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'revoked'

export interface IWorkspaceInvite {
  workspace: Types.ObjectId
  email: string
  token: string
  wsRole: WsRole
  invitedBy: Types.ObjectId
  status: InviteStatus
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

const inviteSchema = new Schema<IWorkspaceInvite>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    wsRole: { type: String, enum: ['owner', 'wsadmin', 'member'], default: 'member' },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined', 'revoked'], default: 'pending' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, toJSON: baseToJSON },
)

export const WorkspaceInvite = model<IWorkspaceInvite>('WorkspaceInvite', inviteSchema)
