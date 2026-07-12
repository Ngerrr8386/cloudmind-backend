import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import * as contentService from './content.service';

export const listContent = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, q, moderationStatus } = req.query as {
    page?: string;
    limit?: string;
    q?: string;
    moderationStatus?: 'clean' | 'flagged' | 'reviewing' | 'removed';
  };

  const result = await contentService.listContent({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    q,
    moderationStatus,
  });

  ok(res, result.items, { page: result.page, limit: result.limit, total: result.total });
});

export const getModerationQueue = asyncHandler(async (_req: Request, res: Response) => {
  const items = await contentService.getModerationQueue();
  ok(res, items);
});

export const getContentDetail = asyncHandler(async (req: Request, res: Response) => {
  const detail = await contentService.getContentDetail(req.params.id);
  ok(res, detail);
});

export const approveContent = asyncHandler(async (req: Request, res: Response) => {
  const file = await contentService.approveContent(req.user!.id, req.params.id);
  ok(res, file);
});

export const removeContent = asyncHandler(async (req: Request, res: Response) => {
  const file = await contentService.removeContent(req.user!.id, req.params.id);
  ok(res, file);
});

export const listReports = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, status } = req.query as {
    page?: string;
    limit?: string;
    status?: 'open' | 'resolved' | 'dismissed';
  };

  const result = await contentService.listReports({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    status,
  });

  ok(res, result.items, { page: result.page, limit: result.limit, total: result.total });
});

export const resolveReport = asyncHandler(async (req: Request, res: Response) => {
  const { action } = req.body as { action?: 'resolve' | 'dismiss' };
  const report = await contentService.resolveReport(req.user!.id, req.params.id, action ?? 'resolve');
  ok(res, report);
});
