import bcrypt from 'bcryptjs'
import { User, type UserDoc } from '../../models/User'
import { Session } from '../../models/Session'
import { ApiError } from '../../utils/ApiError'
import { getFirebaseAuth } from '../../config/firebase'
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  refreshExpiry,
} from '../../utils/jwt'
import { issueOtp, verifyOtp } from './otp.service'

export interface AuthContext {
  userAgent?: string
  ip?: string
}

export interface PendingVerification {
  requiresVerification: true
  email: string
  message: string
  devOtp?: string // chỉ có ở dev khi chưa cấu hình SMTP
}

export interface AuthResult {
  user: ReturnType<UserDoc['toJSON']>
  accessToken: string
  refreshToken: string
}

/** Cấp access + refresh token và tạo session. */
async function issueTokens(user: UserDoc, ctx: AuthContext): Promise<AuthResult> {
  const accessToken = signAccessToken({ sub: user.id, role: user.role })
  const { token: refreshToken, hash } = generateRefreshToken()
  await Session.create({
    user: user._id,
    refreshTokenHash: hash,
    userAgent: ctx.userAgent,
    ip: ctx.ip,
    expiresAt: refreshExpiry(),
  })
  return { user: user.toJSON(), accessToken, refreshToken }
}

function assertActive(user: UserDoc): void {
  if (user.status === 'suspended') throw ApiError.forbidden('Tài khoản của bạn đã bị khoá')
}

/** Đăng ký: tạo tài khoản CHƯA xác thực + gửi OTP qua email. Chưa cấp token. */
export async function register(
  input: { email: string; password: string; name: string },
): Promise<PendingVerification> {
  const existing = await User.findOne({ email: input.email })
  if (existing) {
    if (existing.emailVerified) throw ApiError.conflict('Email này đã được đăng ký')
    // Tài khoản tạo dở chưa xác thực → gửi lại OTP, cập nhật thông tin
    existing.name = input.name
    existing.passwordHash = await bcrypt.hash(input.password, 10)
    await existing.save()
    const devOtp = await issueOtp(existing.email, 'verify', existing.name)
    return { requiresVerification: true, email: existing.email, message: 'Đã gửi lại mã xác thực tới email của bạn', devOtp }
  }
  const passwordHash = await bcrypt.hash(input.password, 10)
  const user = await User.create({
    email: input.email,
    name: input.name,
    passwordHash,
    provider: 'local',
    emailVerified: false,
    status: 'pending',
  })
  const devOtp = await issueOtp(user.email, 'verify', user.name)
  return { requiresVerification: true, email: user.email, message: 'Đã gửi mã xác thực 6 số tới email của bạn', devOtp }
}

/** Xác thực OTP đăng ký → kích hoạt tài khoản + đăng nhập (cấp token). */
export async function verifyEmail(email: string, code: string, ctx: AuthContext): Promise<AuthResult> {
  await verifyOtp(email, 'verify', code)
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) throw ApiError.notFound('Không tìm thấy tài khoản')
  user.emailVerified = true
  if (user.status === 'pending') user.status = 'active'
  user.lastActiveAt = new Date()
  await user.save()
  return issueTokens(user, ctx)
}

/** Gửi lại OTP xác thực email. */
export async function resendVerification(email: string): Promise<{ message: string; devOtp?: string }> {
  const user = await User.findOne({ email: email.toLowerCase() })
  if (user && !user.emailVerified) {
    const devOtp = await issueOtp(user.email, 'verify', user.name)
    return { message: 'Đã gửi lại mã xác thực', devOtp }
  }
  // Không tiết lộ trạng thái tài khoản
  return { message: 'Nếu email hợp lệ và chưa xác thực, mã mới đã được gửi' }
}

export async function login(
  input: { email: string; password: string },
  ctx: AuthContext,
): Promise<AuthResult> {
  const user = await User.findOne({ email: input.email }).select('+passwordHash')
  if (!user || !(await user.comparePassword(input.password))) {
    throw ApiError.unauthorized('Email hoặc mật khẩu không đúng')
  }
  if (!user.emailVerified) {
    throw new ApiError(403, 'EMAIL_NOT_VERIFIED', 'Email chưa được xác thực. Vui lòng kiểm tra hộp thư để nhập mã OTP')
  }
  assertActive(user)
  user.lastActiveAt = new Date()
  await user.save()
  return issueTokens(user, ctx)
}

