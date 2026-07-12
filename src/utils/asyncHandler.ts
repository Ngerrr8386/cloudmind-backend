import type { Request, Response, NextFunction, RequestHandler } from 'express'

/** Bọc handler async để tự chuyển lỗi sang error middleware. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
