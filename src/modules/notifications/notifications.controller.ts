import * as svc from './notifications.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { ok } from '../../utils/response'

export const activity = asyncHandler(async (req, res) => {
  ok(res, await svc.getActivityFeed(req.user!.id))
})

export const list = asyncHandler(async (req, res) => {
  const unreadOnly = req.query.unread === 'true'
  ok(res, await svc.listNotifications(req.user!.id, { unreadOnly }))
})

export const read = asyncHandler(async (req, res) => {
  await svc.markRead(req.user!.id, req.params.id)
  ok(res, { message: 'Đã đánh dấu đã đọc' })
})

export const readAll = asyncHandler(async (req, res) => {
  ok(res, await svc.markAllRead(req.user!.id))
})
