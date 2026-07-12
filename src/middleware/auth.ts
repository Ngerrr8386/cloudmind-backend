import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt'
import { ApiError } from '../utils/ApiError'

/** Bắt buộc đăng nhập: đọc Bearer token, gắn req.user. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Thiếu access token')
  }
  const token = header.slice(7)
  try {
    const payload = verifyAccessToken(token)
    req.user = { id: payload.sub, role: payload.role }
    next()
  } catch {
    throw ApiError.unauthorized('Access token không hợp lệ hoặc đã hết hạn')
  }
}

/** Đăng nhập tuỳ chọn: có token thì gắn user, không có thì bỏ qua. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = verifyAccessToken(header.slice(7))
      req.user = { id: payload.sub, role: payload.role }
    } catch {
      /* bỏ qua token lỗi */
    }
  }
  next()
}
