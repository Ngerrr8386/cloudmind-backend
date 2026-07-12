import { Schema, model, Types } from 'mongoose'
import { baseToJSON } from '../utils/model'

export type AuditSeverity = 'info' | 'warning' | 'critical'

export interface IAuditLog {
  actor?: Types.ObjectId | null
  actorName: string
  action: string
  target?: string
  severity: AuditSeverity
  message: string
  ip?: string
  meta?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

const auditSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    actorName: { type: String, default: 'Hệ thống' },
    action: { type: String, required: true, index: true },
    target: { type: String },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info', index: true },
    message: { type: String, required: true },
    ip: { type: String },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true, toJSON: baseToJSON },
)

auditSchema.index({ createdAt: -1 })

export const AuditLog = model<IAuditLog>('AuditLog', auditSchema)
