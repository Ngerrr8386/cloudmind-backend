import type { Request, Response } from 'express'
import { getPayos } from '../../config/payos'
import { handlePaidOrder } from './billing.service'
import { logger } from '../../utils/logger'

/**
 * Webhook PayOS: xác minh chữ ký rồi kích hoạt gói nếu thanh toán thành công.
 * Luôn phản hồi nhanh; PayOS sẽ retry nếu không nhận 200.
 */
export async function payosWebhook(req: Request, res: Response): Promise<void> {
  try {
    const data = (await getPayos().webhooks.verify(req.body)) as { orderCode?: number; code?: string }
    if (data?.orderCode && (data.code === undefined || data.code === '00')) {
      await handlePaidOrder(Number(data.orderCode))
    }
    res.status(200).json({ success: true })
  } catch (err) {
    logger.warn({ err: err instanceof Error ? err.message : err }, 'PayOS webhook không hợp lệ')
    res.status(400).json({ success: false })
  }
}
