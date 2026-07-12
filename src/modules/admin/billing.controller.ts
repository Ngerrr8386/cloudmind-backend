import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import * as billingService from './billing.service';

export const getMetrics = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await billingService.getMetrics());
});

export const listTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const status =
      typeof req.query.status === 'string' ? req.query.status : undefined;

    const { items, meta } = await billingService.listTransactions({
      page,
      limit,
      q,
      status,
    });
    ok(res, items, meta);
  }
);

export const getTransaction = asyncHandler(
  async (req: Request, res: Response) => {
    ok(res, await billingService.getTransaction(req.params.id));
  }
);

export const refundTransaction = asyncHandler(
  async (req: Request, res: Response) => {
    ok(
      res,
      await billingService.refundTransaction(req.user!.id, req.params.id)
    );
  }
);

export const listFailed = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await billingService.listFailed());
});

export const listInvoices = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const { items, meta } = await billingService.listInvoices({ page, limit });
    ok(res, items, meta);
  }
);
