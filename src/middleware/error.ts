import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import mongoose from 'mongoose'
import { ApiError } from '../utils/ApiError'
import { isProd } from '../config/env'
import { logger } from '../utils/logger'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  // ApiError nghiệp vụ
  if (err instanceof ApiError) {
    res.status(err.status).json({ success: false, error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) } })
    return
  }

  // Lỗi validate Zod (nếu lọt ra ngoài)
  if (err instanceof ZodError) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'Dữ liệu không hợp lệ', details: err.flatten().fieldErrors } })
    return
  }

  // Trùng khoá duy nhất (vd email/firebaseUid)
  if (err && typeof err === 'object' && (err as { code?: number }).code === 11000) {
    const key = Object.keys((err as { keyValue?: Record<string, unknown> }).keyValue ?? {})[0] ?? 'trường'
    res.status(409).json({ success: false, error: { code: 'CONFLICT', message: `Giá trị '${key}' đã tồn tại` } })
    return
  }

  // CastError (ObjectId sai định dạng)
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION', message: `Giá trị '${err.path}' không hợp lệ` } })
    return
  }

  // Còn lại → 500
  logger.error({ err }, 'Lỗi không xử lý được')
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL', message: isProd ? 'Lỗi máy chủ nội bộ' : String((err as Error)?.message ?? err) },
  })
}
