import { Schema, model } from 'mongoose'

export type OtpPurpose = 'verify' | 'reset'

export interface IOtpCode {
  email: string
  codeHash: string
  purpose: OtpPurpose
  attempts: number
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

const otpSchema = new Schema<IOtpCode>(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: ['verify', 'reset'], required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
)

// TTL: tự xoá khi hết hạn
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
otpSchema.index({ email: 1, purpose: 1 })

export const OtpCode = model<IOtpCode>('OtpCode', otpSchema)
