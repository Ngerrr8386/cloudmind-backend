import type { Request, Response, NextFunction } from 'express'
import type { Role } from '../utils/jwt'
import { ApiError } from '../utils/ApiError'

/** Chỉ cho phép các role chỉ định (vd requireRole('admin')). */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw ApiError.unauthorized()
    if (!roles.includes(req.user.role)) throw ApiError.forbidden('Bạn không có quyền truy cập tài nguyên này')
    next()
  }
}
