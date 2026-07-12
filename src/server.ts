import app from './app'
import { env } from './config/env'
import { connectDB, disconnectDB } from './config/db'
import { initFirebase } from './config/firebase'
import { initGemini } from './config/gemini'
import { initMailer } from './modules/mail/mail.service'
import { initPayos } from './config/payos'
import { ensureDefaultPlans } from './modules/billing/plans.seed'
import { ensureDefaultSettings } from './modules/admin/admin.shared'
import { logger } from './utils/logger'

async function bootstrap(): Promise<void> {
  // Khởi tạo các dịch vụ ngoài (có guard nếu thiếu cấu hình)
  initFirebase()
  initGemini()
  initMailer()
  initPayos()

  // Kết nối DB không chặn quá trình boot — server vẫn lên để /health phản hồi
  connectDB()
    .then(() => Promise.all([ensureDefaultPlans(), ensureDefaultSettings()]))
    .catch((err) =>
      logger.error({ err }, '❌ Không kết nối được MongoDB — server vẫn chạy, /health sẽ báo disconnected'),
    )

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 CloudMind API đang chạy tại http://localhost:${env.PORT} (${env.NODE_ENV})`)
  })

  const shutdown = (signal: string): void => {
    logger.info(`${signal} nhận được — đang tắt server...`)
    server.close(() => {
      void disconnectDB().finally(() => process.exit(0))
    })
    setTimeout(() => process.exit(1), 10_000).unref()
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('unhandledRejection', (reason) => logger.error({ reason }, 'unhandledRejection'))
}

void bootstrap()
