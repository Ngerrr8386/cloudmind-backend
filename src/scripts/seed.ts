import bcrypt from 'bcryptjs'
import { connectDB, disconnectDB } from '../config/db'
import { User } from '../models/User'
import { logger } from '../utils/logger'

const GB = 1024 * 1024 * 1024

async function seed(): Promise<void> {
  await connectDB()

  const admin = 'admin@cloudmind.vn'
  if (!(await User.findOne({ email: admin }))) {
    await User.create({
      email: admin,
      name: 'Hải Đăng',
      passwordHash: await bcrypt.hash('Admin@12345', 10),
      role: 'admin',
      plan: 'Team',
      tone: 'indigo',
      emailVerified: true,
    })
    logger.info(`✅ Tạo admin: ${admin} / Admin@12345`)
  }

  const customer = 'minhanh@gmail.com'
  if (!(await User.findOne({ email: customer }))) {
    await User.create({
      email: customer,
      name: 'Minh Anh',
      passwordHash: await bcrypt.hash('Demo@12345', 10),
      role: 'customer',
      plan: 'Pro',
      tone: 'violet',
      storageTotal: 500 * GB,
      emailVerified: true,
    })
    logger.info(`✅ Tạo khách demo: ${customer} / Demo@12345`)
  }

  await disconnectDB()
  logger.info('🌱 Seed xong')
  process.exit(0)
}

seed().catch((err) => {
  logger.error({ err }, 'Seed thất bại')
  process.exit(1)
})
