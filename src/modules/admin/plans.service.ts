import { Types } from 'mongoose';
import { Plan } from '../../models/Plan';
import { Subscription } from '../../models/Subscription';
import { User } from '../../models/User';
import { ApiError } from '../../utils/ApiError';
import { logAudit } from './admin.shared';
import type {
  CreatePlanInput,
  UpdatePlanInput,
  SubscribersQuery,
} from './plans.validators';

/** Kết quả 1 gói kèm số liệu thương mại. */
interface PlanWithMetrics {
  subscribers: number;
  mrr: number;
  [key: string]: unknown;
}

/**
 * Lấy tất cả gói cước (sort theo sortOrder) kèm:
 * - subscribers: số Subscription active theo planKey
 * - mrr: subscribers * priceMonthly
 */
async function listPlans(): Promise<PlanWithMetrics[]> {
  const plans = await Plan.find().sort({ sortOrder: 1 }).lean();

  // Đếm số subscription active theo từng planKey trong 1 lần aggregate.
  const counts = await Subscription.aggregate<{ _id: string; count: number }>([
    { $match: { status: 'active' } },
    { $group: { _id: '$planKey', count: { $sum: 1 } } },
  ]);

  const countMap = new Map<string, number>();
  for (const c of counts) {
    countMap.set(c._id, c.count);
  }

  return plans.map((plan) => {
    const { _id, ...rest } = plan as Record<string, unknown> & {
      _id: Types.ObjectId;
      key: string;
      priceMonthly: number;
    };
    const subscribers = countMap.get(plan.key) ?? 0;
    const mrr = subscribers * (plan.priceMonthly ?? 0);
    return {
      id: _id.toString(),
      ...rest,
      subscribers,
      mrr,
    };
  });
}

/** Tạo gói cước mới. */
async function createPlan(
  adminId: string,
  input: CreatePlanInput
): Promise<Record<string, unknown>> {
  const existing = await Plan.findOne({ key: input.key });
  if (existing) {
    throw ApiError.badRequest(`Gói cước với key '${input.key}' đã tồn tại`);
  }

  const plan = await Plan.create(input);

  await logAudit(adminId, {
    action: 'plan.create',
    message: `Đã tạo gói cước '${plan.name}' (${plan.key})`,
    severity: 'info',
    target: plan._id.toString(),
    meta: { key: plan.key, priceMonthly: plan.priceMonthly },
  });

  return plan.toJSON();
}

/** Chi tiết 1 gói cước. */
async function getPlan(id: string): Promise<Record<string, unknown>> {
  const plan = await Plan.findById(id);
  if (!plan) {
    throw ApiError.notFound('Không tìm thấy gói cước');
  }
  return plan.toJSON();
}

/** Cập nhật giá/tính năng/dung lượng của gói cước. */
async function updatePlan(
  adminId: string,
  id: string,
  input: UpdatePlanInput
): Promise<Record<string, unknown>> {
  const plan = await Plan.findById(id);
  if (!plan) {
    throw ApiError.notFound('Không tìm thấy gói cước');
  }

  Object.assign(plan, input);
  await plan.save();

  await logAudit(adminId, {
    action: 'plan.update',
    message: `Đã cập nhật gói cước '${plan.name}' (${plan.key})`,
    severity: 'info',
    target: plan._id.toString(),
    meta: { fields: Object.keys(input) },
  });

  return plan.toJSON();
}

/** Đảo trạng thái active của gói cước. */
async function togglePlan(
  adminId: string,
  id: string
): Promise<Record<string, unknown>> {
  const plan = await Plan.findById(id);
  if (!plan) {
    throw ApiError.notFound('Không tìm thấy gói cước');
  }

  // Không cho ẩn (tắt) gói 'free'.
  if (plan.key === 'free' && plan.active) {
    throw ApiError.badRequest('Không thể ẩn gói miễn phí (free)');
  }

  plan.active = !plan.active;
  await plan.save();

  await logAudit(adminId, {
    action: 'plan.toggle',
    message: `Đã ${plan.active ? 'bật' : 'tắt'} gói cước '${plan.name}' (${plan.key})`,
    severity: 'info',
    target: plan._id.toString(),
    meta: { active: plan.active },
  });

  return plan.toJSON();
}

/** Danh sách người đăng ký của 1 gói (phân trang), populate owner name/email. */
async function listSubscribers(
  id: string,
  query: SubscribersQuery
): Promise<{
  items: Record<string, unknown>[];
  page: number;
  limit: number;
  total: number;
}> {
  const plan = await Plan.findById(id);
  if (!plan) {
    throw ApiError.notFound('Không tìm thấy gói cước');
  }

  const { page, limit, status } = query;
  const filter: Record<string, unknown> = { planKey: plan.key };
  if (status) {
    filter.status = status;
  }

  const [items, total] = await Promise.all([
    Subscription.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: 'owner', model: User, select: 'name email' })
      .lean(),
    Subscription.countDocuments(filter),
  ]);

  const mapped = items.map((sub) => {
    const { _id, owner, ...rest } = sub as Record<string, unknown> & {
      _id: Types.ObjectId;
      owner: unknown;
    };

    let ownerOut: unknown = owner;
    if (owner && typeof owner === 'object' && '_id' in (owner as object)) {
      const o = owner as { _id: Types.ObjectId; name?: string; email?: string };
      ownerOut = {
        id: o._id.toString(),
        name: o.name,
        email: o.email,
      };
    } else if (owner instanceof Types.ObjectId) {
      ownerOut = owner.toString();
    }

    return {
      id: _id.toString(),
      owner: ownerOut,
      ...rest,
    };
  });

  return { items: mapped, page, limit, total };
}

/** Xoá mềm: KHÔNG xoá cứng — đặt active=false (ẩn gói). Không cho ẩn 'free'. */
async function deletePlan(
  adminId: string,
  id: string
): Promise<Record<string, unknown>> {
  const plan = await Plan.findById(id);
  if (!plan) {
    throw ApiError.notFound('Không tìm thấy gói cước');
  }

  if (plan.key === 'free') {
    throw ApiError.badRequest('Không thể ẩn gói miễn phí (free)');
  }

  plan.active = false;
  await plan.save();

  await logAudit(adminId, {
    action: 'plan.delete',
    message: `Đã ẩn gói cước '${plan.name}' (${plan.key})`,
    severity: 'warning',
    target: plan._id.toString(),
    meta: { active: false },
  });

  return plan.toJSON();
}

export const plansService = {
  listPlans,
  createPlan,
  getPlan,
  updatePlan,
  togglePlan,
  listSubscribers,
  deletePlan,
};

export default plansService;
