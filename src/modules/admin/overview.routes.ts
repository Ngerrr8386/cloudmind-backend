import { Router } from 'express';
import overviewController from './overview.controller';

const router = Router();

// Tất cả route đã được bảo vệ bởi requireAuth + requireRole('admin') ở tầng cha (mount tại /admin).
router.get('/overview/kpis', overviewController.getKpis);
router.get('/overview/revenue', overviewController.getRevenue);
router.get('/overview/user-growth', overviewController.getUserGrowth);
router.get('/overview/plan-distribution', overviewController.getPlanDistribution);
router.get('/overview/system-health', overviewController.getSystemHealth);
router.get('/overview/recent', overviewController.getRecent);

export default router;
