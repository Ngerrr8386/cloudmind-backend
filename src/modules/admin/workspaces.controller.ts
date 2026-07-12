import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import * as svc from './workspaces.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, q, status } = req.query as {
    page?: string;
    limit?: string;
    q?: string;
    status?: 'active' | 'suspended';
  };

  const result = await svc.listWorkspaces({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    q,
    status,
  });

  ok(res, result.items, {
    page: result.page,
    limit: result.limit,
    total: result.total,
  });
});

export const detail = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await svc.getWorkspace(req.params.id));
});

export const members = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await svc.listWorkspaceMembers(req.params.id));
});

export const suspend = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as { suspend?: boolean };
  const flag = body.suspend ?? true;
  ok(res, await svc.suspendWorkspace(req.user!.id, req.params.id, flag));
});

export const updateSeats = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as { seats: number };
  ok(res, await svc.updateWorkspaceSeats(req.user!.id, req.params.id, body.seats));
});
