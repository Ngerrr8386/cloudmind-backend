import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import * as contentController from './content.controller';

const router = Router();

const listContentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().optional(),
  moderationStatus: z.enum(['clean', 'flagged', 'reviewing', 'removed']).optional(),
});

const idParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID không hợp lệ'),
});

const listReportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(['open', 'resolved', 'dismissed']).optional(),
});

const resolveReportBodySchema = z.object({
  action: z.enum(['resolve', 'dismiss']).optional(),
});

// Nội dung & kiểm duyệt
router.get('/content', validate(listContentQuerySchema, 'query'), contentController.listContent);
router.get('/content/queue', contentController.getModerationQueue);
router.get('/content/:id', validate(idParamSchema, 'params'), contentController.getContentDetail);
router.post('/content/:id/approve', validate(idParamSchema, 'params'), contentController.approveContent);
router.post('/content/:id/remove', validate(idParamSchema, 'params'), contentController.removeContent);

// Báo cáo
router.get('/reports', validate(listReportsQuerySchema, 'query'), contentController.listReports);
router.post(
  '/reports/:id/resolve',
  validate(idParamSchema, 'params'),
  validate(resolveReportBodySchema, 'body'),
  contentController.resolveReport,
);

export default router;
