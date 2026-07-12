import { Router } from 'express'
import { ok } from '../../utils/response'
import { dbState, isDbReady } from '../../config/db'
import { isFirebaseReady } from '../../config/firebase'
import { isGeminiReady } from '../../config/gemini'
import { isMailerReady } from '../mail/mail.service'
import { isPayosReady } from '../../config/payos'
import { env } from '../../config/env'

const router = Router()

/** GET /health — kiểm tra sức khoẻ các dịch vụ phụ thuộc. */
router.get('/health', (_req, res) => {
  ok(res, {
    status: 'ok',
    uptime: Math.round(process.uptime()),
    services: {
      database: { ready: isDbReady(), state: dbState() },
      firebase: { ready: isFirebaseReady() },
      gemini: { ready: isGeminiReady() },
      mailer: { ready: isMailerReady() },
      payos: { ready: isPayosReady() },
    },
    timestamp: new Date().toISOString(),
  })
})

/** GET /config — cấu hình công khai cho client. */
router.get('/config', (_req, res) => {
  ok(res, {
    appName: 'CloudMind',
    env: env.NODE_ENV,
    features: {
      googleLogin: isFirebaseReady(),
      ai: isGeminiReady(),
      storage: isFirebaseReady(),
      email: isMailerReady(),
      payment: isPayosReady(),
    },
    limits: {
      maxUploadMB: 1024,
    },
  })
})

export default router
