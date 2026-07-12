import { Schema, model, Types } from 'mongoose'
import { baseToJSON } from '../utils/model'

export interface IWorkspace {
  name: string
  slug?: string
  logoUrl?: string
  owner: Types.ObjectId
  seats: number
  status: 'active' | 'suspended'
  settings: { defaultMemberAccess: 'view' | 'edit'; sharing: 'open' | 'restricted' }
  createdAt: Date
  updatedAt: Date
}

const workspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, trim: true },
    logoUrl: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    seats: { type: Number, default: 1 },
    status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
    settings: {
      defaultMemberAccess: { type: String, enum: ['view', 'edit'], default: 'view' },
      sharing: { type: String, enum: ['open', 'restricted'], default: 'restricted' },
    },
  },
  { timestamps: true, toJSON: baseToJSON },
)

export const Workspace = model<IWorkspace>('Workspace', workspaceSchema)
