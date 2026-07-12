import { Router } from 'express'
import * as c from './billing.controller'
import { requireAuth } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { checkoutSchema, orderCodeParam } from './billing.validators'

const router = Router()

// Công khai
router.get('/plans', c.listPlans)

// Yêu cầu đăng nhập
router.get('/subscription', requireAuth, c.getSubscription)
router.post('/subscription/checkout', requireAuth, validate(checkoutSchema), c.checkout)
router.post('/subscription/cancel', requireAuth, c.cancel)
router.post('/subscription/sync/:orderCode', requireAuth, validate(orderCodeParam, 'params'), c.syncOrder)
router.post('/subscription/checkout/:orderCode/cancel', requireAuth, validate(orderCodeParam, 'params'), c.cancelCheckout)

router.get('/billing/invoices', requireAuth, c.listInvoices)
router.get('/billing/invoices/:id', requireAuth, c.getInvoice)

export default router
