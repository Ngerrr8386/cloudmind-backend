import { Types } from 'mongoose';
import { AiUsage } from '../../models/AiUsage';
import { Message } from '../../models/Message';

// Chi phi uoc tinh: (input + output tokens) / 1000 * 0.0005 USD
const COST_PER_1K_TOKENS = 0.0005;

function roundMoney(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function startOfDaysAgo(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

export interface AiMetrics {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  avgLatencyMs: number;
  estimatedCost: number;
}

export interface AiFeatureStat {
  feature: string;
  calls: number;
  tokens: number;
}

export interface AiDailyTrendPoint {
  date: string;
  calls: number;
}

export interface AiTopQuery {
  query: string;
  count: number;
}

export interface AiCostPoint {
  date: string;
  cost: number;
}

interface MetricsAgg {
  _id: null;
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  avgLatencyMs: number;
}

/** Tong quan chi so AI trong 30 ngay gan nhat. */
export async function getMetrics(): Promise<AiMetrics> {
  const since = startOfDaysAgo(30);

  const rows = await AiUsage.aggregate<MetricsAgg>([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: null,
        totalCalls: { $sum: 1 },
        totalInputTokens: { $sum: { $ifNull: ['$inputTokens', 0] } },
        totalOutputTokens: { $sum: { $ifNull: ['$outputTokens', 0] } },
        avgLatencyMs: { $avg: { $ifNull: ['$latencyMs', 0] } },
      },
    },
  ]);

  const agg = rows[0];
  if (!agg) {
    return {
      totalCalls: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      avgLatencyMs: 0,
      estimatedCost: 0,
    };
  }

  const totalTokens = agg.totalInputTokens + agg.totalOutputTokens;
  const estimatedCost = roundMoney((totalTokens / 1000) * COST_PER_1K_TOKENS);

  return {
    totalCalls: agg.totalCalls,
    totalInputTokens: agg.totalInputTokens,
    totalOutputTokens: agg.totalOutputTokens,
    avgLatencyMs: Math.round(agg.avgLatencyMs),
    estimatedCost,
  };
}

interface FeatureAgg {
  _id: string;
  calls: number;
  tokens: number;
}

/** Thong ke su dung AI nhom theo tinh nang (30 ngay gan nhat). */
export async function getByFeature(): Promise<AiFeatureStat[]> {
  const since = startOfDaysAgo(30);

  const rows = await AiUsage.aggregate<FeatureAgg>([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: '$feature',
        calls: { $sum: 1 },
        tokens: {
          $sum: {
            $add: [
              { $ifNull: ['$inputTokens', 0] },
              { $ifNull: ['$outputTokens', 0] },
            ],
          },
        },
      },
    },
    { $sort: { calls: -1 } },
  ]);

  return rows.map((r) => ({
    feature: r._id,
    calls: r.calls,
    tokens: r.tokens,
  }));
}

interface DailyTrendAgg {
  _id: string;
  calls: number;
}

/** Xu huong so luot goi AI theo ngay trong 14 ngay gan nhat. */
export async function getDailyTrend(): Promise<AiDailyTrendPoint[]> {
  const days = 14;
  const since = startOfDaysAgo(days - 1);

  const rows = await AiUsage.aggregate<DailyTrendAgg>([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        calls: { $sum: 1 },
      },
    },
  ]);

  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r._id, r.calls);
  }

  const result: AiDailyTrendPoint[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, calls: map.get(key) ?? 0 });
  }

  return result;
}

interface TopQueryAgg {
  _id: string;
  count: number;
}

/** Top 10 cau hoi (noi dung) duoc nguoi dung gui nhieu nhat. */
export async function getTopQueries(): Promise<AiTopQuery[]> {
  const rows = await Message.aggregate<TopQueryAgg>([
    { $match: { role: 'user' } },
    {
      $group: {
        _id: '$content',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  return rows.map((r) => ({
    query: r._id,
    count: r.count,
  }));
}

interface CostAgg {
  _id: string;
  tokens: number;
}

/** Chi phi AI uoc tinh theo ngay trong 30 ngay gan nhat. */
export async function getCost(): Promise<AiCostPoint[]> {
  const days = 30;
  const since = startOfDaysAgo(days - 1);

  const rows = await AiUsage.aggregate<CostAgg>([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        tokens: {
          $sum: {
            $add: [
              { $ifNull: ['$inputTokens', 0] },
              { $ifNull: ['$outputTokens', 0] },
            ],
          },
        },
      },
    },
  ]);

  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r._id, r.tokens);
  }

  const result: AiCostPoint[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const tokens = map.get(key) ?? 0;
    const cost = roundMoney((tokens / 1000) * COST_PER_1K_TOKENS);
    result.push({ date: key, cost });
  }

  return result;
}
