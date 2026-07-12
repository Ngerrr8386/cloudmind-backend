import { Schema, model, Types } from 'mongoose'
import { baseToJSON } from '../utils/model'

export type SharePermission = 'view' | 'edit'

export interface IShare {
  file: Types.ObjectId
  owner: Types.ObjectId
  token: string
  permission: SharePermission
  expiresAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

const shareSchema = new Schema<IShare>(
  {
    file: { type: Schema.Types.ObjectId, ref: 'File', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    permission: { type: String, enum: ['view', 'edit'], default: 'view' },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: baseToJSON },
)

export const Share = model<IShare>('Share', shareSchema)
