import type { Request, Response, NextFunction } from 'express'
import { ZodError, type ZodSchema } from 'zod'
import { ApiError } from '../utils/ApiError'

type Source = 'body' | 'query' | 'params'

/** Validate + transform một phần của request bằng Zod schema. */
export function validate(schema: ZodSchema, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source])
      // gán lại giá trị đã được transform/ép kiểu
      ;(req as unknown as Record<Source, unknown>)[source] = parsed
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        throw ApiError.badRequest('Dữ liệu không hợp lệ', err.flatten().fieldErrors)
      }
      throw err
    }
  }
}
