/** Lỗi nghiệp vụ có mã HTTP + mã lỗi máy đọc được. */
export class ApiError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
    Object.setPrototypeOf(this, ApiError.prototype)
  }

  static badRequest(msg = 'Dữ liệu không hợp lệ', details?: unknown) {
    return new ApiError(400, 'VALIDATION', msg, details)
  }
  static unauthorized(msg = 'Chưa xác thực') {
    return new ApiError(401, 'UNAUTHORIZED', msg)
  }
  static forbidden(msg = 'Không có quyền') {
    return new ApiError(403, 'FORBIDDEN', msg)
  }
  static notFound(msg = 'Không tìm thấy') {
    return new ApiError(404, 'NOT_FOUND', msg)
  }
  static conflict(msg = 'Xung đột dữ liệu') {
    return new ApiError(409, 'CONFLICT', msg)
  }
  static unavailable(msg = 'Dịch vụ chưa sẵn sàng') {
    return new ApiError(503, 'SERVICE_UNAVAILABLE', msg)
  }
}
