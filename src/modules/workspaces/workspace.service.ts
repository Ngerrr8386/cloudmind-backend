import crypto from 'crypto'
import { Workspace } from '../../models/Workspace'
import { WorkspaceMember, type WsRole } from '../../models/WorkspaceMember'
import { WorkspaceInvite } from '../../models/WorkspaceInvite'
import { Activity } from '../../models/Activity'
import { Subscription } from '../../models/Subscription'
import { Plan } from '../../models/Plan'
import { User } from '../../models/User'
import { Folder } from '../../models/Folder'
import { File } from '../../models/File'
import { ApiError } from '../../utils/ApiError'
import { env } from '../../config/env'
import { sendMail } from '../mail/mail.service'
import { inviteEmail } from '../mail/templates'

const INVITE_TTL_DAYS = 7

async function logActivity(workspace: unknown, actor: string, type: string, message: string, meta?: Record<string, unknown>) {
  await Activity.create({ workspace, actor, type, message, meta })
}

async function seatUsage(workspaceId: string) {
  const [members, pending, ws] = await Promise.all([
    WorkspaceMember.countDocuments({ workspace: workspaceId }),
    WorkspaceInvite.countDocuments({ workspace: workspaceId, status: 'pending' }),
    Workspace.findById(workspaceId),
  ])
  const purchased = ws?.seats ?? 0
  const used = members + pending
  return { purchased, used, available: Math.max(0, purchased - used) }
}

/* --------------------------- Workspace --------------------------- */

/** Dùng nội bộ (billing hook): đảm bảo owner có workspace khi kích hoạt gói Team. */
export async function ensureWorkspaceForOwner(ownerId: string, seats: number): Promise<void> {
  const existing = await WorkspaceMember.findOne({ user: ownerId })
  if (existing) {
    await Workspace.updateOne({ _id: existing.workspace, owner: ownerId }, { seats })
    return
  }
  const user = await User.findById(ownerId)
  const ws = await Workspace.create({ name: `Nhóm của ${user?.name ?? 'bạn'}`, owner: ownerId, seats })
  await WorkspaceMember.create({ workspace: ws._id, user: ownerId, wsRole: 'owner' })
  await User.findByIdAndUpdate(ownerId, { workspaceId: ws._id })
  await logActivity(ws._id, ownerId, 'workspace.created', `Tạo không gian làm việc "${ws.name}"`)
}

export async function createWorkspace(ownerId: string, input: { name?: string }) {
  const sub = await Subscription.findOne({ owner: ownerId, planKey: 'team', status: { $in: ['active', 'canceled'] } })
  if (!sub) throw ApiError.badRequest('Bạn cần gói Team đang hoạt động để tạo không gian làm việc')
  if (await WorkspaceMember.findOne({ user: ownerId })) throw ApiError.conflict('Bạn đã thuộc một không gian làm việc')

  const user = await User.findById(ownerId)
  const name = input.name?.trim() || `Nhóm của ${user?.name ?? 'bạn'}`
  const ws = await Workspace.create({ name, owner: ownerId, seats: sub.seats || 1 })
  await WorkspaceMember.create({ workspace: ws._id, user: ownerId, wsRole: 'owner' })
  await User.findByIdAndUpdate(ownerId, { workspaceId: ws._id })
  await logActivity(ws._id, ownerId, 'workspace.created', `Tạo không gian làm việc "${name}"`)
  return ws.toJSON()
}

export async function getCurrent(userId: string) {
  const member = await WorkspaceMember.findOne({ user: userId })
  if (!member) throw ApiError.notFound('Bạn chưa thuộc không gian làm việc nào')
  const ws = await Workspace.findById(member.workspace)
  if (!ws) throw ApiError.notFound('Không gian làm việc không tồn tại')
  const memberCount = await WorkspaceMember.countDocuments({ workspace: ws._id })
  return { ...ws.toJSON(), myRole: member.wsRole, memberCount }
}

