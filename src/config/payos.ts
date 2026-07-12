import { PayOS } from '@payos/node'
import { env, payosConfigured } from './env'
import { logger } from '../utils/logger'
import { ApiError } from '../utils/ApiError'

let client: PayOS | null = null

/** Khởi tạo PayOS. Bỏ qua nếu chưa cấu hình (thanh toán sẽ trả 503). */
export function initPayos(): void {
  if (!payosConfigured) {
    logger.warn('⚠️  PayOS chưa cấu hình — chức năng thanh toán sẽ bị tắt')
    return
  }
  client = new PayOS({
    clientId: env.PAYOS_CLIENT_ID as string,
    apiKey: env.PAYOS_API_KEY as string,
    checksumKey: env.PAYOS_CHECKSUM_KEY as string,
  })
  logger.info('✅ PayOS đã khởi tạo')
}

export const isPayosReady = (): boolean => client !== null

export function getPayos(): PayOS {
  if (!client) throw ApiError.unavailable('Cổng thanh toán PayOS chưa được cấu hình trên máy chủ')
  return client
}
