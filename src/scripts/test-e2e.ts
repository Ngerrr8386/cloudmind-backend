/* End-to-end thật: Firebase upload + Gemini embedding/search/RAG/summarize/suggest. */
import { connectDB, disconnectDB } from '../config/db'
import { File } from '../models/File'
import { Folder } from '../models/Folder'
import { Conversation } from '../models/Conversation'
import { Message } from '../models/Message'
import { Embedding } from '../models/Embedding'
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
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const DOC = [
  'TÀI LIỆU KỸ THUẬT — KIẾN TRÚC RAG CỦA CLOUDMIND',
  'CloudMind sử dụng kiến trúc RAG (Retrieval-Augmented Generation) để hỏi đáp trên tài liệu.',
  'Khi người dùng tải file lên, hệ thống trích xuất văn bản, chia thành các đoạn (chunk),',
  'rồi tạo vector embedding bằng mô hình text-embedding-004 của Gemini và lưu vào cơ sở dữ liệu.',
  'Khi có câu hỏi, hệ thống tìm các đoạn liên quan nhất bằng độ tương đồng cosine,',
  'sau đó đưa các đoạn đó làm ngữ cảnh cho mô hình Gemini để sinh câu trả lời kèm trích dẫn nguồn.',
  'Doanh thu quý 2 năm 2026 của CloudMind tăng 23% so với quý 1, chủ yếu nhờ gói Pro.',
].join('\n')

async function main(): Promise<void> {
  await connectDB()

  const lr = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'minhanh@gmail.com', password: 'Demo@12345' }) })
  const token = lr.body.data.accessToken as string
  const userId = lr.body.data.user.id as string
  check('login', !!token)

  const folder = await api('/folders', { method: 'POST', body: JSON.stringify({ name: 'E2E RAG', tone: 'indigo' }) }, token)
  const folderId = folder.body.data.id as string
  check('tạo folder', folder.status === 201)

  // 1) upload-url (Firebase) → signed URL THẬT
  const uu = await api('/files/upload-url', { method: 'POST', body: JSON.stringify({ fileName: 'tai-lieu-rag.txt', contentType: 'text/plain', size: Buffer.byteLength(DOC), folderId }) }, token)
  check('upload-url trả signed URL (Firebase ON)', uu.status === 201 && typeof uu.body.data.uploadUrl === 'string', `(status ${uu.status})`)
  const fileId = uu.body.data.file.id as string
  const uploadUrl = uu.body.data.uploadUrl as string

  // 2) PUT nội dung lên Firebase
  const put = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: DOC })
  check('PUT file lên Firebase', put.ok, `(status ${put.status})`)

  // 3) confirm → kích hoạt embedding nền
  const cf = await api(`/files/${fileId}/confirm`, { method: 'POST', body: JSON.stringify({ size: Buffer.byteLength(DOC) }) }, token)
  check('confirm → ready', cf.body.data?.status === 'ready')

  // 4) Chờ embedding nền (poll aiProcessed)
  let processed = false
  for (let i = 0; i < 20 && !processed; i++) {
    await sleep(1500)
    const g = await api(`/files/${fileId}`, {}, token)
    processed = g.body.data?.aiProcessed === true
  }
  const embCount = await Embedding.countDocuments({ file: fileId })
  check('embedding nền hoàn tất (aiProcessed + có vector)', processed && embCount > 0, `(chunks ${embCount})`)

  // 5) Tìm kiếm ngữ nghĩa THẬT
  const sem = await api('/ai/search', { method: 'POST', body: JSON.stringify({ query: 'kiến trúc RAG hoạt động như thế nào', mode: 'semantic' }) }, token)
  const found = (sem.body.data?.results ?? []).some((r: any) => r.file.id === fileId)
  check('semantic search tìm thấy file', sem.status === 200 && found, `(count ${sem.body.data?.count}, top relevance ${sem.body.data?.results?.[0]?.relevance})`)

  // 6) Tóm tắt THẬT
  const sm = await api(`/ai/summarize/${fileId}`, { method: 'POST', body: JSON.stringify({ length: 'short' }) }, token)
  check('summarize trả nội dung', sm.status === 200 && (sm.body.data?.content?.length ?? 0) > 10, `(keyPoints ${sm.body.data?.keyPoints?.length})`)
  logger.info(`   📝 Tóm tắt: ${(sm.body.data?.content ?? '').slice(0, 100)}...`)

  // 7) Chat RAG THẬT
  const conv = await api('/ai/chat/conversations', { method: 'POST', body: JSON.stringify({ title: 'E2E' }) }, token)
  const convId = conv.body.data.id as string
  const msg = await api(`/ai/chat/conversations/${convId}/messages`, { method: 'POST', body: JSON.stringify({ content: 'Doanh thu quý 2 tăng bao nhiêu phần trăm?' }) }, token)
  check('chat RAG trả lời + nguồn', msg.status === 200 && (msg.body.data?.content?.length ?? 0) > 5 && (msg.body.data?.sources?.length ?? 0) > 0, `(sources ${msg.body.data?.sources?.length})`)
  logger.info(`   💬 Trả lời: ${(msg.body.data?.content ?? '').slice(0, 120)}...`)

  // 8) Gợi ý thư mục THẬT
  const sg = await api('/ai/suggest-folder', { method: 'POST', body: JSON.stringify({ fileId }) }, token)
  check('suggest-folder trả gợi ý', sg.status === 200 && (sg.body.data?.suggestions?.length ?? 0) > 0, `(suggestions ${sg.body.data?.suggestions?.length})`)

  // 9) Download URL THẬT + tải lại kiểm nội dung
  const dl = await api(`/files/${fileId}/download`, {}, token)
  check('download trả signed URL', dl.status === 200 && typeof dl.body.data?.url === 'string')
  if (dl.body.data?.url) {
    const back = await fetch(dl.body.data.url)
    const content = await back.text()
    check('tải lại nội dung khớp', content.includes('kiến trúc RAG'))
  }

  // Cleanup
  await api(`/files/${fileId}/permanent`, { method: 'DELETE' }, token)
  await api(`/ai/chat/conversations/${convId}`, { method: 'DELETE' }, token)
  await Folder.deleteOne({ _id: folderId })
  await Conversation.deleteMany({ owner: userId })
  await Message.deleteMany({ owner: userId })
  await File.deleteMany({ _id: fileId })
  await Embedding.deleteMany({ file: fileId })

  logger.info(`\n=== KẾT QUẢ E2E: ${pass} pass / ${fail} fail ===`)
  await disconnectDB()
  process.exit(fail === 0 ? 0 : 1)
}

main().catch((err) => { logger.error({ err }, 'Test E2E lỗi'); process.exit(1) })
