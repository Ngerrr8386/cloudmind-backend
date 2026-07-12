import { Router } from 'express'
import * as c from './workspace.controller'
import { requireAuth, optionalAuth } from '../../middleware/auth'

const router = Router()

// Xem chi tiết lời mời (có thể chưa đăng nhập)
router.get('/:token', optionalAuth, c.inviteByToken)
// Chấp nhận / từ chối (cần đăng nhập)
router.post('/:token/accept', requireAuth, c.acceptInvite)
router.post('/:token/decline', requireAuth, c.declineInvite)

export default router
