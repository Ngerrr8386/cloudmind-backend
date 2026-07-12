import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import * as ctrl from './workspaces.controller';

const router = Router();

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().optional(),
  status: z.enum(['active', 'suspended']).optional(),
});

const idParamsSchema = z.object({
  id: z.string().min(1, 'Thiếu ID workspace'),
});

const suspendBodySchema = z.object({
  suspend: z.boolean().optional(),
});

const seatsBodySchema = z.object({
  seats: z
    .number({ required_error: 'Thiếu số ghế' })
    .int('Số ghế phải là số nguyên')
    .min(1, 'Số ghế tối thiểu là 1')
    .max(10000, 'Số ghế vượt quá giới hạn'),
});

router.get('/workspaces', validate(listQuerySchema, 'query'), ctrl.list);

router.get(
  '/workspaces/:id',
  validate(idParamsSchema, 'params'),
  ctrl.detail,
);

router.get(
  '/workspaces/:id/members',
  validate(idParamsSchema, 'params'),
  ctrl.members,
);

router.post(
  '/workspaces/:id/suspend',
  validate(idParamsSchema, 'params'),
  validate(suspendBodySchema, 'body'),
  ctrl.suspend,
);

router.patch(
  '/workspaces/:id/seats',
  validate(idParamsSchema, 'params'),
  validate(seatsBodySchema, 'body'),
  ctrl.updateSeats,
);

export default router;
