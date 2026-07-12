import { Router } from 'express'
import healthRoutes from './modules/health/health.routes'
import authRoutes from './modules/auth/auth.routes'
import meRoutes from './modules/me/me.routes'
import folderRoutes from './modules/folders/folders.routes'
import fileRoutes from './modules/files/files.routes'
import aiRoutes from './modules/ai/ai.routes'
import billingRoutes from './modules/billing/billing.routes'
import webhookRoutes from './modules/billing/webhook.routes'
import workspaceRoutes from './modules/workspaces/workspace.routes'
import invitesRoutes from './modules/workspaces/invites.routes'
import dashboardRoutes from './modules/dashboard/dashboard.routes'
import notificationRoutes from './modules/notifications/notifications.routes'
import adminRoutes from './modules/admin/admin.routes'

/** API v1 router — gắn toàn bộ module dưới /api/v1. */
const api = Router()

api.use('/', healthRoutes) // /health, /config
api.use('/auth', authRoutes)
api.use('/me', meRoutes)
api.use('/folders', folderRoutes)
api.use('/files', fileRoutes)
api.use('/ai', aiRoutes)
api.use('/', billingRoutes) // /plans, /subscription, /billing/invoices
api.use('/webhooks', webhookRoutes) // /webhooks/payment (PayOS)
api.use('/workspaces', workspaceRoutes)
api.use('/invites', invitesRoutes)
api.use('/dashboard', dashboardRoutes)
api.use('/', notificationRoutes) // /activity, /notifications
api.use('/admin', adminRoutes)

export default api