export async function updateWorkspace(workspaceId: string, input: { name?: string; slug?: string; logoUrl?: string }, actorId: string) {
  const ws = await Workspace.findById(workspaceId)
  if (!ws) throw ApiError.notFound('Không tìm thấy workspace')
  if (input.name !== undefined) ws.name = input.name
  if (input.slug !== undefined) ws.slug = input.slug
  if (input.logoUrl !== undefined) ws.logoUrl = input.logoUrl
  await ws.save()
  await logActivity(ws._id, actorId, 'workspace.updated', `Cập nhật thông tin workspace`)
  return ws.toJSON()
}

export async function transferOwnership(workspaceId: string, currentOwnerId: string, targetMemberId: string) {
  const target = await WorkspaceMember.findOne({ _id: targetMemberId, workspace: workspaceId })
  if (!target) throw ApiError.notFound('Không tìm thấy thành viên')
  if (String(target.user) === currentOwnerId) throw ApiError.badRequest('Bạn đã là chủ sở hữu')

  await WorkspaceMember.updateOne({ workspace: workspaceId, user: currentOwnerId }, { wsRole: 'wsadmin' })
  target.wsRole = 'owner'
  await target.save()
  await Workspace.updateOne({ _id: workspaceId }, { owner: target.user })
  await logActivity(workspaceId, currentOwnerId, 'workspace.transfer', 'Chuyển quyền sở hữu workspace')
  return { ok: true }
}

export async function deleteWorkspace(workspaceId: string) {
  const members = await WorkspaceMember.find({ workspace: workspaceId }).select('user').lean()
  const userIds = members.map((m) => m.user)
  await User.updateMany({ _id: { $in: userIds } }, { workspaceId: null })
  // File/thư mục nhóm trở về cá nhân của chủ sở hữu cũ
  await File.updateMany({ workspaceId }, { workspaceId: null })
  await Folder.updateMany({ workspaceId }, { workspaceId: null })
  await WorkspaceMember.deleteMany({ workspace: workspaceId })
  await WorkspaceInvite.deleteMany({ workspace: workspaceId })
  await Activity.deleteMany({ workspace: workspaceId })
  await Workspace.deleteOne({ _id: workspaceId })
}

/* --------------------------- Thành viên --------------------------- */

export async function listMembers(workspaceId: string) {
  const members = await WorkspaceMember.find({ workspace: workspaceId })
    .populate<{ user: { _id: unknown; name: string; email: string; avatarUrl?: string; storageUsed: number } }>('user', 'name email avatarUrl storageUsed')
    .sort({ createdAt: 1 })
    .lean()
  return members.map((m) => ({
    id: String(m._id),
    wsRole: m.wsRole,
    joinedAt: m.joinedAt,
    user: m.user ? { id: String(m.user._id), name: m.user.name, email: m.user.email, avatarUrl: m.user.avatarUrl, storageUsed: m.user.storageUsed } : null,
  }))
}

export async function updateMemberRole(workspaceId: string, memberId: string, role: WsRole, actorId: string) {
  if (role === 'owner') throw ApiError.badRequest('Dùng chức năng chuyển quyền sở hữu để gán chủ sở hữu')
  const member = await WorkspaceMember.findOne({ _id: memberId, workspace: workspaceId })
  if (!member) throw ApiError.notFound('Không tìm thấy thành viên')
  if (member.wsRole === 'owner') throw ApiError.badRequest('Không thể đổi vai trò của chủ sở hữu')
  member.wsRole = role
  await member.save()
  await logActivity(workspaceId, actorId, 'member.role', `Đổi vai trò thành viên thành ${role}`)
  return { id: String(member._id), wsRole: member.wsRole }
}

export async function removeMember(workspaceId: string, memberId: string, actorId: string) {
  const member = await WorkspaceMember.findOne({ _id: memberId, workspace: workspaceId })
  if (!member) throw ApiError.notFound('Không tìm thấy thành viên')
  if (member.wsRole === 'owner') throw ApiError.badRequest('Không thể gỡ chủ sở hữu')
  await User.findByIdAndUpdate(member.user, { workspaceId: null })
  await member.deleteOne()
  await logActivity(workspaceId, actorId, 'member.removed', 'Gỡ một thành viên khỏi workspace')
}

