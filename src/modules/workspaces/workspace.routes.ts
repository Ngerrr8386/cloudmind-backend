import { Router } from 'express'
import * as c from './workspace.controller'
import { requireAuth } from '../../middleware/auth'
import { requireWorkspace, requireWsRole } from '../../middleware/workspace'
import { validate } from '../../middleware/validate'
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  transferSchema,
  memberRoleSchema,
  inviteSchema,
  seatsSchema,
  permissionsSchema,
} from './workspace.validators'

const router = Router()
router.use(requireAuth)

// Workspace
router.post('/', validate(createWorkspaceSchema), c.create)
router.get('/current', requireWorkspace, c.current)
router.patch('/current', requireWorkspace, requireWsRole('owner', 'wsadmin'), validate(updateWorkspaceSchema), c.update)
router.post('/current/transfer', requireWorkspace, requireWsRole('owner'), validate(transferSchema), c.transfer)
router.delete('/current', requireWorkspace, requireWsRole('owner'), c.remove)

// Thành viên
router.get('/current/members', requireWorkspace, c.members)
router.patch('/current/members/:id/role', requireWorkspace, requireWsRole('owner', 'wsadmin'), validate(memberRoleSchema), c.memberRole)
router.delete('/current/members/:id', requireWorkspace, requireWsRole('owner', 'wsadmin'), c.removeMember)
router.post('/current/leave', requireWorkspace, c.leave)

// Lời mời
router.post('/current/invites', requireWorkspace, requireWsRole('owner', 'wsadmin'), validate(inviteSchema), c.createInvite)
router.get('/current/invites', requireWorkspace, requireWsRole('owner', 'wsadmin'), c.listInvites)
router.post('/current/invites/:id/resend', requireWorkspace, requireWsRole('owner', 'wsadmin'), c.resendInvite)
router.delete('/current/invites/:id', requireWorkspace, requireWsRole('owner', 'wsadmin'), c.revokeInvite)

// Seat / Chia sẻ / Hoạt động
router.get('/current/seats', requireWorkspace, c.getSeats)
router.post('/current/seats', requireWorkspace, requireWsRole('owner', 'wsadmin'), validate(seatsSchema), c.setSeats)
router.get('/current/shared', requireWorkspace, c.shared)
router.post('/current/folders/:id/attach', requireWorkspace, requireWsRole('owner', 'wsadmin'), c.attachFolder)
router.post('/current/folders/:id/detach', requireWorkspace, requireWsRole('owner', 'wsadmin'), c.detachFolder)
router.patch('/current/folders/:id/permissions', requireWorkspace, requireWsRole('owner', 'wsadmin'), validate(permissionsSchema), c.folderPermissions)
router.get('/current/activity', requireWorkspace, c.activity)

export default router
