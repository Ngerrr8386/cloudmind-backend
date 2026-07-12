import type { Response } from 'express'

export interface Meta {
  page?: number
  limit?: number
  total?: number
  [key: string]: unknown
}

/** Trả response thành công theo envelope chuẩn. */
export function ok<T>(res: Response, data: T, meta?: Meta, status = 200): Response {
  return res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) })
}

/** Trả response tạo mới (201). */
export function created<T>(res: Response, data: T): Response {
  return ok(res, data, undefined, 201)
}
