import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import * as auditService from './audit.service';
import type { AuditSeverity, ListAuditParams } from './audit.service';

function parseSeverity(value: unknown): AuditSeverity | undefined {
  if (value === 'info' || value === 'warning' || value === 'critical') {
    return value;
  }
  return undefined;
}

function parseString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function parseListParams(req: Request): ListAuditParams {
  return {
    page: parseNumber(req.query.page),
    limit: parseNumber(req.query.limit),
    q: parseString(req.query.q),
    severity: parseSeverity(req.query.severity),
  };
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await auditService.listAuditLogs(parseListParams(req));
  ok(
    res,
    result.items,
    {
      page: result.page,
      limit: result.limit,
      total: result.total,
      counts: result.counts,
    },
  );
});

export const exportAll = asyncHandler(async (req: Request, res: Response) => {
  const result = await auditService.exportAuditLogs(parseListParams(req));
  ok(res, result);
});

export const detail = asyncHandler(async (req: Request, res: Response) => {
  const result = await auditService.getAuditLog(req.params.id);
  ok(res, result);
});
