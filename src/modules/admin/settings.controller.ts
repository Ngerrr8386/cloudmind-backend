import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import * as svc from './settings.service';

// ===== Settings =====

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await svc.getSettings());
});

export const updateGeneral = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await svc.updateGeneral(req.user!.id, req.body));
});

export const updateAi = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await svc.updateAi(req.user!.id, req.body));
});

export const updateLimits = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await svc.updateLimits(req.user!.id, req.body));
});

export const updateSecurity = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await svc.updateSecurity(req.user!.id, req.body));
});

// ===== Team =====

export const listTeam = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await svc.listTeam());
});

export const inviteTeam = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await svc.inviteTeam(req.user!.id, req.body));
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await svc.updateRole(req.user!.id, req.params.id, req.body.role));
});

export const removeTeamMember = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await svc.removeTeamMember(req.user!.id, req.params.id));
});

// ===== Integrations =====

export const listIntegrations = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await svc.listIntegrations());
});

export const updateIntegration = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await svc.updateIntegration(req.user!.id, req.params.key, req.body));
});
