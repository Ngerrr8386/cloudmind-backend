import { Router } from 'express'
import { payosWebhook } from './webhook.controller'

const router = Router()

// PayOS gọi tới đây sau khi thanh toán (đăng ký URL qua payos.webhooks.confirm)
router.post('/payment', payosWebhook)

export default router
