import { Types } from 'mongoose'
import { User } from '../../models/User'
import { File } from '../../models/File'
import { Folder } from '../../models/Folder'
import { AiUsage } from '../../models/AiUsage'
import { Conversation } from '../../models/Conversation'
import { ApiError } from '../../utils/ApiError'

const DAY = 24 * 60 * 60 * 1000
const VN_DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export async function getStats(owner: string) {
  const user = await User.findById(owner)
  if (!user) throw ApiError.notFound('Không tìm thấy người dùng')

  const [totalFiles, totalFolders, aiInteractions, indexedDocs, starred, conversations, tags] = await Promise.all([
    File.countDocuments({ owner, status: 'ready' }),
    Folder.countDocuments({ owner }),
    AiUsage.countDocuments({ owner }),
    File.countDocuments({ owner, aiProcessed: true }),
    File.countDocuments({ owner, starred: true, status: 'ready' }),
    Conversation.countDocuments({ owner }),
    File.distinct('tags', { owner }),
  ])

  return {
    storage: {
      used: user.storageUsed,
      total: user.storageTotal,
      percent: user.storageTotal ? Math.round((user.storageUsed / user.storageTotal) * 1000) / 10 : 0,
    },
    totalFiles,
    totalFolders,
    aiInteractions,
    indexedDocs,
    starred,
    conversations,
    knowledgeClusters: tags.filter(Boolean).length,
  }
}

export async function getStorageBreakdown(owner: string) {
  const rows = await File.aggregate<{ _id: string; count: number; size: number }>([
    { $match: { owner: new Types.ObjectId(owner), status: 'ready' } },
    { $group: { _id: '$type', count: { $sum: 1 }, size: { $sum: '$size' } } },
    { $sort: { size: -1 } },
  ])
  return rows.map((r) => ({ type: r._id, count: r.count, size: r.size }))
}

export async function getActivityChart(owner: string, days = 7) {
  const since = new Date(Date.now() - (days - 1) * DAY)
  since.setHours(0, 0, 0, 0)

  const [files, ai] = await Promise.all([
    File.find({ owner, createdAt: { $gte: since } }).select('createdAt').lean(),
    AiUsage.find({ owner, createdAt: { $gte: since } }).select('createdAt').lean(),
  ])

  const buckets: { day: string; date: string; uploads: number; ai: number }[] = []
  const indexByDate = new Map<string, number>()
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * DAY)
    const key = d.toISOString().slice(0, 10)
    indexByDate.set(key, i)
    buckets.push({ day: VN_DAYS[d.getDay()], date: key, uploads: 0, ai: 0 })
  }
  for (const f of files) {
    const key = new Date(f.createdAt).toISOString().slice(0, 10)
    const idx = indexByDate.get(key)
    if (idx !== undefined) buckets[idx].uploads++
  }
  for (const a of ai) {
    const key = new Date(a.createdAt).toISOString().slice(0, 10)
    const idx = indexByDate.get(key)
    if (idx !== undefined) buckets[idx].ai++
  }
  return buckets
}
