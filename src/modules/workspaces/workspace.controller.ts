import * as svc from './workspace.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { ok, created } from '../../utils/response'

/* Workspace */
export const create = asyncHandler(async (req, res) => {
  created(res, await svc.createWorkspace(req.user!.id, req.body))
})
export const current = asyncHandler(async (req, res) => {
  ok(res, await svc.getCurrent(req.user!.id))
})
export const update = asyncHandler(async (req, res) => {
  ok(res, await svc.updateWorkspace(req.workspaceId!, req.body, req.user!.id))
})
export const transfer = asyncHandler(async (req, res) => {
  ok(res, await svc.transferOwnership(req.workspaceId!, req.user!.id, req.body.memberId))
})
export const remove = asyncHandler(async (req, res) => {
  await svc.deleteWorkspace(req.workspaceId!)
  ok(res, { message: 'Đã giải tán không gian làm việc' })
})

/* Members */
export const members = asyncHandler(async (req, res) => {
  ok(res, await svc.listMembers(req.workspaceId!))
})
export const memberRole = asyncHandler(async (req, res) => {
  ok(res, await svc.updateMemberRole(req.workspaceId!, req.params.id, req.body.role, req.user!.id))
})
export const removeMember = asyncHandler(async (req, res) => {
  await svc.removeMember(req.workspaceId!, req.params.id, req.user!.id)
  ok(res, { message: 'Đã gỡ thành viên' })
})
export const leave = asyncHandler(async (req, res) => {
  await svc.leaveWorkspace(req.workspaceId!, req.user!.id)
  ok(res, { message: 'Đã rời khỏi nhóm' })
})

/* Invites */
export const createInvite = asyncHandler(async (req, res) => {
  created(res, await svc.createInvite(req.workspaceId!, req.user!.id, req.body))
})
export const listInvites = asyncHandler(async (req, res) => {
  ok(res, await svc.listInvites(req.workspaceId!))
})
export const resendInvite = asyncHandler(async (req, res) => {
  ok(res, await svc.resendInvite(req.workspaceId!, req.params.id, req.user!.id))
})
export const revokeInvite = asyncHandler(async (req, res) => {
  await svc.revokeInvite(req.workspaceId!, req.params.id)
  ok(res, { message: 'Đã thu hồi lời mời' })
})

/* Invite by token (không cần là thành viên) */
export const inviteByToken = asyncHandler(async (req, res) => {
  ok(res, await svc.getInviteByToken(req.params.token))
})
export const acceptInvite = asyncHandler(async (req, res) => {
  ok(res, await svc.acceptInvite(req.user!.id, req.params.token))
})
export const declineInvite = asyncHandler(async (req, res) => {
  await svc.declineInvite(req.user!.id, req.params.token)
  ok(res, { message: 'Đã từ chối lời mời' })
})

/* Seats / Shared / Activity */
export const getSeats = asyncHandler(async (req, res) => {
  ok(res, await svc.getSeats(req.workspaceId!))
})
export const setSeats = asyncHandler(async (req, res) => {
  ok(res, await svc.setSeats(req.workspaceId!, req.user!.id, req.body.seats))
})
export const shared = asyncHandler(async (req, res) => {
  ok(res, await svc.getShared(req.workspaceId!))
})
export const folderPermissions = asyncHandler(async (req, res) => {
  ok(res, await svc.setFolderPermissions(req.workspaceId!, req.params.id, req.body.permissions, req.user!.id))
})
export const attachFolder = asyncHandler(async (req, res) => {
  ok(res, await svc.attachFolder(req.workspaceId!, req.user!.id, req.params.id))
})
export const detachFolder = asyncHandler(async (req, res) => {
  ok(res, await svc.detachFolder(req.workspaceId!, req.user!.id, req.params.id))
})
export const activity = asyncHandler(async (req, res) => {
  ok(res, await svc.getActivity(req.workspaceId!))
})
