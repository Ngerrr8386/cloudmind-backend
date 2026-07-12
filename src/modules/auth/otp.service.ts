import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { OtpCode, type OtpPurpose } from '../../models/OtpCode'
import { env, isProd } from '../../config/env'
import { ApiError } from '../../utils/ApiError'
import { sendMail, isMailerReady } from '../mail/mail.service'
import { otpEmail } from '../mail/templates'
import { logger } from '../../utils/logger'

const MAX_ATTEMPTS = 5

function generateCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
}

/**
 * Tạo & gửi OTP cho email. Trả về mã thật CHỈ ở môi trường dev khi chưa cấu hình SMTP
 * (để tiện thử nghiệm); production/khi có SMTP luôn trả undefined.
 */
export async function issueOtp(email: string, purpose: OtpPurpose, name?: string): Promise<string | undefined> {
  const code = generateCode()
  const codeHash = await bcrypt.hash(code, 10)
  const expiresAt = new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000)

  // Mỗi email+purpose chỉ giữ 1 OTP hiện hành
  await OtpCode.findOneAndUpdate(
    { email: email.toLowerCase(), purpose },
    { codeHash, expiresAt, attempts: 0 },
    { upsert: true, new: true },
  )

  const mail = otpEmail({ code, purpose, minutes: env.OTP_TTL_MINUTES, name })
  await sendMail(email, mail)

  if (!isMailerReady() && !isProd) {
    logger.info(`🔑 [DEV OTP] ${email} (${purpose}) = ${code}`)
    return code
  }
  return undefined
}

/** Xác minh OTP. Đúng → xoá mã và trả true. Sai → tăng attempts. */
export async function verifyOtp(email: string, purpose: OtpPurpose, code: string): Promise<void> {
  const otp = await OtpCode.findOne({ email: email.toLowerCase(), purpose })
  if (!otp || otp.expiresAt < new Date()) {
    throw ApiError.badRequest('Mã OTP không tồn tại hoặc đã hết hạn')
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    await otp.deleteOne()
    throw ApiError.badRequest('Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới')
  }
  const okCode = await bcrypt.compare(code, otp.codeHash)
  if (!okCode) {
    otp.attempts += 1
    await otp.save()
    throw ApiError.badRequest(`Mã OTP không đúng (còn ${MAX_ATTEMPTS - otp.attempts} lần thử)`)
  }
  await otp.deleteOne()
}
