import { Schema, model, Types } from 'mongoose'
import type { Tone } from '../utils/tones'
import { baseToJSON } from '../utils/model'

export type FileType =
  | 'pdf' | 'doc' | 'sheet' | 'slide' | 'image'
  | 'video' | 'audio' | 'code' | 'archive' | 'note'

export type FileStatus = 'pending' | 'ready' | 'trashed'
export type ModerationStatus = 'clean' | 'flagged' | 'reviewing' | 'removed'

export const FILE_TYPES: FileType[] = ['pdf', 'doc', 'sheet', 'slide', 'image', 'video', 'audio', 'code', 'archive', 'note']

export interface IFile {
  owner: Types.ObjectId
  workspaceId?: Types.ObjectId | null
  folderId?: Types.ObjectId | null
  name: string
  type: FileType
  mimeType?: string
  size: number
  storageKey?: string // đường dẫn object trên Firebase
  storageCounted: boolean // đã tính vào quota của user chưa (độc lập với status)
  status: FileStatus
  moderationStatus: ModerationStatus
  flagReason?: string
  starred: boolean
  shared: boolean
  aiProcessed: boolean
  embedStatus: 'pending' | 'processing' | 'done' | 'failed'
  embedChunks: number
  aiSummary?: string
  tags: string[]
  tone: Tone
  trashedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

const fileSchema = new Schema<IFile>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', default: null, index: true },
    folderId: { type: Schema.Types.ObjectId, ref: 'Folder', default: null, index: true },
    name: { type: String, required: true, trim: true, maxlength: 255 },
    type: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number, default: 0 },
    storageKey: { type: String },
    storageCounted: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'ready', 'trashed'], default: 'pending', index: true },
    moderationStatus: { type: String, enum: ['clean', 'flagged', 'reviewing', 'removed'], default: 'clean', index: true },
    flagReason: { type: String },
    starred: { type: Boolean, default: false },
    shared: { type: Boolean, default: false },
    aiProcessed: { type: Boolean, default: false },
    embedStatus: { type: String, enum: ['pending', 'processing', 'done', 'failed'], default: 'pending', index: true },
    embedChunks: { type: Number, default: 0 },
    aiSummary: { type: String },
    tags: { type: [String], default: [] },
    tone: { type: String, default: 'indigo' },
    trashedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: baseToJSON },
)

fileSchema.index({ owner: 1, status: 1, updatedAt: -1 })

export const File = model<IFile>('File', fileSchema)
