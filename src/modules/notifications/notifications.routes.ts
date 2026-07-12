import { Router } from 'express'
import * as c from './notifications.controller'
import { requireAuth } from '../../middleware/auth'

const router = Router()
router.use(requireAuth)

router.get('/activity', c.activity)
router.get('/notifications', c.list)
router.post('/notifications/read-all', c.readAll)
router.post('/notifications/:id/read', c.read)

export default router