/** Quên mật khẩu → gửi OTP đặt lại (luôn trả về thành công để tránh dò email). */
export async function forgotPassword(email: string): Promise<{ message: string; devOtp?: string }> {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash')
  let devOtp: string | undefined
  if (user && user.passwordHash) {
    devOtp = await issueOtp(user.email, 'reset', user.name)
  }
  return { message: 'Nếu email tồn tại, mã đặt lại mật khẩu đã được gửi', devOtp }
}

/** Đặt lại mật khẩu bằng OTP. */
export async function resetPassword(email: string, code: string, newPassword: string): Promise<void> {
  await verifyOtp(email, 'reset', code)
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) throw ApiError.notFound('Không tìm thấy tài khoản')
  user.passwordHash = await bcrypt.hash(newPassword, 10)
  await user.save()
  await Session.deleteMany({ user: user._id }) // đăng xuất mọi phiên
}

/** Đăng nhập Google qua Firebase: verify idToken → upsert user → cấp JWT app. */
export async function loginWithGoogle(idToken: string, ctx: AuthContext): Promise<AuthResult> {
  // getFirebaseAuth() ném 503 nếu chưa cấu hình — để lỗi này propagate, KHÔNG nuốt trong catch
  const firebaseAuth = getFirebaseAuth()
  let decoded
  try {
    decoded = await firebaseAuth.verifyIdToken(idToken)
  } catch {
    throw ApiError.unauthorized('Firebase ID token không hợp lệ')
  }

  const email = decoded.email
  if (!email) throw ApiError.badRequest('Token Google không có email')

  let user = await User.findOne({ $or: [{ firebaseUid: decoded.uid }, { email }] })

  if (!user) {
    user = await User.create({
      email,
      name: decoded.name ?? email.split('@')[0],
      firebaseUid: decoded.uid,
      avatarUrl: decoded.picture,
      provider: 'google',
      emailVerified: true, // tài khoản Google đã được xác thực
    })
  } else {
    // Liên kết tài khoản sẵn có với Firebase nếu chưa có
    if (!user.firebaseUid) user.firebaseUid = decoded.uid
    if (decoded.picture && !user.avatarUrl) user.avatarUrl = decoded.picture
    if (decoded.email_verified) user.emailVerified = true
  }

  assertActive(user)
  user.lastActiveAt = new Date()
  await user.save()
  return issueTokens(user, ctx)
}

/** Xoay vòng refresh token: thu hồi cái cũ, cấp cặp mới. */
export async function refresh(refreshToken: string, ctx: AuthContext): Promise<AuthResult> {
  const session = await Session.findOne({ refreshTokenHash: hashToken(refreshToken) })
  if (!session || session.expiresAt < new Date()) {
    throw ApiError.unauthorized('Refresh token không hợp lệ hoặc đã hết hạn')
  }
  const user = await User.findById(session.user)
  if (!user) throw ApiError.unauthorized()
  await session.deleteOne()
  return issueTokens(user, ctx)
}

export async function logout(refreshToken?: string): Promise<void> {
  if (!refreshToken) return
  await Session.deleteOne({ refreshTokenHash: hashToken(refreshToken) })
}

export async function logoutAll(userId: string): Promise<void> {
  await Session.deleteMany({ user: userId })
}

export async function getMe(userId: string) {
  const user = await User.findById(userId)
  if (!user) throw ApiError.notFound('Không tìm thấy người dùng')
  return user.toJSON()
}

export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await User.findById(userId).select('+passwordHash')
  if (!user) throw ApiError.notFound('Không tìm thấy người dùng')
  if (!user.passwordHash) {
    throw ApiError.badRequest('Tài khoản này đăng nhập bằng Google, chưa có mật khẩu')
  }
  if (!(await user.comparePassword(oldPassword))) {
    throw ApiError.badRequest('Mật khẩu hiện tại không đúng')
  }
  user.passwordHash = await bcrypt.hash(newPassword, 10)
  await user.save()
  // đăng xuất mọi phiên khác để an toàn
  await Session.deleteMany({ user: userId })
}
