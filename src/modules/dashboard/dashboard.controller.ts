import * as svc from './dashboard.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { ok } from '../../utils/response'

export const stats = asyncHandler(async (req, res) => {
  ok(res, await svc.getStats(req.user!.id))
})

export const storageBreakdown = asyncHandler(async (req, res) => {
  ok(res, await svc.getStorageBreakdown(req.user!.id))
})

export const activityChart = asyncHandler(async (req, res) => {
  ok(res, await svc.getActivityChart(req.user!.id))
})
