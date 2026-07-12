/* Test M5 (Workspace gói Team): tạo, thành viên, mời/accept, seat, chia sẻ, phân quyền, hoạt động, transfer, leave, delete. */
import bcrypt from 'bcryptjs'
import { connectDB, disconnectDB } from '../config/db'
import { User } from '../models/User'
import { Folder } from '../models/Folder'
import { Subscription } from '../models/Subscription'
import { Transaction } from '../models/Transaction'
import { Workspace } from '../models/Workspace'
import { WorkspaceMember } from '../models/WorkspaceMember'
import { WorkspaceInvite } from '../models/WorkspaceInvite'
import { Activity } from '../models/Activity'
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
  const inviteeEmail = `wsinvitee.${Date.now()}@example.com`

  // login owner (minhanh)
  const lr = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'minhanh@gmail.com', password: 'Demo@12345' }) })
  const ownerToken = lr.body.data.accessToken as string
  const ownerId = lr.body.data.user.id as string

  // clean slate
  const oldM = await WorkspaceMember.findOne({ user: ownerId })
  if (oldM) { await Workspace.deleteOne({ _id: oldM.workspace }); await WorkspaceMember.deleteMany({ workspace: oldM.workspace }); await WorkspaceInvite.deleteMany({ workspace: oldM.workspace }); await Activity.deleteMany({ workspace: oldM.workspace }) }
  await Subscription.deleteOne({ owner: ownerId })
  await User.findByIdAndUpdate(ownerId, { workspaceId: null })

  // 1) Kích hoạt gói Team (seats 3) → tự tạo workspace
  const orderCode = Date.now() * 1000 + 5
  await Transaction.create({ owner: ownerId, orderCode, planKey: 'team', amount: 747000, seats: 3, periodMonths: 1, status: 'pending', description: 'CloudMind Team' })
  await handlePaidOrder(orderCode)
  check('kích hoạt Team → tự tạo workspace', !!(await WorkspaceMember.findOne({ user: ownerId, wsRole: 'owner' })))

  // 2) GET current
  const cur = await api('/workspaces/current', {}, ownerToken)
  check('GET /workspaces/current (owner)', cur.status === 200 && cur.body.data.myRole === 'owner' && cur.body.data.memberCount === 1)
  const wsId = cur.body.data.id as string

  // 3) POST /workspaces lần nữa → 409
  const dup = await api('/workspaces', { method: 'POST', body: JSON.stringify({ name: 'X' }) }, ownerToken)
  check('POST /workspaces khi đã có → 409', dup.status === 409)

  // 4) PATCH current
  const upd = await api('/workspaces/current', { method: 'PATCH', body: JSON.stringify({ name: 'Nhóm CloudMind' }) }, ownerToken)
  check('PATCH /workspaces/current', upd.body.data?.name === 'Nhóm CloudMind')

  // 5) Seats
  const seats0 = await api('/workspaces/current/seats', {}, ownerToken)
  check('GET seats (3 mua / 1 dùng / 2 trống)', seats0.body.data.purchased === 3 && seats0.body.data.used === 1 && seats0.body.data.available === 2)

  // 6) Mời thành viên
  const inv = await api('/workspaces/current/invites', { method: 'POST', body: JSON.stringify({ email: inviteeEmail, wsRole: 'member' }) }, ownerToken)
  check('POST invite → 201', inv.status === 201 && !!inv.body.data.token)
  const inviteToken = inv.body.data.token as string
  const invList = await api('/workspaces/current/invites', {}, ownerToken)
  check('GET invites = 1', invList.body.data?.length === 1)
  const invByToken = await api(`/invites/${inviteToken}`)
  check('GET /invites/:token (công khai)', invByToken.status === 200 && invByToken.body.data.email === inviteeEmail && invByToken.body.data.workspace?.name === 'Nhóm CloudMind')

  // 7) Tạo invitee + login, accept
  await User.create({ email: inviteeEmail, name: 'Thành Viên', passwordHash: await bcrypt.hash('Invitee@123', 10), emailVerified: true, status: 'active' })
  const il = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: inviteeEmail, password: 'Invitee@123' }) })
  const inviteeToken = il.body.data.accessToken as string
  const inviteeId = il.body.data.user.id as string

  // member chưa có quyền gỡ thành viên (test guard)
  const guard = await api(`/workspaces/current/members/x/role`, { method: 'PATCH', body: JSON.stringify({ role: 'member' }) }, inviteeToken)
  check('member chưa thuộc ws → 403 (requireWorkspace)', guard.status === 403)

  const acc = await api(`/invites/${inviteToken}/accept`, { method: 'POST' }, inviteeToken)
  check('accept invite → vào workspace', acc.status === 200 && acc.body.data.id === wsId)

  // 8) Members
  const mem = await api('/workspaces/current/members', {}, ownerToken)
  check('GET members = 2', mem.body.data?.length === 2)
  const inviteeMember = mem.body.data.find((m: any) => m.user.id === inviteeId)
  const ownerMember = mem.body.data.find((m: any) => m.user.id === ownerId)

  // 9) Đổi vai trò invitee → wsadmin
  const role = await api(`/workspaces/current/members/${inviteeMember.id}/role`, { method: 'PATCH', body: JSON.stringify({ role: 'wsadmin' }) }, ownerToken)
  check('PATCH member role → wsadmin', role.body.data?.wsRole === 'wsadmin')

  // 10) Set seats 5
  const setSeats = await api('/workspaces/current/seats', { method: 'POST', body: JSON.stringify({ seats: 5 }) }, ownerToken)
  check('POST seats → 5', setSeats.body.data?.purchased === 5)
  check('subscription.seats đồng bộ = 5', (await Subscription.findOne({ owner: ownerId }))?.seats === 5)

  // 10a) wsadmin (không phải chủ sở hữu) cũng chỉnh được ghế — giữ nguyên 5, chỉ kiểm tra quyền.
  //      Ghi tiền vào subscription của CHỦ workspace, không phải của admin thao tác.
  const adminSeats = await api('/workspaces/current/seats', { method: 'POST', body: JSON.stringify({ seats: 5 }) }, inviteeToken)
  check('POST seats bởi wsadmin → OK (purchased = 5)', adminSeats.status === 200 && adminSeats.body.data?.purchased === 5)
  check('subscription vẫn của chủ sở hữu = 5', (await Subscription.findOne({ owner: ownerId }))?.seats === 5)

  // 10b) Resend + Revoke một lời mời khác
  const inv2 = await api('/workspaces/current/invites', { method: 'POST', body: JSON.stringify({ email: `resend.${Date.now()}@example.com` }) }, ownerToken)
  const inv2Id = inv2.body.data.id as string
  const resend = await api(`/workspaces/current/invites/${inv2Id}/resend`, { method: 'POST' }, ownerToken)
  check('resend invite → 200', resend.status === 200)
  const revoke = await api(`/workspaces/current/invites/${inv2Id}`, { method: 'DELETE' }, ownerToken)
  check('revoke invite → 200', revoke.status === 200)

  // 11) Chia sẻ: tạo folder nhóm + permissions
  const folder = await api('/folders', { method: 'POST', body: JSON.stringify({ name: 'Tài liệu nhóm', workspaceId: wsId }) }, ownerToken)
  const folderId = folder.body.data.id as string
  const shared = await api('/workspaces/current/shared', {}, ownerToken)
  check('GET shared chứa folder nhóm', (shared.body.data?.folders ?? []).some((f: any) => f.id === folderId))
  const perms = await api(`/workspaces/current/folders/${folderId}/permissions`, { method: 'PATCH', body: JSON.stringify({ permissions: [{ user: inviteeId, access: 'edit' }] }) }, ownerToken)
  check('PATCH folder permissions', perms.status === 200 && perms.body.data?.permissions?.length === 1)

  // 12) Hoạt động
  const act = await api('/workspaces/current/activity', {}, ownerToken)
  check('GET activity > 0', Array.isArray(act.body.data) && act.body.data.length > 0, `(${act.body.data?.length} sự kiện)`)

  // 13) Owner không thể rời nhóm
  const ownerLeave = await api('/workspaces/current/leave', { method: 'POST' }, ownerToken)
  check('owner leave → 400', ownerLeave.status === 400)

  // 14) Chuyển quyền sở hữu cho invitee
  const transfer = await api('/workspaces/current/transfer', { method: 'POST', body: JSON.stringify({ memberId: inviteeMember.id }) }, ownerToken)
  check('transfer ownership → ok', transfer.status === 200)
  const mem2 = await api('/workspaces/current/members', {}, inviteeToken)
  const newOwner = mem2.body.data.find((m: any) => m.user.id === inviteeId)
  const demoted = mem2.body.data.find((m: any) => m.user.id === ownerId)
  check('sau transfer: invitee=owner, minhanh=wsadmin', newOwner?.wsRole === 'owner' && demoted?.wsRole === 'wsadmin')

  // 15) minhanh (giờ wsadmin) rời nhóm
  const leave = await api('/workspaces/current/leave', { method: 'POST' }, ownerToken)
  check('wsadmin leave → 200', leave.status === 200)
  check('minhanh.workspaceId đã xoá', (await User.findById(ownerId))?.workspaceId == null)
  const mem3 = await api('/workspaces/current/members', {}, inviteeToken)
  check('members còn 1', mem3.body.data?.length === 1)

  // 16) invitee (owner) giải tán workspace
  const del = await api('/workspaces/current', { method: 'DELETE' }, inviteeToken)
  check('DELETE workspace → 200', del.status === 200)
  check('workspace đã xoá', !(await Workspace.findById(wsId)))
  check('invitee.workspaceId đã xoá', (await User.findById(inviteeId))?.workspaceId == null)

  // Cleanup
  await Workspace.deleteOne({ _id: wsId }); await WorkspaceMember.deleteMany({ workspace: wsId }); await WorkspaceInvite.deleteMany({ workspace: wsId }); await Activity.deleteMany({ workspace: wsId })
  await Subscription.deleteOne({ owner: ownerId }); await Transaction.deleteMany({ owner: ownerId })
  await Folder.deleteMany({ name: 'Tài liệu nhóm' })
  await User.deleteOne({ email: inviteeEmail })
  await User.findByIdAndUpdate(ownerId, { plan: 'Pro', storageTotal: 500 * GB, workspaceId: null })

  logger.info(`\n=== KẾT QUẢ M5: ${pass} pass / ${fail} fail ===`)
  await disconnectDB()
  process.exit(fail === 0 ? 0 : 1)
}

main().catch((err) => { logger.error({ err }, 'Test M5 lỗi'); process.exit(1) })
