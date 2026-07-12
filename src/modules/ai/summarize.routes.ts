import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { aiLimiter } from '../../middleware/rateLimit';
import {
  summarizeBodySchema,
  summarizeParamsSchema,
  summarizeQuerySchema,
} from './summarize.validators';
import {
  createSummary,
  fetchSummary,
  regenerateSummary,
} from './summarize.controller';

const router = Router();

router.use(requireAuth);

router.post(
  '/:fileId',
  validate(summarizeParamsSchema, 'params'),
  validate(summarizeBodySchema, 'body'),
  aiLimiter,
  createSummary,
);

router.get(
  '/:fileId',
  validate(summarizeParamsSchema, 'params'),
  validate(summarizeQuerySchema, 'query'),
  fetchSummary,
);

router.post(
  '/:fileId/regenerate',
  validate(summarizeParamsSchema, 'params'),
  validate(summarizeBodySchema, 'body'),
  aiLimiter,
  regenerateSummary,
);

export default router;
