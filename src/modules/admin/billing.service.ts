import { FilterQuery, Types } from 'mongoose';
import { Transaction } from '../../models/Transaction';
import { Subscription } from '../../models/Subscription';
import { ApiError } from '../../utils/ApiError';
import { logAudit } from './admin.shared';

// ===== Types =====
export interface BillingMetrics {
  mrr: number;
  arr: number;
  byPlan: Array<{ plan: string; revenue: number }>;
  paidCount: number;
  refundedCount: number;
  failedCount: number;
}

export interface TransactionListParams {
  page: number;
  limit: number;
  q?: string;
  status?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: { page: number; limit: number; total: number };
}

interface TransactionDoc {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  orderCode: number;
  planKey: string;
  amount: number;
  currency: string;
  seats: number;
  periodMonths: number;
  status: string;
  description: string;
  invoiceNo?: string;
  paidAt?: Date;
  createdAt: Date;
  save: () => Promise<unknown>;
  toJSON: () => Record<string, unknown>;
}

const MONTHS_PER_YEAR = 12;

// Trạng thái giao dịch hợp lệ để lọc.
const TRANSACTION_STATUSES = [
  'pending',
  'paid',
  'canceled',
  'failed',
  'expired',
  'refunded',
] as const;

/**
 * Tính các chỉ số doanh thu: MRR, ARR, doanh thu theo gói, số lượng theo trạng thái.
 * - MRR (Monthly Recurring Revenue) ước tính từ các subscription đang active,
 *   quy đổi giá trị giao dịch đã thanh toán về theo tháng.
 * - byPlan tổng hợp doanh thu (amount) từ các giao dịch đã thanh toán theo planKey.
 */
