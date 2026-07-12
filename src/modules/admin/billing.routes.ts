import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import * as billingController from './billing.controller';
import { allowedStatuses } from './billing.service';

const router = Router();

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const listTransactionsSchema = paginationSchema.extend({
  q: z.string().trim().optional(),
  status: z.enum(allowedStatuses).optional(),
});

const idParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID không hợp lệ'),
});

// GET /billing/metrics → chỉ số doanh thu tổng quan
router.get('/billing/metrics', billingController.getMetrics);

// GET /billing/transactions → danh sách giao dịch (lọc, tìm kiếm, phân trang)
router.get(
  '/billing/transactions',
  validate(listTransactionsSchema, 'query'),
  billingController.listTransactions
);

// GET /billing/failed → giao dịch thất bại/hết hạn
router.get('/billing/failed', billingController.listFailed);

// GET /billing/invoices → hoá đơn (giao dịch đã thanh toán), phân trang
router.get(
  '/billing/invoices',
  validate(paginationSchema, 'query'),
  billingController.listInvoices
);

// GET /billing/transactions/:id → chi tiết giao dịch
router.get(
  '/billing/transactions/:id',
  validate(idParamSchema, 'params'),
  billingController.getTransaction
);

// POST /billing/transactions/:id/refund → hoàn tiền giao dịch đã thanh toán
router.post(
  '/billing/transactions/:id/refund',
  validate(idParamSchema, 'params'),
  billingController.refundTransaction
);

export default router;
