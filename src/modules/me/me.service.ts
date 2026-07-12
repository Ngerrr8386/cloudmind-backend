import { User, type UserSettings } from '../../models/User'
import { Session } from '../../models/Session'
import { File } from '../../models/File'
import { Folder } from '../../models/Folder'
import { Embedding } from '../../models/Embedding'
import { Conversation } from '../../models/Conversation'
import { Message } from '../../models/Message'
import { Summary } from '../../models/Summary'
import { Share } from '../../models/Share'
import { OtpCode } from '../../models/OtpCode'
import { ApiError } from '../../utils/ApiError'
import { uploadAndSignedUrl, deleteByPrefix } from '../files/storage.service'
import { logger } from '../../utils/logger'
import type { Tone } from '../../utils/tones'

async function load(userId: string) {
  const user = await User.findById(userId)
  if (!user) throw ApiError.notFound('Không tìm thấy người dùng')
  return user
}

export async function getProfile(userId: string) {
  return (await load(userId)).toJSON()
}

export async function updateProfile(
  userId: string,
  input: { name?: string; handle?: string; bio?: string; tone?: string },
) {
  const user = await load(userId)
  if (input.name !== undefined) user.name = input.name
  if (input.handle !== undefined) user.handle = input.handle
  if (input.bio !== undefined) user.bio = input.bio
  if (input.tone !== undefined) user.tone = input.tone as Tone
  await user.save()
  return user.toJSON()
}

export async function setAvatar(userId: string, file: { originalname: string; mimetype: string; buffer: Buffer }) {
  const safe = file.originalname.replace(/[^\w.\-]+/g, '_')
  const key = `avatars/${userId}/${Date.now()}-${safe}`
  const url = await uploadAndSignedUrl(key, file.buffer, file.mimetype)
  const user = await load(userId)
  user.avatarUrl = url
  await user.save()
  return { avatarUrl: url }
}

export async function getSettings(userId: string) {
  return (await load(userId)).settings
}

export async function updateAiSettings(userId: string, partial: Partial<UserSettings['ai']>) {
  const user = await load(userId)
  Object.assign(user.settings.ai, partial)
  user.markModified('settings.ai')
  await user.save()
  return user.settings
}

export async function updateAppearance(userId: string, partial: Partial<UserSettings['appearance']>) {
  const user = await load(userId)
  Object.assign(user.settings.appearance, partial)
  user.markModified('settings.appearance')
  await user.save()
  return user.settings
}

export async function listSessions(userId: string) {
  const sessions = await Session.find({ user: userId }).sort({ createdAt: -1 }).lean()
  return sessions.map((s) => ({
    id: String(s._id),
    userAgent: s.userAgent,
    ip: s.ip,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
  }))
}

export async function revokeSession(userId: string, sessionId: string): Promise<void> {
  const r = await Session.deleteOne({ _id: sessionId, user: userId })
  if (r.deletedCount === 0) throw ApiError.notFound('Không tìm thấy phiên đăng nhập')
}

export async function setTwoFactor(userId: string, enabled: boolean) {
  const user = await load(userId)
  user.twoFactorEnabled = enabled
  await user.save()
  return { twoFactorEnabled: user.twoFactorEnabled }
}

export async function deleteAccount(userId: string): Promise<void> {
  const user = await User.findById(userId)
  await Promise.all([
    Embedding.deleteMany({ owner: userId }),
    Share.deleteMany({ owner: userId }),
    Summary.deleteMany({ owner: userId }),
    File.deleteMany({ owner: userId }),
    Folder.deleteMany({ owner: userId }),
    Message.deleteMany({ owner: userId }),
    Conversation.deleteMany({ owner: userId }),
    Session.deleteMany({ user: userId }),
  ])
  // Xoá file trên Firebase (best-effort)
  try {
    await deleteByPrefix(`uploads/${userId}/`)
    await deleteByPrefix(`avatars/${userId}/`)
  } catch (err) {
    logger.warn({ err }, 'Không xoá hết file Firebase khi xoá tài khoản')
  }
  if (user) {
    await OtpCode.deleteMany({ email: user.email })
    await user.deleteOne()
  }
}
