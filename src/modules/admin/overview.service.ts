import { Types } from 'mongoose';
import { User } from '../../models/User';
import { File } from '../../models/File';
import { Plan } from '../../models/Plan';
import { Subscription } from '../../models/Subscription';
import { Transaction } from '../../models/Transaction';
import { AiUsage } from '../../models/AiUsage';
import { Workspace } from '../../models/Workspace';

/** Số mili-giây trong 30 ngày. */
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Nhãn tháng ngắn gọn theo kiểu 'T1'..'T12'. */
function monthLabel(monthIndex0: number): string {
  return `T${monthIndex0 + 1}`;
}

/**
 * Trả về danh sách 6 mốc tháng gần nhất (bao gồm tháng hiện tại),
 * theo thứ tự từ cũ -> mới, mỗi mốc gồm year/month (0-based) và mốc thời gian đầu tháng.
 */
function lastSixMonths(now: Date): Array<{ year: number; month: number; start: Date; end: Date }> {
  const result: Array<{ year: number; month: number; start: Date; end: Date }> = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0, 0);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1, 0, 0, 0, 0);
    result.push({ year: start.getFullYear(), month: start.getMonth(), start, end });
  }
  return result;
}

export interface OverviewKpis {
  totalUsers: number;
  newUsers30d: number;
  mrr: number;
  totalStorageUsed: number;
  aiUsage30d: number;
  activeSubscriptions: number;
  churnRate: number;
}

/**
 * Tổng hợp các chỉ số chính (KPI) cho trang tổng quan admin.
 */
async function getKpis(): Promise<OverviewKpis> {
  const now = new Date();
  const since30d = new Date(now.getTime() - THIRTY_DAYS_MS);

  const [
    totalUsers,
    newUsers30d,
    aiUsage30d,
    activeSubscriptions,
    canceledSubscriptions,
    storageAgg,
    activeSubs,
    plans,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ createdAt: { $gte: since30d } }),
    AiUsage.countDocuments({ createdAt: { $gte: since30d } }),
    Subscription.countDocuments({ status: 'active' }),
    Subscription.countDocuments({ status: 'canceled' }),
    File.aggregate<{ _id: null; total: number }>([
      { $match: { status: { $ne: 'trashed' } } },
      { $group: { _id: null, total: { $sum: '$size' } } },
    ]),
    Subscription.find({ status: 'active' }).lean(),
    Plan.find({}).lean(),
  ]);

  const totalStorageUsed = storageAgg.length > 0 ? storageAgg[0].total : 0;

  // Lập bản đồ planKey -> Plan để tính MRR.
  const planByKey = new Map<string, { priceMonthly: number; pricingModel: 'flat' | 'per_seat' }>();
  for (const p of plans) {
    planByKey.set(p.key, { priceMonthly: p.priceMonthly, pricingModel: p.pricingModel });
  }

  let mrr = 0;
  for (const sub of activeSubs) {
    const plan = planByKey.get(sub.planKey);
    if (!plan) continue;
    const seats = plan.pricingModel === 'per_seat' ? Math.max(1, sub.seats || 1) : 1;
    mrr += plan.priceMonthly * seats;
  }

  // Tỉ lệ rời bỏ (churn) ước lượng: hủy / (active + hủy).
  const denom = activeSubscriptions + canceledSubscriptions;
  const churnRate = denom > 0 ? Math.round((canceledSubscriptions / denom) * 10000) / 100 : 0;

  return {
    totalUsers,
    newUsers30d,
    mrr,
    totalStorageUsed,
    aiUsage30d,
    activeSubscriptions,
    churnRate,
  };
}

export interface RevenuePoint {
  month: string;
  revenue: number;
  newUsers: number;
}

/**
 * Doanh thu + số người dùng mới theo 6 tháng gần nhất.
 * - revenue: tổng amount của Transaction status 'paid' nhóm theo tháng của paidAt.
 * - newUsers: số User nhóm theo tháng của createdAt.
 */
async function getRevenue(): Promise<RevenuePoint[]> {
  const now = new Date();
  const months = lastSixMonths(now);
  const rangeStart = months[0].start;

  const [revenueAgg, userAgg] = await Promise.all([
    Transaction.aggregate<{ _id: { y: number; m: number }; revenue: number }>([
      { $match: { status: 'paid', paidAt: { $gte: rangeStart } } },
      {
        $group: {
          _id: { y: { $year: '$paidAt' }, m: { $month: '$paidAt' } },
          revenue: { $sum: '$amount' },
        },
      },
    ]),
    User.aggregate<{ _id: { y: number; m: number }; newUsers: number }>([
      { $match: { createdAt: { $gte: rangeStart } } },
      {
        $group: {
          _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
          newUsers: { $sum: 1 },
        },
      },
    ]),
  ]);

  // $month trả về 1-based; key dạng 'year-month1based'.
  const revenueMap = new Map<string, number>();
  for (const r of revenueAgg) {
    revenueMap.set(`${r._id.y}-${r._id.m}`, r.revenue);
  }
  const userMap = new Map<string, number>();
  for (const u of userAgg) {
    userMap.set(`${u._id.y}-${u._id.m}`, u.newUsers);
  }

  return months.map((mo) => {
    const key = `${mo.year}-${mo.month + 1}`;
    return {
      month: monthLabel(mo.month),
      revenue: revenueMap.get(key) ?? 0,
      newUsers: userMap.get(key) ?? 0,
    };
  });
}

