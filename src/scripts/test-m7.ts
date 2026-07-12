/* Test M7 (Admin) — 9 module + kiểm soát truy cập. */
import { connectDB, disconnectDB } from '../config/db'
import { User } from '../models/User'
import { File } from '../models/File'
import { Report } from '../models/Report'
import { Transaction } from '../models/Transaction'
import { Setting } from '../models/Setting'
import { logger } from '../utils/logger'

const BASE = `http://localhost:${process.env.PORT || 4100}/api/v1`
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
  const al = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'admin@cloudmind.vn', password: 'Admin@12345' }) })
  const A = al.body.data.accessToken as string
  check('login admin', !!A)
  const cl = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'minhanh@gmail.com', password: 'Demo@12345' }) })
  const C = cl.body.data.accessToken as string
  const minhanhId = cl.body.data.user.id as string

  // ===== Access control =====
  check('khách → /admin/* = 403', (await api('/admin/overview/kpis', {}, C)).status === 403)
  check('không token → /admin/* = 401', (await api('/admin/overview/kpis')).status === 401)

  // ===== Overview =====
  const kpis = await api('/admin/overview/kpis', {}, A)
  check('overview/kpis', kpis.status === 200 && kpis.body.data.totalUsers >= 2 && 'mrr' in kpis.body.data)
  check('overview/revenue (6)', (await api('/admin/overview/revenue', {}, A)).body.data.length === 6)
  check('overview/user-growth (6)', (await api('/admin/overview/user-growth', {}, A)).body.data.length === 6)
  check('overview/plan-distribution (3)', (await api('/admin/overview/plan-distribution', {}, A)).body.data.length === 3)
  check('overview/system-health', Array.isArray((await api('/admin/overview/system-health', {}, A)).body.data.services))
  check('overview/recent', !!(await api('/admin/overview/recent', {}, A)).body.data.users)

  // ===== Users =====
  const ulist = await api('/admin/users?limit=5', {}, A)
  check('users list + meta', Array.isArray(ulist.body.data) && ulist.body.meta?.total >= 2)
  check('users get :id', (await api(`/admin/users/${minhanhId}`, {}, A)).body.data.email === 'minhanh@gmail.com')
  const created = await api('/admin/users', { method: 'POST', body: JSON.stringify({ email: `adm.tmp.${Date.now()}@example.com`, name: 'Tạm', password: 'Tmp@12345' }) }, A)
  check('users create → 201', created.status === 201)
  const tmpId = created.body.data.id as string
  check('users suspend', (await api(`/admin/users/${tmpId}/suspend`, { method: 'POST' }, A)).status === 200 && (await User.findById(tmpId))?.status === 'suspended')
  check('users unsuspend', (await api(`/admin/users/${tmpId}/unsuspend`, { method: 'POST' }, A)).status === 200)
  check('users change plan', (await api(`/admin/users/${tmpId}/plan`, { method: 'PATCH', body: JSON.stringify({ plan: 'Pro' }) }, A)).status === 200)
  const rpw = await api(`/admin/users/${tmpId}/reset-password`, { method: 'POST' }, A)
  check('users reset-password → devOtp', rpw.status === 200)
  const imp = await api(`/admin/users/${tmpId}/impersonate`, { method: 'POST' }, A)
  check('users impersonate → token dùng được', imp.status === 200 && (await api('/auth/me', {}, imp.body.data.accessToken)).body.data.id === tmpId)
  check('users :id/files', Array.isArray((await api(`/admin/users/${tmpId}/files`, {}, A)).body.data))
  check('users :id/transactions', Array.isArray((await api(`/admin/users/${tmpId}/transactions`, {}, A)).body.data))
  check('users delete', (await api(`/admin/users/${tmpId}`, { method: 'DELETE' }, A)).status === 200)
  check('users không tự xoá mình → 400', (await api(`/admin/users/${al.body.data.user.id}`, { method: 'DELETE' }, A)).status === 400)

  // ===== Content & Moderation =====
  const flagged = await File.create({ owner: minhanhId, name: 'vi-pham.doc', type: 'doc', size: 1000, status: 'ready', storageKey: 'x', moderationStatus: 'flagged', flagReason: 'spam' })
  check('content list', (await api('/admin/content', {}, A)).status === 200)
  check('content queue có file flagged', (await api('/admin/content/queue', {}, A)).body.data.some((f: any) => f.id === String(flagged._id)))
  check('content approve', (await api(`/admin/content/${flagged._id}/approve`, { method: 'POST' }, A)).status === 200 && (await File.findById(flagged._id))?.moderationStatus === 'clean')
  const report = await Report.create({ file: flagged._id, reason: 'Nội dung xấu' })
  check('reports list', (await api('/admin/reports', {}, A)).body.data.some((r: any) => r.id === String(report._id)))
  check('reports resolve', (await api(`/admin/reports/${report._id}/resolve`, { method: 'POST', body: JSON.stringify({ action: 'resolve' }) }, A)).status === 200)

  // ===== Billing =====
  check('billing/metrics', 'mrr' in (await api('/admin/billing/metrics', {}, A)).body.data)
  const paidTx = await Transaction.create({ owner: minhanhId, orderCode: Date.now() * 1000 + 1, planKey: 'pro', amount: 99000, status: 'paid', paidAt: new Date(), invoiceNo: 'INV-TEST', description: 'x' })
  check('billing/transactions', (await api('/admin/billing/transactions', {}, A)).status === 200)
  check('billing refund', (await api(`/admin/billing/transactions/${paidTx._id}/refund`, { method: 'POST' }, A)).status === 200 && (await Transaction.findById(paidTx._id))?.status === 'refunded')
  check('billing/invoices', (await api('/admin/billing/invoices', {}, A)).status === 200)
  check('billing/failed', Array.isArray((await api('/admin/billing/failed', {}, A)).body.data))

  // ===== Plans =====
  const plans = await api('/admin/plans', {}, A)
  check('plans list + subscribers', plans.body.data.length >= 3 && 'subscribers' in plans.body.data[0])
  const teamPlan = plans.body.data.find((p: any) => p.key === 'team')
  const tg1 = await api(`/admin/plans/${teamPlan.id}/toggle`, { method: 'POST' }, A)
  check('plans toggle', tg1.status === 200)
  await api(`/admin/plans/${teamPlan.id}/toggle`, { method: 'POST' }, A) // bật lại
  check('plans get :id', (await api(`/admin/plans/${teamPlan.id}`, {}, A)).body.data.key === 'team')
  check('plans subscribers', (await api(`/admin/plans/${teamPlan.id}/subscribers`, {}, A)).status === 200)

  // ===== AI Analytics =====
  check('ai/metrics', 'totalCalls' in (await api('/admin/ai/metrics', {}, A)).body.data)
  check('ai/by-feature', Array.isArray((await api('/admin/ai/by-feature', {}, A)).body.data))
  check('ai/daily-trend', Array.isArray((await api('/admin/ai/daily-trend', {}, A)).body.data))
  check('ai/top-queries', Array.isArray((await api('/admin/ai/top-queries', {}, A)).body.data))
  check('ai/cost', Array.isArray((await api('/admin/ai/cost', {}, A)).body.data))

  // ===== Audit =====
  const audit = await api('/admin/audit', {}, A)
  check('audit list có bản ghi (từ mutation)', audit.status === 200 && audit.body.data.length > 0, `(${audit.body.data?.length})`)
  check('audit export', (await api('/admin/audit/export', {}, A)).body.data.count >= 0)

  // ===== Settings & Team =====
  check('settings get', (await api('/admin/settings', {}, A)).body.data.general.appName === 'CloudMind')
  check('settings patch general', (await api('/admin/settings/general', { method: 'PATCH', body: JSON.stringify({ supportEmail: 'help@cloudmind.vn' }) }, A)).status === 200)
  check('team list (có admin)', (await api('/admin/team', {}, A)).body.data.some((u: any) => u.email === 'admin@cloudmind.vn'))
  check('integrations list', Array.isArray((await api('/admin/integrations', {}, A)).body.data))
  check('integrations patch payos', (await api('/admin/integrations/payos', { method: 'PATCH', body: JSON.stringify({ enabled: true }) }, A)).status === 200)

  // ===== Admin Workspaces =====
  check('admin workspaces list', (await api('/admin/workspaces', {}, A)).status === 200)

  // Cleanup
  await File.deleteOne({ _id: flagged._id })
  await Report.deleteOne({ _id: report._id })
  await Transaction.deleteOne({ _id: paidTx._id })
  await User.deleteMany({ email: /^adm\.tmp\./ })
  await Setting.updateOne({ key: 'global' }, { 'general.supportEmail': 'support@cloudmind.vn', 'integrations.$[e].enabled': false }, { arrayFilters: [{ 'e.key': 'payos' }] })

  logger.info(`\n=== KẾT QUẢ M7: ${pass} pass / ${fail} fail ===`)
  await disconnectDB()
  process.exit(fail === 0 ? 0 : 1)
}

main().catch((err) => { logger.error({ err }, 'Test M7 lỗi'); process.exit(1) })
