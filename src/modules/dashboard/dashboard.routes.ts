import { Router } from 'express'
import * as c from './dashboard.controller'
import { requireAuth } from '../../middleware/auth'

const router = Router()
router.use(requireAuth)

router.get('/stats', c.stats)
router.get('/storage-breakdown', c.storageBreakdown)
router.get('/activity-chart', c.activityChart)

export default router
