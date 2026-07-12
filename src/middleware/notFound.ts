import type { Request, Response } from 'express'

export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Không tìm thấy route: ${req.method} ${req.originalUrl}` },
  })
}
