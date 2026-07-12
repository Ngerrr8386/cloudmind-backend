import { Router } from 'express'
import { requireAuth } from '../../middleware/auth'
import { requireRole } from '../../middleware/role'
import overviewRoutes from './overview.routes'
import usersRoutes from './users.routes'
import contentRoutes from './content.routes'
import billingRoutes from './billing.routes'
import plansRoutes from './plans.routes'
import aiRoutes from './ai.routes'
import auditRoutes from './audit.routes'
import settingsRoutes from './settings.routes'
import workspacesRoutes from './workspaces.routes'

/** Toàn bộ route admin — yêu cầu đăng nhập + role admin. Mount tại /admin. */
const router = Router()
router.use(requireAuth, requireRole('admin'))

router.use(overviewRoutes)
router.use(usersRoutes)
router.use(contentRoutes)
router.use(billingRoutes)
router.use(plansRoutes)
router.use(aiRoutes)
router.use(auditRoutes)
router.use(settingsRoutes)
router.use(workspacesRoutes)

export default router
