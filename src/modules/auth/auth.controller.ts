import type { Request, Response } from 'express'
import * as authService from './auth.service'
import type { AuthResult, AuthContext } from './auth.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { ok, created } from '../../utils/response'
import { ApiError } from '../../utils/ApiError'
import { env, isProd } from '../../config/env'

const REFRESH_COOKIE = 'refreshToken'

function ctxFrom(req: Request): AuthContext {
  return { userAgent: req.get('user-agent') ?? undefined, ip: req.ip }
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  })
}

function sendAuth(res: Response, result: AuthResult, status = 200): void {
  setRefreshCookie(res, result.refreshToken)
  const body = { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken }
  status === 201 ? created(res, body) : ok(res, body)
}

function readRefreshToken(req: Request): string | undefined {
  return (req.cookies?.[REFRESH_COOKIE] as string | undefined) ?? (req.body?.refreshToken as string | undefined)
}

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body)
  created(res, result)
})

export const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.body.email, req.body.code, ctxFrom(req))
  sendAuth(res, result)
})

export const resendVerification = asyncHandler(async (req, res) => {
  ok(res, await authService.resendVerification(req.body.email))
})

export const forgotPassword = asyncHandler(async (req, res) => {
  ok(res, await authService.forgotPassword(req.body.email))
})

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.email, req.body.code, req.body.newPassword)
  ok(res, { message: 'Đặt lại mật khẩu thành công' })
})

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, ctxFrom(req))
  sendAuth(res, result)
})  

export const google = asyncHandler(async (req, res) => {
  const result = await authService.loginWithGoogle(req.body.idToken, ctxFrom(req))
  sendAuth(res, result)
})

export const refresh = asyncHandler(async (req, res) => {
  const token = readRefreshToken(req)
  if (!token) throw ApiError.unauthorized('Thiếu refresh token')
  const result = await authService.refresh(token, ctxFrom(req))
  sendAuth(res, result)
})

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(readRefreshToken(req))
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' })
  ok(res, { message: 'Đã đăng xuất' })
})

export const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user!.id)
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' })
  ok(res, { message: 'Đã đăng xuất khỏi mọi thiết bị' })
})

export const me = asyncHandler(async (req, res) => {
  ok(res, await authService.getMe(req.user!.id))
})

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user!.id, req.body.oldPassword, req.body.newPassword)
  ok(res, { message: 'Đổi mật khẩu thành công' })
})
