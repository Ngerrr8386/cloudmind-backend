import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { aiLimiter } from '../../middleware/rateLimit';
import { searchSchema, reindexSchema } from './search.validators';
import * as searchController from './search.controller';

const router = Router();

router.use(requireAuth);

router.post(
  '/search',
  aiLimiter,
  validate(searchSchema, 'body'),
  searchController.search,
);

router.get('/search/suggestions', searchController.suggestions);

router.post(
  '/reindex',
  aiLimiter,
  validate(reindexSchema, 'body'),
  searchController.reindex,
);

export default router;
