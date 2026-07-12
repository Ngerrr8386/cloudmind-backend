import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import * as auditController from './audit.controller';

const router = Router();

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().min(1).optional(),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
});

const idParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID nhật ký không hợp lệ'),
});

router.get('/audit', validate(listQuerySchema, 'query'), auditController.list);

router.get('/audit/export', validate(listQuerySchema, 'query'), auditController.exportAll);

router.get('/audit/:id', validate(idParamSchema, 'params'), auditController.detail);

export default router;
