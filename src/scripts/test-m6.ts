/* Test M6 (Dashboard + Hoạt động & Thông báo). */
import { connectDB, disconnectDB } from '../config/db'
import { User } from '../models/User'
import { File } from '../models/File'
import { Conversation } from '../models/Conversation'
import { Notification } from '../models/Notification'
import { Subscription } from '../models/Subscription'
import { Transaction } from '../models/Transaction'
import { handlePaidOrder } from '../modules/billing/billing.service'
import { logger } from '../utils/logger'

const BASE = `http://localhost:${process.env.PORT || 4100}/api/v1`
const GB = 1024 * 1024 * 1024
let pass = 0, fail = 0
function check(name: string, cond: boolean, extra = ''): void {
  if (cond) { pass++; logger.info(`✅ ${name} ${extra}`) } else { fail++; logger.error(`❌ ${name} ${extra}`) }
}
async function api(path: string, opts: RequestInit = {}, token?: string): Promise<{ status: number; body: any }> {
  const res = await fetch(`${BASE}${path}`, { ...opts, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(opts.headers ?? {}) } })
  return { status: res.status, body: (await res.json().catch(() => ({}))) as any }
}

async function main(): Promise<void> {
  await connectDB()
  const lr = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'minhanh@gmail.com', password: 'Demo@12345' }) })
  const token = lr.body.data.accessToken as string
  const userId = lr.body.data.user.id as string

  // Seed dữ liệu cho dashboard/feed
  const file = await File.create({ owner: userId, name: 'bao-cao-m6.pdf', type: 'pdf', size: 2 * 1024 * 1024, status: 'ready', storageKey: 'x', aiProcessed: true, tags: ['m6'] })
  const conv = await Conversation.create({ owner: userId, title: 'Hỏi đáp M6' })

  // 1) Dashboard stats
  const stats = await api('/dashboard/stats', {}, token)
  check('GET /dashboard/stats', stats.status === 200 && stats.body.data.storage?.total > 0 && stats.body.data.totalFiles >= 1, `(files ${stats.body.data?.totalFiles})`)

  // 2) Storage breakdown
  const sb = await api('/dashboard/storage-breakdown', {}, token)
  check('GET /dashboard/storage-breakdown', sb.status === 200 && Array.isArray(sb.body.data) && sb.body.data.some((r: any) => r.type === 'pdf'))

  // 3) Activity chart (7 ngày)
  const chart = await api('/dashboard/activity-chart', {}, token)
  check('GET /dashboard/activity-chart (7 mốc)', chart.status === 200 && chart.body.data.length === 7 && 'uploads' in chart.body.data[0] && 'ai' in chart.body.data[0])

  // 4) Activity feed
  const feed = await api('/activity', {}, token)
  check('GET /activity có upload + chat', feed.status === 200 && feed.body.data.some((i: any) => i.type === 'upload') && feed.body.data.some((i: any) => i.type === 'chat'), `(${feed.body.data?.length} mục)`)

  // 5) Notifications: seed 2 (1 đã đọc, 1 chưa)
  await Notification.deleteMany({ owner: userId })
  await Notification.create({ owner: userId, type: 'system', title: 'Chào mừng', message: 'Xin chào', read: true })
  const unreadN = await Notification.create({ owner: userId, type: 'ai', title: 'AI xong', message: 'Đã lập chỉ mục', read: false })

  const listAll = await api('/notifications', {}, token)
  check('GET /notifications (2 mục, unread=1)', listAll.body.data.items.length === 2 && listAll.body.data.unread === 1)
  const listUnread = await api('/notifications?unread=true', {}, token)
  check('GET /notifications?unread=true → 1', listUnread.body.data.items.length === 1)

  const markOne = await api(`/notifications/${unreadN._id}/read`, { method: 'POST' }, token)
  check('POST /notifications/:id/read', markOne.status === 200)
  const afterOne = await api('/notifications', {}, token)
  check('sau khi đọc → unread = 0', afterOne.body.data.unread === 0)

  // tạo thêm 1 chưa đọc rồi read-all
  await Notification.create({ owner: userId, type: 'system', title: 'Khác', message: '...', read: false })
  const readAll = await api('/notifications/read-all', { method: 'POST' }, token)
  check('POST /notifications/read-all', readAll.status === 200 && readAll.body.data.updated >= 1)
  const afterAll = await api('/notifications', {}, token)
  check('sau read-all → unread = 0', afterAll.body.data.unread === 0)

  // 6) Thông báo thanh toán tự sinh khi handlePaidOrder
  await Notification.deleteMany({ owner: userId })
  const orderCode = Date.now() * 1000 + 6
  await Transaction.create({ owner: userId, orderCode, planKey: 'pro', amount: 99000, seats: 1, periodMonths: 1, status: 'pending', description: 'CloudMind Pro' })
  await handlePaidOrder(orderCode)
  const payNotis = await api('/notifications', {}, token)
  check('thanh toán tự sinh thông báo "payment"', payNotis.body.data.items.some((n: any) => n.type === 'payment'))

  // Cleanup
  await File.deleteOne({ _id: file._id })
  await Conversation.deleteOne({ _id: conv._id })
  await Notification.deleteMany({ owner: userId })
  await Subscription.deleteOne({ owner: userId })
  await Transaction.deleteMany({ owner: userId })
  await User.findByIdAndUpdate(userId, { plan: 'Pro', storageTotal: 500 * GB })

  logger.info(`\n=== KẾT QUẢ M6: ${pass} pass / ${fail} fail ===`)
  await disconnectDB()
  process.exit(fail === 0 ? 0 : 1)
}

main().catch((err) => { logger.error({ err }, 'Test M6 lỗi'); process.exit(1) })
