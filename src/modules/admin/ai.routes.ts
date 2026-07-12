import { Router } from 'express';
import * as aiController from './ai.controller';

const router = Router();

// Tat ca route deu duoc mount tai "/admin" va da xac thuc admin o tang cha.
router.get('/ai/metrics', aiController.getMetrics);
router.get('/ai/by-feature', aiController.getByFeature);
router.get('/ai/daily-trend', aiController.getDailyTrend);
router.get('/ai/top-queries', aiController.getTopQueries);
router.get('/ai/cost', aiController.getCost);

export default router;
