import { Schema, model, type HydratedDocument, type Model } from 'mongoose'
import bcrypt from 'bcryptjs'

export type AuthProvider = 'local' | 'google'
export type UserRole = 'customer' | 'admin'
export type PlanName = 'Free' | 'Pro' | 'Team'
export type UserStatus = 'active' | 'trial' | 'suspended' | 'pending'

const GB = 1024 * 1024 * 1024

export interface UserSettings {
  ai: { autoSummarize: boolean; folderSuggestions: boolean; allowIndexing: boolean; improveModel: boolean }
  appearance: { theme: 'light' | 'dark' | 'auto'; accent: string; reduceMotion: boolean }
}

export interface IUser {
  email: string
  passwordHash?: string
  name: string
  handle?: string
  bio?: string
  avatarUrl?: string
  tone: string
  firebaseUid?: string
  provider: AuthProvider
  role: UserRole
  plan: PlanName
  status: UserStatus
  storageUsed: number
  storageTotal: number
  workspaceId?: Schema.Types.ObjectId | null
  emailVerified: boolean
  twoFactorEnabled: boolean
  settings: UserSettings
  lastActiveAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface IUserMethods {
  comparePassword(plain: string): Promise<boolean>
}

type UserModel = Model<IUser, object, IUserMethods>
export type UserDoc = HydratedDocument<IUser, IUserMethods>

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, select: false },
    name: { type: String, required: true, trim: true },
    handle: { type: String, trim: true },
    bio: { type: String, default: '' },
    avatarUrl: { type: String },
    tone: { type: String, default: 'indigo' },
    firebaseUid: { type: String, unique: true, sparse: true, index: true },
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer', index: true },
    plan: { type: String, enum: ['Free', 'Pro', 'Team'], default: 'Free' },
    status: { type: String, enum: ['active', 'trial', 'suspended', 'pending'], default: 'active', index: true },
    storageUsed: { type: Number, default: 0 },
    storageTotal: { type: Number, default: 15 * GB },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', default: null },
    emailVerified: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    settings: {
      ai: {
        autoSummarize: { type: Boolean, default: true },
        folderSuggestions: { type: Boolean, default: true },
        allowIndexing: { type: Boolean, default: true },
        improveModel: { type: Boolean, default: false },
      },
      appearance: {
        theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
        accent: { type: String, default: 'indigo' },
        reduceMotion: { type: Boolean, default: false },
      },
    },
    lastActiveAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        const r = ret as Record<string, unknown>
        r.id = r._id
        delete r._id
        delete r.__v
        delete r.passwordHash
        return r
      },
    },
  },
)

userSchema.method('comparePassword', async function (plain: string): Promise<boolean> {
  if (!this.passwordHash) return false
  return bcrypt.compare(plain, this.passwordHash)
})

export const User = model<IUser, UserModel>('User', userSchema)
