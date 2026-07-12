import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import * as aiService from './ai.service';

export const getMetrics = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await aiService.getMetrics());
});

export const getByFeature = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await aiService.getByFeature());
});

export const getDailyTrend = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await aiService.getDailyTrend());
});

export const getTopQueries = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await aiService.getTopQueries());
});

export const getCost = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await aiService.getCost());
});
