import { Plan, DEFAULT_PLANS } from '../../models/Plan'
import { logger } from '../../utils/logger'

/** Tạo các gói mặc định nếu chưa có (không ghi đè gói đã chỉnh sửa). */
export async function ensureDefaultPlans(): Promise<void> {
  for (const p of DEFAULT_PLANS) {
    await Plan.updateOne({ key: p.key }, { $setOnInsert: p }, { upsert: true })
  }
  logger.info('✅ Đã đảm bảo các gói mặc định (free/pro/team)')
}
