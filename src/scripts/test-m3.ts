/* Integration test M3 (AI modules) — phân biệt luồng DB (200) và luồng Gemini (503). */
import { connectDB, disconnectDB } from '../config/db'
import { User } from '../models/User'
import { File } from '../models/File'
import { Folder } from '../models/Folder'
import { Conversation } from '../models/Conversation'
import { Message } from '../models/Message'
import { logger } from '../utils/logger'

const BASE = `http://localhost:${process.env.PORT || 4100}/api/v1`
let pass = 0
let fail = 0
function check(name: string, cond: boolean, extra = ''): void {
  if (cond) { pass++; logger.info(`✅ ${name} ${extra}`) }
  else { fail++; logger.error(`❌ ${name} ${extra}`) }
}
async function api(path: string, opts: RequestInit = {}, token?: string): Promise<{ status: number; body: any }> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(opts.headers ?? {}) },
  })
  return { status: res.status, body: (await res.json().catch(() => ({}))) as any }
}

async function main(): Promise<void> {
  await connectDB()
  const lr = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'minhanh@gmail.com', password: 'Demo@12345' }) })
  const token = lr.body.data.accessToken as string
  const userId = lr.body.data.user.id as string

  // Seed 1 folder + 1 file ready (aiSummary chứa từ khoá)
  const folder = await Folder.create({ owner: userId, name: 'Báo cáo M3', tone: 'emerald' })
  const file = await File.create({ owner: userId, name: 'bao-cao-tai-chinh.pdf', type: 'pdf', size: 1000, folderId: folder._id, status: 'ready', storageKey: 'x', storageCounted: false, aiSummary: 'Báo cáo doanh thu quý 2 tăng trưởng tốt', tags: ['tài chính'] })
  const fileId = String(file._id)

  // ---- Luồng DB (mong đợi 200) ----
  const sug = await api('/ai/search/suggestions', {}, token)
  check('search/suggestions 200 + mảng', sug.status === 200 && Array.isArray(sug.body.data.suggestions))

  const kw = await api('/ai/search', { method: 'POST', body: JSON.stringify({ query: 'báo cáo', mode: 'keyword' }) }, token)
  check('search keyword 200', kw.status === 200, `(status ${kw.status})`)
  check('keyword tìm thấy file vừa seed', (kw.body.data?.results ?? []).some((r: any) => r.file.id === fileId), `(count ${kw.body.data?.count})`)

  const ins = await api('/ai/insights', {}, token)
  check('insights / 200 + mảng', ins.status === 200 && Array.isArray(ins.body.data), `(status ${ins.status})`)
  const cl = await api('/ai/insights/clusters', {}, token)
  check('insights/clusters 200', cl.status === 200, `(status ${cl.status})`)
  const cn = await api('/ai/insights/connections', {}, token)
  check('insights/connections 200', cn.status === 200, `(status ${cn.status})`)
  const tr = await api('/ai/insights/trends', {}, token)
  check('insights/trends 200', tr.status === 200, `(status ${tr.status})`)

  // Chat CRUD (DB)
  const conv = await api('/ai/chat/conversations', { method: 'POST', body: JSON.stringify({ title: 'Test M3' }) }, token)
  check('tạo conversation 201', conv.status === 201, `(status ${conv.status})`)
  const convId = conv.body.data.id as string
  const list = await api('/ai/chat/conversations', {}, token)
  check('list conversations chứa cái mới', (list.body.data ?? []).some((c: any) => c.id === convId))
  const getC = await api(`/ai/chat/conversations/${convId}`, {}, token)
  check('get conversation 200 + messages[]', getC.status === 200 && Array.isArray(getC.body.data.messages))

  // ---- Luồng Gemini (mong đợi 503 vì chưa cấu hình) ----
  const sem = await api('/ai/search', { method: 'POST', body: JSON.stringify({ query: 'kiến trúc RAG', mode: 'semantic' }) }, token)
  check('search semantic → 503 (Gemini off)', sem.status === 503, `(status ${sem.status})`)
  const msg = await api(`/ai/chat/conversations/${convId}/messages`, { method: 'POST', body: JSON.stringify({ content: 'Tóm tắt giúp mình' }) }, token)
  check('chat sendMessage → 503', msg.status === 503, `(status ${msg.status})`)
  const sm = await api(`/ai/summarize/${fileId}`, { method: 'POST', body: JSON.stringify({ length: 'short' }) }, token)
  check('summarize → 503', sm.status === 503, `(status ${sm.status})`)
  const sgf = await api('/ai/suggest-folder', { method: 'POST', body: JSON.stringify({ fileId }) }, token)
  check('suggest-folder → 503 (đã qua check có folder)', sgf.status === 503, `(status ${sgf.status})`)
  const rdx = await api('/ai/reindex', { method: 'POST', body: JSON.stringify({ fileId }) }, token)
  check('reindex → 503', rdx.status === 503, `(status ${rdx.status})`)

  // ---- Validation / 404 / auth ----
  const badSearch = await api('/ai/search', { method: 'POST', body: JSON.stringify({}) }, token)
  check('search thiếu query → 400', badSearch.status === 400, `(status ${badSearch.status})`)
  const sgEmpty = await api('/ai/suggest-folder', { method: 'POST', body: JSON.stringify({ fileName: 'x.pdf' }) }, token)
  check('suggest khi user CÓ folder → 503 (không phải 400)', sgEmpty.status === 503, `(status ${sgEmpty.status})`)
  const summGet = await api(`/ai/summarize/${fileId}`, {}, token)
  check('GET summarize chưa có → 404', summGet.status === 404, `(status ${summGet.status})`)
  const noAuth = await api('/ai/insights', {})
  check('insights không token → 401', noAuth.status === 401)

  // Cleanup
  await api(`/ai/chat/conversations/${convId}`, { method: 'DELETE' }, token)
  await Conversation.deleteMany({ owner: userId })
  await Message.deleteMany({ owner: userId })
  await Folder.deleteOne({ _id: folder._id })
  await File.deleteOne({ _id: file._id })

  logger.info(`\n=== KẾT QUẢ M3: ${pass} pass / ${fail} fail ===`)
  await disconnectDB()
  process.exit(fail === 0 ? 0 : 1)
}

main().catch((err) => { logger.error({ err }, 'Test M3 lỗi'); process.exit(1) })
