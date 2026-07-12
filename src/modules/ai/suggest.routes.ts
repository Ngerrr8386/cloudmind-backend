import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { aiLimiter } from '../../middleware/rateLimit';
import { suggestFolderSchema } from './suggest.validators';
import * as suggestController from './suggest.controller';

const router = Router();

router.use(requireAuth);

router.post(
  '/suggest-folder',
  aiLimiter,
  validate(suggestFolderSchema, 'body'),
  suggestController.suggestFolder,
);

export default router;
