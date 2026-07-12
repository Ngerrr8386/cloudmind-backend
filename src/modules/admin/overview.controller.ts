import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import overviewService from './overview.service';

export const getKpis = asyncHandler(async (_req, res) => {
  ok(res, await overviewService.getKpis());
});

export const getRevenue = asyncHandler(async (_req, res) => {
  ok(res, await overviewService.getRevenue());
});

export const getUserGrowth = asyncHandler(async (_req, res) => {
  ok(res, await overviewService.getUserGrowth());
});

export const getPlanDistribution = asyncHandler(async (_req, res) => {
  ok(res, await overviewService.getPlanDistribution());
});

export const getSystemHealth = asyncHandler(async (_req, res) => {
  ok(res, await overviewService.getSystemHealth());
});

export const getRecent = asyncHandler(async (_req, res) => {
  ok(res, await overviewService.getRecent());
});

export default {
  getKpis,
  getRevenue,
  getUserGrowth,
  getPlanDistribution,
  getSystemHealth,
  getRecent,
};
