import { Router } from 'express';
import { validate } from '../../middleware/validate';
import * as ctrl from './users.controller';
import {
  listUsersQuerySchema,
  idParamSchema,
  createUserSchema,
  updateUserSchema,
  updatePlanSchema,
  paginationQuerySchema,
} from './users.validators';

const router = Router();

router.get('/users', validate(listUsersQuerySchema, 'query'), ctrl.list);

router.post('/users', validate(createUserSchema, 'body'), ctrl.create);

router.get('/users/:id', validate(idParamSchema, 'params'), ctrl.detail);

router.patch(
  '/users/:id',
  validate(idParamSchema, 'params'),
  validate(updateUserSchema, 'body'),
  ctrl.update,
);

router.patch(
  '/users/:id/plan',
  validate(idParamSchema, 'params'),
  validate(updatePlanSchema, 'body'),
  ctrl.updatePlan,
);

router.post('/users/:id/suspend', validate(idParamSchema, 'params'), ctrl.suspend);

router.post('/users/:id/unsuspend', validate(idParamSchema, 'params'), ctrl.unsuspend);

router.post('/users/:id/reset-password', validate(idParamSchema, 'params'), ctrl.resetPassword);

router.post('/users/:id/impersonate', validate(idParamSchema, 'params'), ctrl.impersonate);

router.get(
  '/users/:id/files',
  validate(idParamSchema, 'params'),
  validate(paginationQuerySchema, 'query'),
  ctrl.files,
);

router.get('/users/:id/transactions', validate(idParamSchema, 'params'), ctrl.transactions);

router.delete('/users/:id', validate(idParamSchema, 'params'), ctrl.remove);

export default router;
