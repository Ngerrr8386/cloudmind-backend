import type { HydratedDocument } from 'mongoose'
import { AuditLog, type AuditSeverity } from '../../models/AuditLog'
import { User } from '../../models/User'
import { Setting, type ISetting } from '../../models/Setting'
import { logger } from '../../utils/logger'

/** Ghi nhật ký hành động quản trị (best-effort, không ném lỗi ra luồng chính). */
export async function logAudit(
  actorId: string | undefined,
  input: { action: string; message: string; severity?: AuditSeverity; target?: string; meta?: Record<string, unknown>; ip?: string },
): Promise<void> {
  try {
    let actorName = 'Hệ thống'
    if (actorId) {
      const u = await User.findById(actorId).select('name')
      actorName = u?.name ?? 'Admin'
    }
    await AuditLog.create({
      actor: actorId ?? null,
      actorName,
      action: input.action,
      message: input.message,
      severity: input.severity ?? 'info',
      target: input.target,
      meta: input.meta,
      ip: input.ip,
    })
  } catch (err) {
    logger.warn({ err }, 'Không ghi được audit log')
  }
}

const DEFAULT_INTEGRATIONS = [
  { key: 'payos', name: 'PayOS', enabled: false },
  { key: 'gemini', name: 'Google Gemini', enabled: false },
  { key: 'firebase', name: 'Firebase', enabled: false },
  { key: 'smtp', name: 'SMTP Email', enabled: false },
]

export async function ensureDefaultSettings(): Promise<void> {
  await Setting.updateOne(
    { key: 'global' },
    { $setOnInsert: { key: 'global', integrations: DEFAULT_INTEGRATIONS } },
    { upsert: true },
  )
}

export async function getGlobalSettings(): Promise<HydratedDocument<ISetting>> {
  let s = await Setting.findOne({ key: 'global' })
  if (!s) {
    await ensureDefaultSettings()
    s = await Setting.findOne({ key: 'global' })
  }
  return s as HydratedDocument<ISetting>
}
