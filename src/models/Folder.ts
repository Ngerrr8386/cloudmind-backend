import { Schema, model, Types } from 'mongoose'
import type { Tone } from '../utils/tones'
import { baseToJSON } from '../utils/model'

export interface IFolderPermission {
  user: Types.ObjectId
  access: 'view' | 'edit'
}

export interface IFolder {
  owner: Types.ObjectId
  workspaceId?: Types.ObjectId | null
  name: string
  icon: string
  tone: Tone
  parentId?: Types.ObjectId | null
  permissions: IFolderPermission[]
  status: 'active' | 'trashed'
  trashedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

const folderSchema = new Schema<IFolder>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', default: null, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    icon: { type: String, default: 'Folder' },
    tone: { type: String, default: 'indigo' },
    parentId: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
    status: { type: String, enum: ['active', 'trashed'], default: 'active', index: true },
    trashedAt: { type: Date, default: null },
    permissions: [
      {
        _id: false,
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        access: { type: String, enum: ['view', 'edit'], default: 'view' },
      },
    ],
  },
  { timestamps: true, toJSON: baseToJSON },
)

export const Folder = model<IFolder>('Folder', folderSchema)