export async function leaveWorkspace(workspaceId: string, userId: string) {
  const member = await WorkspaceMember.findOne({ workspace: workspaceId, user: userId })
  if (!member) throw ApiError.notFound('Bạn không thuộc workspace này')
  if (member.wsRole === 'owner') throw ApiError.badRequest('Chủ sở hữu phải chuyển quyền trước khi rời nhóm')
  await User.findByIdAndUpdate(userId, { workspaceId: null })
  await member.deleteOne()
  await logActivity(workspaceId, userId, 'member.left', 'Một thành viên đã rời workspace')
}

/* --------------------------- Lời mời --------------------------- */

export async function createInvite(workspaceId: string, inviterId: string, input: { email: string; wsRole?: WsRole }) {
  const email = input.email.toLowerCase()
  const existingUser = await User.findOne({ email })
  if (existingUser && (await WorkspaceMember.findOne({ workspace: workspaceId, user: existingUser._id }))) {
    throw ApiError.conflict('Người dùng này đã là thành viên')
  }
  if (await WorkspaceInvite.findOne({ workspace: workspaceId, email, status: 'pending' })) {
    throw ApiError.conflict('Đã có lời mời đang chờ cho email này')
  }
  const usage = await seatUsage(workspaceId)
  if (usage.available <= 0) throw ApiError.badRequest('Đã hết chỗ (seat). Hãy mua thêm seat trước khi mời')

  const token = crypto.randomBytes(24).toString('hex')
  const invite = await WorkspaceInvite.create({
    workspace: workspaceId,
    email,
    token,
    wsRole: input.wsRole ?? 'member',
    invitedBy: inviterId,
    status: 'pending',
    expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86400000),
  })

  const [ws, inviter] = await Promise.all([Workspace.findById(workspaceId), User.findById(inviterId)])
  await sendMail(email, inviteEmail({
    workspaceName: ws?.name ?? 'Nhóm',
    inviterName: inviter?.name ?? 'Quản trị viên',
    acceptUrl: `${env.APP_URL}/invite/${token}`,
  }))
  await logActivity(workspaceId, inviterId, 'invite.sent', `Mời ${email} vào nhóm`)
  return { ...invite.toJSON(), inviteUrl: `${env.APP_URL}/invite/${token}` }
}

export async function listInvites(workspaceId: string) {
  const invites = await WorkspaceInvite.find({ workspace: workspaceId, status: 'pending' }).sort({ createdAt: -1 }).lean()
  return invites.map((i) => ({ id: String(i._id), email: i.email, wsRole: i.wsRole, status: i.status, expiresAt: i.expiresAt, createdAt: i.createdAt }))
}

export async function resendInvite(workspaceId: string, inviteId: string, actorId: string) {
  const invite = await WorkspaceInvite.findOne({ _id: inviteId, workspace: workspaceId, status: 'pending' })
  if (!invite) throw ApiError.notFound('Không tìm thấy lời mời đang chờ')
  invite.expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86400000)
  await invite.save()
  const [ws, inviter] = await Promise.all([Workspace.findById(workspaceId), User.findById(actorId)])
  await sendMail(invite.email, inviteEmail({
    workspaceName: ws?.name ?? 'Nhóm',
    inviterName: inviter?.name ?? 'Quản trị viên',
    acceptUrl: `${env.APP_URL}/invite/${invite.token}`,
  }))
  return { id: String(invite._id), message: 'Đã gửi lại lời mời' }
}

export async function revokeInvite(workspaceId: string, inviteId: string) {
  const r = await WorkspaceInvite.updateOne({ _id: inviteId, workspace: workspaceId, status: 'pending' }, { status: 'revoked' })
  if (r.matchedCount === 0) throw ApiError.notFound('Không tìm thấy lời mời đang chờ')
}

export async function getInviteByToken(token: string) {
  const invite = await WorkspaceInvite.findOne({ token })
  if (!invite) throw ApiError.notFound('Lời mời không tồn tại')
  const [ws, inviter] = await Promise.all([Workspace.findById(invite.workspace), User.findById(invite.invitedBy)])
  return {
    email: invite.email,
    wsRole: invite.wsRole,
    status: invite.status,
    expired: invite.expiresAt < new Date(),
    workspace: ws ? { id: String(ws._id), name: ws.name } : null,
    invitedBy: inviter?.name ?? null,
  }
}