export async function getMetrics(): Promise<BillingMetrics> {
  // Tổng hợp doanh thu theo gói từ các giao dịch đã thanh toán.
  const byPlanAgg = await Transaction.aggregate<{
    _id: string;
    revenue: number;
  }>([
    { $match: { status: 'paid' } },
    {
      $group: {
        _id: '$planKey',
        revenue: { $sum: '$amount' },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  const byPlan = byPlanAgg.map((row) => ({
    plan: row._id ?? 'unknown',
    revenue: row.revenue ?? 0,
  }));

  // Đếm số giao dịch theo trạng thái.
  const [paidCount, refundedCount, failedCount] = await Promise.all([
    Transaction.countDocuments({ status: 'paid' }),
    Transaction.countDocuments({ status: 'refunded' }),
    Transaction.countDocuments({ status: { $in: ['failed', 'expired'] } }),
  ]);

  // Ước tính MRR: tổng giá trị tháng của các giao dịch đã thanh toán
  // gắn với subscription đang active.
  const activeSubs = await Subscription.find({ status: 'active' })
    .select('owner planKey')
    .lean<{ owner: Types.ObjectId; planKey: string }[]>();

  let mrr = 0;

  if (activeSubs.length > 0) {
    const mrrAgg = await Transaction.aggregate<{ _id: null; mrr: number }>([
      {
        $match: {
          status: 'paid',
          owner: { $in: activeSubs.map((s) => new Types.ObjectId(s.owner)) },
        },
      },
      // Lấy giao dịch thanh toán gần nhất của mỗi owner làm cơ sở doanh thu định kỳ.
      { $sort: { paidAt: -1, createdAt: -1 } },
      {
        $group: {
          _id: '$owner',
          amount: { $first: '$amount' },
          periodMonths: { $first: '$periodMonths' },
        },
      },
      {
        $group: {
          _id: null,
          mrr: {
            $sum: {
              $cond: [
                { $gt: ['$periodMonths', 0] },
                { $divide: ['$amount', '$periodMonths'] },
                '$amount',
              ],
            },
          },
        },
      },
    ]);

    mrr = mrrAgg.length > 0 ? Math.round(mrrAgg[0].mrr) : 0;
  }

  const arr = mrr * MONTHS_PER_YEAR;

  return {
    mrr,
    arr,
    byPlan,
    paidCount,
    refundedCount,
    failedCount,
  };
}

/**
 * Danh sách giao dịch có phân trang, lọc theo status và tìm theo orderCode/invoiceNo.
 * Populate owner (name, email).
 */
export async function listTransactions(
  params: TransactionListParams
): Promise<PaginatedResult<Record<string, unknown>>> {
  const { page, limit, q, status } = params;
  const filter: FilterQuery<TransactionDoc> = {};

  if (status) {
    filter.status = status;
  }

  if (q && q.trim()) {
    const term = q.trim();
    const or: FilterQuery<TransactionDoc>[] = [
      { invoiceNo: { $regex: term, $options: 'i' } },
    ];
    const asNumber = Number(term);
    if (Number.isFinite(asNumber)) {
      or.push({ orderCode: asNumber });
    }
    filter.$or = or;
  }

  const skip = (page - 1) * limit;

  const [docs, total] = await Promise.all([
    Transaction.find(filter)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments(filter),
  ]);

  const items = docs.map((doc) => doc.toJSON());

  return { items, meta: { page, limit, total } };
}

/**
 * Chi tiết một giao dịch theo id. Populate owner (name, email).
 */
export async function getTransaction(
  id: string
): Promise<Record<string, unknown>> {
  const doc = await Transaction.findById(id).populate('owner', 'name email');
  if (!doc) {
    throw ApiError.notFound('Không tìm thấy giao dịch');
  }
  return doc.toJSON();
}

/**
 * Hoàn tiền một giao dịch. Chỉ cho phép khi giao dịch đang ở trạng thái 'paid'.
 * Ghi nhật ký audit với mức độ 'warning'.
 * (Ghi chú: hoàn tiền thật qua PayOS là bước xử lý sau.)
 */
export async function refundTransaction(
  adminId: string,
  id: string
): Promise<Record<string, unknown>> {
  const doc = (await Transaction.findById(id)) as TransactionDoc | null;
  if (!doc) {
    throw ApiError.notFound('Không tìm thấy giao dịch');
  }

  if (doc.status !== 'paid') {
    throw ApiError.badRequest(
      'Chỉ có thể hoàn tiền giao dịch đã thanh toán'
    );
  }

  doc.status = 'refunded';
  await doc.save();

  await logAudit(adminId, {
    action: 'billing.transaction.refund',
    severity: 'warning',
    message: `Hoàn tiền giao dịch #${doc.orderCode} (số tiền ${doc.amount} ${doc.currency})`,
    target: String(doc._id),
    meta: {
      orderCode: doc.orderCode,
      amount: doc.amount,
      currency: doc.currency,
      planKey: doc.planKey,
    },
  });

  return doc.toJSON();
}

/**
 * Danh sách giao dịch thất bại/hết hạn, sắp xếp theo thời gian tạo giảm dần.
 */
export async function listFailed(): Promise<Record<string, unknown>[]> {
  const docs = await Transaction.find({ status: { $in: ['failed', 'expired'] } })
    .populate('owner', 'name email')
    .sort({ createdAt: -1 });
  return docs.map((doc) => doc.toJSON());
}

/**
 * Danh sách hoá đơn (giao dịch đã thanh toán) có phân trang.
 */
export async function listInvoices(params: {
  page: number;
  limit: number;
}): Promise<PaginatedResult<Record<string, unknown>>> {
  const { page, limit } = params;
  const filter: FilterQuery<TransactionDoc> = { status: 'paid' };
  const skip = (page - 1) * limit;

  const [docs, total] = await Promise.all([
    Transaction.find(filter)
      .populate('owner', 'name email')
      .sort({ paidAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments(filter),
  ]);

  const items = docs.map((doc) => doc.toJSON());

  return { items, meta: { page, limit, total } };
}

export const allowedStatuses = TRANSACTION_STATUSES;
