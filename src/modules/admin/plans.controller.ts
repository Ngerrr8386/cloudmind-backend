import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok, created } from '../../utils/response';
import { plansService } from './plans.service';
import type {
  CreatePlanInput,
  UpdatePlanInput,
  SubscribersQuery,
} from './plans.validators';

/** GET /plans → danh sách gói kèm subscribers & mrr. */
export const listPlans = asyncHandler(async (_req: Request, res: Response) => {
  const data = await plansService.listPlans();
  ok(res, data);
});

/** POST /plans → tạo gói cước. */
export const createPlan = asyncHandler(async (req: Request, res: Response) => {
  const data = await plansService.createPlan(
    req.user!.id,
    req.body as CreatePlanInput
  );
  created(res, data);
});

/** GET /plans/:id → chi tiết. */
export const getPlan = asyncHandler(async (req: Request, res: Response) => {
  const data = await plansService.getPlan(req.params.id);
  ok(res, data);
});

/** PATCH /plans/:id → cập nhật. */
export const updatePlan = asyncHandler(async (req: Request, res: Response) => {
  const data = await plansService.updatePlan(
    req.user!.id,
    req.params.id,
    req.body as UpdatePlanInput
  );
  ok(res, data);
});

/** POST /plans/:id/toggle → đảo active. */
export const togglePlan = asyncHandler(async (req: Request, res: Response) => {
  const data = await plansService.togglePlan(req.user!.id, req.params.id);
  ok(res, data);
});

/** GET /plans/:id/subscribers → danh sách người đăng ký (phân trang). */
export const listSubscribers = asyncHandler(
  async (req: Request, res: Response) => {
    const query = req.query as unknown as SubscribersQuery;
    const { items, page, limit, total } = await plansService.listSubscribers(
      req.params.id,
      query
    );
    ok(res, items, { page, limit, total });
  }
);

/** DELETE /plans/:id → ẩn gói (active=false), không xoá cứng. */
export const deletePlan = asyncHandler(async (req: Request, res: Response) => {
  const data = await plansService.deletePlan(req.user!.id, req.params.id);
  ok(res, data);
});

export const plansController = {
  listPlans,
  createPlan,
  getPlan,
  updatePlan,
  togglePlan,
  listSubscribers,
  deletePlan,
};

export default plansController;
