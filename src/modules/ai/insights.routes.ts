import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as insightsController from './insights.controller';

const router = Router();

router.use(requireAuth);

// Các endpoint chủ yếu đọc từ DB (không gọi Gemini) nên không cần aiLimiter.
router.get('/', insightsController.list);
router.get('/clusters', insightsController.clusters);
router.get('/connections', insightsController.connections);
router.get('/trends', insightsController.trends);

export default router;