export async function acceptInvite(userId: string, token: string) {
  const invite = await WorkspaceInvite.findOne({ token })
  if (!invite || invite.status !== 'pending') throw ApiError.badRequest('Lời mời không hợp lệ hoặc đã được xử lý')
  if (invite.expiresAt < new Date()) throw ApiError.badRequest('Lời mời đã hết hạn')

  const user = await User.findById(userId)
  if (!user) throw ApiError.notFound('Không tìm thấy người dùng')
  if (user.email.toLowerCase() !== invite.email) throw ApiError.forbidden('Lời mời này dành cho email khác')
  if (await WorkspaceMember.findOne({ user: userId })) throw ApiError.conflict('Bạn đã thuộc một workspace khác')

  // Seat đã được giữ chỗ khi gửi lời mời (đếm trong "pending"), nên không cần kiểm tra lại
  await WorkspaceMember.create({ workspace: invite.workspace, user: userId, wsRole: invite.wsRole })
  await User.findByIdAndUpdate(userId, { workspaceId: invite.workspace })
  invite.status = 'accepted'
  await invite.save()
  await logActivity(invite.workspace, userId, 'member.joined', `${user.name} đã tham gia nhóm`)
  return getCurrent(userId)
}

export async function declineInvite(userId: string, token: string) {
  const invite = await WorkspaceInvite.findOne({ token, status: 'pending' })
  if (!invite) throw ApiError.notFound('Lời mời không tồn tại hoặc đã xử lý')
  const user = await User.findById(userId)
  if (user && user.email.toLowerCase() !== invite.email) throw ApiError.forbidden('Lời mời này dành cho email khác')
  invite.status = 'declined'
  await invite.save()
}

/* --------------------------- Seat / Chia sẻ / Hoạt động --------------------------- */

export async function getSeats(workspaceId: string) {
  return seatUsage(workspaceId)
}

export async function setSeats(workspaceId: string, actorId: string, seats: number) {
  const usage = await seatUsage(workspaceId)
  const members = await WorkspaceMember.countDocuments({ workspace: workspaceId })
  // Sàn tối thiểu = max(số thành viên hiện tại, số ghế kèm theo của gói Team). Không cho hạ dưới
  // số ghế gói đã bao gồm (đã trả tiền cho từng đó ghế).
  const teamPlan = await Plan.findOne({ key: 'team' }).select('includedSeats')
  const includedSeats = Math.max(1, teamPlan?.includedSeats ?? 1)
  const minSeats = Math.max(members, includedSeats)
  if (seats < minSeats) {
    throw ApiError.badRequest(
      members > includedSeats
        ? `Không thể đặt số seat (${seats}) thấp hơn số thành viên hiện tại (${members})`
        : `Không thể đặt số seat (${seats}) thấp hơn số ghế kèm theo của gói (${includedSeats})`,
    )
  }

  // Seat gắn với gói Team của CHỦ workspace, không phải người thao tác (actor có thể là quản trị
  // viên chứ không sở hữu subscription). Luôn resolve chủ sở hữu để mua/cập nhật đúng subscription.
  const ws = await Workspace.findById(workspaceId).select('owner')
  if (!ws) throw ApiError.notFound('Không tìm thấy không gian làm việc')
  const ownerId = String(ws.owner)

  // Tăng ghế → thu tiền qua PayOS (prorated theo ngày còn lại của kỳ). Ghế chỉ được cộng sau khi
  // thanh toán thành công (handlePaidOrder). Dynamic import để tránh phụ thuộc vòng với billing.
  if (seats > usage.purchased) {
    const { createSeatCheckout } = await import('../billing/billing.service')
    const checkout = await createSeatCheckout(ownerId, seats)
    return { requiresPayment: true as const, ...checkout }
  }

  // Giảm / giữ nguyên → áp dụng ngay, không hoàn tiền.
  await Workspace.updateOne({ _id: workspaceId }, { seats })
  await Subscription.updateOne({ owner: ownerId, planKey: 'team' }, { seats })
  await logActivity(workspaceId, actorId, 'seats.updated', `Cập nhật số seat thành ${seats}`)
  return { ...(await seatUsage(workspaceId)), previous: usage.purchased, requiresPayment: false as const }
}

