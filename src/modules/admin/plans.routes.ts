import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { plansController } from './plans.controller';
import {
  createPlanSchema,
  updatePlanSchema,
  planIdParamSchema,
  subscribersQuerySchema,
} from './plans.validators';

const router = Router();

// Router này được mount tại '/admin'; requireAuth + requireRole('admin') đã áp dụng ở tầng cha.

router.get('/plans', plansController.listPlans);

router.post(
  '/plans',
  validate(createPlanSchema, 'body'),
  plansController.createPlan
);

router.get(
  '/plans/:id',
  validate(planIdParamSchema, 'params'),
  plansController.getPlan
);

router.patch(
  '/plans/:id',
  validate(planIdParamSchema, 'params'),
  validate(updatePlanSchema, 'body'),
  plansController.updatePlan
);

router.post(
  '/plans/:id/toggle',
  validate(planIdParamSchema, 'params'),
  plansController.togglePlan
);

router.get(
  '/plans/:id/subscribers',
  validate(planIdParamSchema, 'params'),
  validate(subscribersQuerySchema, 'query'),
  plansController.listSubscribers
);

router.delete(
  '/plans/:id',
  validate(planIdParamSchema, 'params'),
  plansController.deletePlan
);

export default router;
