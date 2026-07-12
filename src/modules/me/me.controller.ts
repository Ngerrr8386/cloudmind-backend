import * as svc from './me.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { ok } from '../../utils/response'
import { ApiError } from '../../utils/ApiError'

export const getProfile = asyncHandler(async (req, res) => {
  ok(res, await svc.getProfile(req.user!.id))
})

export const updateProfile = asyncHandler(async (req, res) => {
  ok(res, await svc.updateProfile(req.user!.id, req.body))
})

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Thiếu ảnh (field "avatar")')
  ok(res, await svc.setAvatar(req.user!.id, req.file))
})

export const getSettings = asyncHandler(async (req, res) => {
  ok(res, await svc.getSettings(req.user!.id))
})

export const updateAiSettings = asyncHandler(async (req, res) => {
  ok(res, await svc.updateAiSettings(req.user!.id, req.body))
})

export const updateAppearance = asyncHandler(async (req, res) => {
  ok(res, await svc.updateAppearance(req.user!.id, req.body))
})

export const listSessions = asyncHandler(async (req, res) => {
  ok(res, await svc.listSessions(req.user!.id))
})

export const revokeSession = asyncHandler(async (req, res) => {
  await svc.revokeSession(req.user!.id, req.params.id)
  ok(res, { message: 'Đã thu hồi phiên' })
})

export const toggle2fa = asyncHandler(async (req, res) => {
  ok(res, await svc.setTwoFactor(req.user!.id, req.body.enabled))
})

export const deleteAccount = asyncHandler(async (req, res) => {
  await svc.deleteAccount(req.user!.id)
  res.clearCookie('refreshToken', { path: '/api/v1/auth' })
  ok(res, { message: 'Đã xoá tài khoản' })
})