export async function getShared(workspaceId: string) {
  const [folders, files] = await Promise.all([
    Folder.find({ workspaceId }).sort({ createdAt: 1 }).lean(),
    File.find({ workspaceId, status: { $ne: 'trashed' } }).sort({ updatedAt: -1 }).lean(),
  ])
  // Chỉ hiển thị thư mục gốc của mỗi cây được chia sẻ; thư mục con đi kèm theo cha
  // nên không liệt kê lẻ để danh sách gọn. File thì hiện tất cả (kể cả trong thư mục con).
  const wsFolderIds = new Set(folders.map((f) => String(f._id)))
  const roots = folders.filter((f) => !f.parentId || !wsFolderIds.has(String(f.parentId)))
  return {
    folders: roots.map((f) => ({ ...f, id: String(f._id), _id: undefined })),
    files: files.map((f) => ({ ...f, id: String(f._id), _id: undefined })),
  }
}

/** Thu thập id thư mục gốc + toàn bộ thư mục con (theo parentId) của một chủ sở hữu. */
async function collectFolderSubtree(rootId: string, owner: unknown): Promise<string[]> {
  const ids: string[] = [String(rootId)]
  let frontier: string[] = [String(rootId)]
  while (frontier.length) {
    const children = await Folder.find({ owner, parentId: { $in: frontier } }).select('_id').lean()
    const childIds = children.map((c) => String(c._id))
    if (childIds.length === 0) break
    ids.push(...childIds)
    frontier = childIds
  }
  return ids
}

/** Đưa một thư mục cá nhân (kèm thư mục con + file bên trong) vào không gian nhóm. */
export async function attachFolder(workspaceId: string, actorId: string, folderId: string) {
  const folder = await Folder.findOne({ _id: folderId, owner: actorId })
  if (!folder) throw ApiError.notFound('Không tìm thấy thư mục của bạn')
  if (folder.workspaceId && String(folder.workspaceId) === workspaceId) {
    throw ApiError.conflict('Thư mục đã ở trong nhóm')
  }
  const ids = await collectFolderSubtree(folderId, actorId)
  await Folder.updateMany({ _id: { $in: ids } }, { workspaceId })
  await File.updateMany({ owner: actorId, folderId: { $in: ids } }, { workspaceId })
  await logActivity(workspaceId, actorId, 'folder.shared', `Chia sẻ thư mục "${folder.name}" vào nhóm`)
  return getShared(workspaceId)
}

/** Gỡ một thư mục khỏi không gian nhóm — trả thư mục con + file về cá nhân của chủ sở hữu. */
export async function detachFolder(workspaceId: string, actorId: string, folderId: string) {
  const folder = await Folder.findOne({ _id: folderId, workspaceId })
  if (!folder) throw ApiError.notFound('Không tìm thấy thư mục trong nhóm')
  const ids = await collectFolderSubtree(folderId, folder.owner)
  await Folder.updateMany({ _id: { $in: ids } }, { workspaceId: null, permissions: [] })
  await File.updateMany({ folderId: { $in: ids }, workspaceId }, { workspaceId: null })
  await logActivity(workspaceId, actorId, 'folder.unshared', `Gỡ thư mục "${folder.name}" khỏi nhóm`)
  return getShared(workspaceId)
}

export async function setFolderPermissions(workspaceId: string, folderId: string, permissions: { user: string; access: 'view' | 'edit' }[], actorId: string) {
  const folder = await Folder.findOne({ _id: folderId, workspaceId })
  if (!folder) throw ApiError.notFound('Không tìm thấy thư mục trong workspace')
  folder.set('permissions', permissions)
  await folder.save()
  await logActivity(workspaceId, actorId, 'folder.permissions', `Cập nhật quyền thư mục "${folder.name}"`)
  return folder.toJSON()
}

export async function getActivity(workspaceId: string, limit = 50) {
  const acts = await Activity.find({ workspace: workspaceId })
    .populate<{ actor: { _id: unknown; name: string; avatarUrl?: string } }>('actor', 'name avatarUrl')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
  return acts.map((a) => ({
    id: String(a._id),
    type: a.type,
    message: a.message,
    createdAt: a.createdAt,
    actor: a.actor ? { id: String(a.actor._id), name: a.actor.name, avatarUrl: a.actor.avatarUrl } : null,
  }))
}
