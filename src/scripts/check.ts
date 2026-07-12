import mongoose from 'mongoose'
import { connectDB, disconnectDB } from '../config/db'
import { User } from '../models/User'
import { logger } from '../utils/logger'

async function main(): Promise<void> {
  await connectDB()
  logger.info(`📂 Database đang dùng: "${mongoose.connection.name}"`)

  const total = await User.countDocuments()
  const users = await User.find().select('email role plan status provider').sort({ createdAt: 1 }).lean()

  logger.info(`👥 Tổng users trong collection "users": ${total}`)
  for (const u of users) {
    logger.info(`   - ${u.email} | role=${u.role} | plan=${u.plan} | status=${u.status} | provider=${u.provider}`)
  }

  // Liệt kê các collection trong DB để xem dữ liệu nằm đâu
  const cols = await mongoose.connection.db?.listCollections().toArray()
  logger.info(`🗄️  Collections: ${(cols ?? []).map((c) => c.name).join(', ') || '(trống)'}`)

  await disconnectDB()
  process.exit(0)
}

main().catch((err) => {
  logger.error({ err }, 'Check thất bại')
  process.exit(1)
})