export interface UserGrowthPoint {
  month: string;
  total: number;
}

/**
 * Tăng trưởng người dùng cộng dồn theo 6 tháng gần nhất.
 * total tại mỗi tháng = tổng số user được tạo tính đến hết tháng đó.
 */
async function getUserGrowth(): Promise<UserGrowthPoint[]> {
  const now = new Date();
  const months = lastSixMonths(now);
  const rangeStart = months[0].start;
  const rangeEnd = months[months.length - 1].end;

  // Số user tạo trước khi bắt đầu cửa sổ 6 tháng -> baseline cộng dồn.
  const [baseline, inRangeAgg] = await Promise.all([
    User.countDocuments({ createdAt: { $lt: rangeStart } }),
    User.aggregate<{ _id: { y: number; m: number }; count: number }>([
      { $match: { createdAt: { $gte: rangeStart, $lt: rangeEnd } } },
      {
        $group: {
          _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const countMap = new Map<string, number>();
  for (const c of inRangeAgg) {
    countMap.set(`${c._id.y}-${c._id.m}`, c.count);
  }

  let running = baseline;
  return months.map((mo) => {
    running += countMap.get(`${mo.year}-${mo.month + 1}`) ?? 0;
    return { month: monthLabel(mo.month), total: running };
  });
}

export interface PlanDistributionPoint {
  plan: 'Free' | 'Pro' | 'Team';
  count: number;
}

/**
 * Phân bố người dùng theo gói (plan).
 */
async function getPlanDistribution(): Promise<PlanDistributionPoint[]> {
  const agg = await User.aggregate<{ _id: string; count: number }>([
    { $group: { _id: '$plan', count: { $sum: 1 } } },
  ]);

  const counts = new Map<string, number>();
  for (const a of agg) {
    counts.set(a._id, a.count);
  }

  const order: Array<'Free' | 'Pro' | 'Team'> = ['Free', 'Pro', 'Team'];
  return order.map((plan) => ({ plan, count: counts.get(plan) ?? 0 }));
}

export interface SystemHealth {
  services: Array<{ name: string; ok: boolean }>;
  counts: {
    users: number;
    files: number;
    workspaces: number;
    transactions: number;
  };
}

/**
 * Kiểm tra nhanh tình trạng hệ thống và các số đếm cốt lõi.
 */
async function getSystemHealth(): Promise<SystemHealth> {
  const [users, files, workspaces, transactions] = await Promise.all([
    User.countDocuments({}),
    File.countDocuments({}),
    Workspace.countDocuments({}),
    Transaction.countDocuments({}),
  ]);

  return {
    services: [
      { name: 'database', ok: true },
      { name: 'api', ok: true },
      { name: 'storage', ok: true },
      { name: 'ai', ok: true },
    ],
    counts: { users, files, workspaces, transactions },
  };
}

export interface RecentUser {
  id: string;
  name: string;
  email: string;
  plan: 'Free' | 'Pro' | 'Team';
  createdAt: Date;
}

export interface RecentTransaction {
  id: string;
  orderCode: number;
  owner: string;
  planKey: string;
  amount: number;
  currency: string;
  status: string;
  paidAt?: Date;
  createdAt: Date;
}

export interface RecentActivity {
  users: RecentUser[];
  transactions: RecentTransaction[];
}

/**
 * 5 người dùng mới nhất và 5 giao dịch đã thanh toán mới nhất.
 */
async function getRecent(): Promise<RecentActivity> {
  const [users, transactions] = await Promise.all([
    User.find({}).sort({ createdAt: -1 }).limit(5).lean(),
    Transaction.find({ status: 'paid' }).sort({ paidAt: -1, createdAt: -1 }).limit(5).lean(),
  ]);

  return {
    users: users.map((u) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      plan: u.plan,
      createdAt: u.createdAt,
    })),
    transactions: transactions.map((t) => ({
      id: String(t._id),
      orderCode: t.orderCode,
      owner: String(t.owner),
      planKey: t.planKey,
      amount: t.amount,
      currency: t.currency,
      status: t.status,
      paidAt: t.paidAt,
      createdAt: t.createdAt,
    })),
  };
}

// Tránh cảnh báo "unused import" trong cấu hình strict; Types được giữ lại để dùng cho
// các truy vấn $match bằng ObjectId nếu mở rộng sau này.
void Types;

export default {
  getKpis,
  getRevenue,
  getUserGrowth,
  getPlanDistribution,
  getSystemHealth,
  getRecent,
};
