import { Schema, model, type Model } from 'mongoose'

export interface ISession {
  user: Schema.Types.ObjectId
  refreshTokenHash: string
  userAgent?: string
  ip?: string
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

const sessionSchema = new Schema<ISession>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refreshTokenHash: { type: String, required: true, index: true },
    userAgent: { type: String },
    ip: { type: String },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
)

// TTL index: tự xoá session khi hết hạn
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const Session = model<ISession>('Session', sessionSchema)
