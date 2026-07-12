import rateLimit from 'express-rate-limit'

/** Giới hạn chung cho toàn API. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Quá nhiều yêu cầu, thử lại sau.' } },
})

/** Giới hạn chặt cho các route nhạy cảm (đăng nhập, đăng ký...). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Quá nhiều lần thử, vui lòng đợi ít phút.' } },
})

/** Giới hạn cho các route AI (Gemini tốn tài nguyên). */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Bạn đang dùng AI quá nhanh, thử lại sau.' } },
})
