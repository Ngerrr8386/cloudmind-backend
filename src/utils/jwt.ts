import crypto from 'crypto'
import jwt, { type SignOptions } from 'jsonwebtoken'
import { env } from '../config/env'

export type Role = 'customer' | 'admin'

export interface AccessPayload {
  sub: string // user id
  role: Role
}

/** Tạo access token (JWT ngắn hạn). */
export function signAccessToken(payload: AccessPayload): string {
  const opts: SignOptions = { expiresIn: env.ACCESS_TOKEN_TTL as SignOptions['expiresIn'] }
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, opts)
}

/** Xác minh access token. */
export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload
}

/** Sinh refresh token dạng opaque (lưu hash trong DB để thu hồi được). */
export function generateRefreshToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(48).toString('hex')
  const hash = hashToken(token)
  return { token, hash }
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function refreshExpiry(): Date {
  return new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
}
