import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import * as insightsService from './insights.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await insightsService.getInsights(req.user!.id);
  ok(res, data);
});

export const clusters = asyncHandler(async (req: Request, res: Response) => {
  const data = await insightsService.getClusters(req.user!.id);
  ok(res, data);
});

export const connections = asyncHandler(async (req: Request, res: Response) => {
  const data = await insightsService.getConnections(req.user!.id);
  ok(res, data);
});

export const trends = asyncHandler(async (req: Request, res: Response) => {
  const data = await insightsService.getTrends(req.user!.id);
  ok(res, data);
});
