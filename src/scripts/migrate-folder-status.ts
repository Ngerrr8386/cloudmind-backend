import { connectDB, disconnectDB } from '../config/db'
import { Folder } from '../models/Folder'
import { logger } from '../utils/logger'

/**
 * Backfill Folder.status cho thư mục tạo TRƯỚC khi có tính năng Trash/Restore.
 * Thư mục cũ không có trường `status` sẽ bị bộ lọc `{ status: 'active' }` bỏ sót
 * (biến mất khỏi danh sách) — script này gán 'active' để chúng hiển thị lại.
 * Idempotent: chỉ chạm vào doc còn THIẾU `status`, chạy lại nhiều lần đều an toàn.
 */
async function migrate(): Promise<void> {
  await connectDB()

  const res = await Folder.updateMany(
    { status: { $exists: false } },
    { $set: { status: 'active', trashedAt: null } },
  )
  logger.info(
    `📁 Backfill Folder.status — khớp ${res.matchedCount}, cập nhật ${res.modifiedCount} thư mục`,
  )

  await disconnectDB()
  logger.info('✅ Migration thư mục xong')
  process.exit(0)
}

migrate().catch((err) => {
  logger.error({ err }, 'Migration thư mục thất bại')
  process.exit(1)
})
