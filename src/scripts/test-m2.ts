/* Integration test M2 (Folders + Files) trên server đang chạy + Atlas. */
import { connectDB, disconnectDB } from '../config/db'
import { User } from '../models/User'
import { File } from '../models/File'
import { Folder } from '../models/Folder'
import { Share } from '../models/Share'
import { logger } from '../utils/logger'

const BASE = `http://localhost:${process.env.PORT || 4100}/api/v1`
let pass = 0
let fail = 0
function check(name: string, cond: boolean, extra = ''): void {
  if (cond) { pass++; logger.info(`✅ ${name} ${extra}`) }
  else { fail++; logger.error(`❌ ${name} ${extra}`) }
}

async function api(path: string, opts: RequestInit, token?: string): Promise<{ status: number; body: any }> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(opts.headers ?? {}) },
  })
  const body = (await res.json().catch(() => ({}))) as any
  return { status: res.status, body }
}

async function main(): Promise<void> {
  await connectDB()

  // 1) Login khách demo
  const lr = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'minhanh@gmail.com', password: 'Demo@12345' }) })
  check('login khách', lr.status === 200 && !!lr.body?.data?.accessToken, `(status ${lr.status})`)
  const token = lr.body.data.accessToken as string
  const userId = lr.body.data.user.id as string

  // 2) Tạo thư mục
  const cf = await api('/folders', { method: 'POST', body: JSON.stringify({ name: 'Test M2', tone: 'emerald', icon: 'Rocket' }) }, token)
  check('tạo folder', cf.status === 201 && cf.body?.data?.id, `(status ${cf.status})`)
  const folderId = cf.body.data.id as string

  // 3) List folders (fileCount = 0)
  const lf = await api('/folders', { method: 'GET' }, token)
  const created = (lf.body.data as Array<{ id: string; fileCount: number }>).find((f) => f.id === folderId)
  check('list folders chứa folder mới', !!created, `(tổng ${lf.body.data.length})`)
  check('fileCount = 0', created?.fileCount === 0)

  // 4) Folder tree
  const tr = await api('/folders/tree', { method: 'GET' }, token)
  check('folder tree trả mảng', Array.isArray(tr.body.data))

  // 5) upload-url → 503 (chưa cấu hình Firebase)
  const uu = await api('/files/upload-url', { method: 'POST', body: JSON.stringify({ fileName: 'a.pdf', contentType: 'application/pdf', size: 1000 }) }, token)
  check('upload-url trả 503 (Firebase off)', uu.status === 503, `(status ${uu.status})`)

  // Seed 1 file "pending" trực tiếp để test các thao tác không cần Firebase
  const seeded = await File.create({ owner: userId, name: 'bao-cao.pdf', type: 'pdf', mimeType: 'application/pdf', size: 0, folderId, tone: 'rose', status: 'pending', storageKey: 'uploads/test/bao-cao.pdf' })
  const fileId = seeded.id as string
  const userBefore = await User.findById(userId)

  // 6) confirm (size 1MB) → quota tăng
  const cfm = await api(`/files/${fileId}/confirm`, { method: 'POST', body: JSON.stringify({ size: 1048576 }) }, token)
  check('confirm → ready', cfm.status === 200 && cfm.body?.data?.status === 'ready', `(status ${cfm.status})`)
  const userAfter = await User.findById(userId)
  check('storageUsed +1MB', (userAfter!.storageUsed - userBefore!.storageUsed) === 1048576, `(+${(userAfter!.storageUsed - userBefore!.storageUsed)})`)

  // 7) list files (folder có 1 file)
  const lfi = await api(`/files?folderId=${folderId}`, { method: 'GET' }, token)
  check('list files = 1', lfi.body.meta?.total === 1, `(total ${lfi.body.meta?.total})`)

  // 8) patch (rename + tags)
  const pf = await api(`/files/${fileId}`, { method: 'PATCH', body: JSON.stringify({ name: 'bao-cao-2026.pdf', tags: ['tài chính'] }) }, token)
  check('patch rename', pf.body?.data?.name === 'bao-cao-2026.pdf' && pf.body?.data?.tags?.length === 1)

  // 9) star
  const st = await api(`/files/${fileId}/star`, { method: 'POST' }, token)
  check('star = true', st.body?.data?.starred === true)

  // 10) share + list + revoke
  const sh = await api(`/files/${fileId}/share`, { method: 'POST', body: JSON.stringify({ permission: 'view', expiresInDays: 7 }) }, token)
  check('tạo share', sh.status === 201 && !!sh.body?.data?.token)
  const shareId = sh.body.data.id as string
  const shl = await api(`/files/${fileId}/shares`, { method: 'GET' }, token)
  check('list shares = 1', shl.body?.data?.length === 1)
  const rv = await api(`/files/${fileId}/share/${shareId}`, { method: 'DELETE' }, token)
  check('revoke share', rv.status === 200)

  // 11) trash → restore
  const tt = await api(`/files/${fileId}`, { method: 'DELETE' }, token)
  check('trash', tt.body?.data?.status === 'trashed')
  const lt = await api('/files?trashed=true', { method: 'GET' }, token)
  check('list trashed >= 1', (lt.body?.meta?.total ?? 0) >= 1)
  const rs = await api(`/files/${fileId}/restore`, { method: 'POST' }, token)
  check('restore', rs.body?.data?.status === 'ready')

  // 12) permanent delete → quota giảm lại
  const pd = await api(`/files/${fileId}/permanent`, { method: 'DELETE' }, token)
  check('permanent delete', pd.status === 200)
  const userFinal = await User.findById(userId)
  check('storageUsed về như cũ', userFinal!.storageUsed === userBefore!.storageUsed, `(${userFinal!.storageUsed} vs ${userBefore!.storageUsed})`)

  // 13) 401 khi không token
  const noAuth = await api('/folders', { method: 'GET' })
  check('không token → 401', noAuth.status === 401)

  // Cleanup
  await Folder.deleteOne({ _id: folderId })
  await File.deleteMany({ owner: userId, name: { $in: ['bao-cao.pdf', 'bao-cao-2026.pdf', 'a.pdf'] } })
  await Share.deleteMany({ file: fileId })

  logger.info(`\n=== KẾT QUẢ: ${pass} pass / ${fail} fail ===`)
  await disconnectDB()
  process.exit(fail === 0 ? 0 : 1)
}

main().catch((err) => {
  logger.error({ err }, 'Test M2 lỗi')
  process.exit(1)
})
