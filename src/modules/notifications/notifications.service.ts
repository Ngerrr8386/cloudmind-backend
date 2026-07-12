import type { FilterQuery } from 'mongoose'
import { Notification, type INotification } from '../../models/Notification'
import { File } from '../../models/File'
import { Conversation } from '../../models/Conversation'
import { Summary } from '../../models/Summary'
import { ApiError } from '../../utils/ApiError'
import { logger } from '../../utils/logger'

/** Tạo thông báo (best-effort, không ném lỗi ra ngoài luồng chính). */
export async function notify(
  owner: string,
  input: { type: string; title: string; message?: string; link?: string; meta?: Record<string, unknown> },
): Promise<void> {
  try {
    await Notification.create({ owner, ...input })
  } catch (err) {
    logger.warn({ err }, 'Không tạo được thông báo')
  }
}

export async function listNotifications(owner: string, opts: { unreadOnly?: boolean; limit?: number } = {}) {
  const filter: FilterQuery<INotification> = { owner }
  if (opts.unreadOnly) filter.read = false
  const [items, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(opts.limit ?? 30).lean(),
    Notification.countDocuments({ owner, read: false }),
  ])
  return {
    unread,
    items: items.map((n) => ({
      id: String(n._id),
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      read: n.read,
      createdAt: n.createdAt,
    })),
  }
}

export async function markRead(owner: string, id: string): Promise<void> {
  const r = await Notification.updateOne({ _id: id, owner }, { read: true })
  if (r.matchedCount === 0) throw ApiError.notFound('Không tìm thấy thông báo')
}

export async function markAllRead(owner: string) {
  const r = await Notification.updateMany({ owner, read: false }, { read: true })
  return { updated: r.modifiedCount }
}

/** Dòng hoạt động gần đây — tổng hợp từ file, hội thoại, tóm tắt. */
export async function getActivityFeed(owner: string, limit = 20) {
  const [files, convs, summaries] = await Promise.all([
    File.find({ owner, status: { $ne: 'trashed' } }).sort({ createdAt: -1 }).limit(limit).select('name type createdAt').lean(),
    Conversation.find({ owner }).sort({ lastMessageAt: -1, createdAt: -1 }).limit(limit).select('title lastMessageAt createdAt').lean(),
    Summary.find({ owner }).sort({ createdAt: -1 }).limit(limit).populate<{ file: { name: string } }>('file', 'name').lean(),
  ])

  const items = [
    ...files.map((f) => ({ type: 'upload', message: `Đã tải lên "${f.name}"`, meta: { fileType: f.type }, at: f.createdAt })),
    ...convs.map((c) => ({ type: 'chat', message: `Trò chuyện: ${c.title}`, meta: {}, at: c.lastMessageAt ?? c.createdAt })),
    ...summaries.map((s) => ({ type: 'summary', message: `Đã tóm tắt "${s.file?.name ?? 'tài liệu'}"`, meta: {}, at: s.createdAt })),
  ]
  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  return items.slice(0, limit)
}
