import type { Request, Response, NextFunction } from 'express'
import { WorkspaceMember, type WsRole } from '../models/WorkspaceMember'
import { ApiError } from '../utils/ApiError'

/** Bắt buộc người dùng thuộc một workspace; gắn req.workspaceId + req.wsRole. */
export async function requireWorkspace(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const member = await WorkspaceMember.findOne({ user: req.user!.id })
    if (!member) throw ApiError.forbidden('Bạn chưa thuộc không gian làm việc nào (cần gói Team)')
    req.workspaceId = String(member.workspace)
    req.wsRole = member.wsRole
    next()
  } catch (err) {
    next(err)
  }
}

/** Chỉ cho phép các vai trò workspace chỉ định. */
export function requireWsRole(...roles: WsRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.wsRole) throw ApiError.forbidden('Không xác định được vai trò trong workspace')
    if (!roles.includes(req.wsRole)) throw ApiError.forbidden('Bạn không có quyền thực hiện thao tác này trong workspace')
    next()
  }
}
