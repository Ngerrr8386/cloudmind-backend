import { File } from '../../models/File';
import { Embedding } from '../../models/Embedding';

// ====== Kiểu dữ liệu trả về ======
export interface InsightCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  trend?: number;
  tone: string;
}

export interface ClusterNode {
  id: string;
  label: string;
  files: number;
  color: string;
  x: number;
  y: number;
}

export interface ConnectionGroup {
  id: string;
  label: string;
  files: { id: string; name: string }[];
  confidence: number;
}

export interface TrendPoint {
  month: string;
  count: number;
}

// ====== Tiện ích ======

// Bảng màu hex theo loại file để frontend vẽ cluster.
const TYPE_COLORS: Record<string, string> = {
  document: '#8b5cf6',
  doc: '#8b5cf6',
  pdf: '#ef4444',
  image: '#10b981',
  video: '#f59e0b',
  audio: '#06b6d4',
  spreadsheet: '#22c55e',
  presentation: '#f97316',
  code: '#6366f1',
  archive: '#a855f7',
  text: '#3b82f6',
  other: '#64748b',
};

function colorForType(type: string): string {
  const key = (type || 'other').toLowerCase();
  if (TYPE_COLORS[key]) return TYPE_COLORS[key];
  // Sinh màu ổn định từ tên loại nếu chưa có trong bảng.
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return hslToHex(hue, 65, 55);
}

function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const toHex = (v: number): string => {
    const hex = Math.round((v + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rand(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

const VI_MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

// ====== GET '/' — Thẻ insight tổng quan ======
export async function getInsights(owner: string): Promise<InsightCard[]> {
  const now = new Date();
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const prev30 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const baseReady = { owner, status: 'ready' as const };

  const [recentCount, prevCount, totalReady, unprocessedCount, topType] = await Promise.all([
    File.countDocuments({ ...baseReady, createdAt: { $gte: last30 } }),
    File.countDocuments({ ...baseReady, createdAt: { $gte: prev30, $lt: last30 } }),
    File.countDocuments(baseReady),
    File.countDocuments({ ...baseReady, aiProcessed: false }),
    File.aggregate<{ _id: string; count: number }>([
      { $match: baseReady },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
  ]);

  // Tính xu hướng (%) so với 30 ngày trước đó.
  let trend = 0;
  if (prevCount > 0) {
    trend = Math.round(((recentCount - prevCount) / prevCount) * 100);
  } else if (recentCount > 0) {
    trend = 100;
  }

  const popular = topType[0];
  const popularLabel = popular?._id ?? 'tài liệu';
  const popularCount = popular?.count ?? 0;

  return [
    {
      id: 'recent',
      title: 'Tài liệu mới',
      description: `${recentCount} tài liệu trong 30 ngày qua`,
      icon: 'Sparkles',
      trend,
      tone: 'violet',
    },
    {
      id: 'unprocessed',
      title: 'Chưa lập chỉ mục AI',
      description: `${unprocessedCount} file chưa được embedding`,
      icon: 'Recycle',
      tone: 'emerald',
    },
    {
      id: 'storage',
      title: 'Loại file phổ biến',
      description:
        popularCount > 0
          ? `${popularLabel}: ${popularCount} file trong tổng số ${totalReady}`
          : 'Chưa có dữ liệu để phân tích',
      icon: 'Network',
      tone: 'indigo',
    },
  ];
}

// ====== GET '/clusters' — Gom nhóm file theo loại ======
export async function getClusters(owner: string): Promise<ClusterNode[]> {
  const rows = await File.aggregate<{ _id: string; count: number }>([
    { $match: { owner, status: 'ready' } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 12 },
  ]);

  return rows.map((r) => {
    const type = r._id || 'other';
    return {
      id: type,
      label: type,
      files: r.count,
      color: colorForType(type),
      x: rand(20, 80),
      y: rand(20, 80),
    };
  });
}

// ====== GET '/connections' — Phát hiện kết nối theo tag trùng nhau ======
export async function getConnections(owner: string): Promise<ConnectionGroup[]> {
  // Gom các file cùng tag thành cụm liên quan (mỗi tag có >= 2 file).
  const rows = await File.aggregate<{
    _id: string;
    files: { id: unknown; name: string }[];
    count: number;
  }>([
    { $match: { owner, status: 'ready', tags: { $exists: true, $ne: [] } } },
    { $unwind: '$tags' },
    {
      $group: {
        _id: '$tags',
        files: { $push: { id: '$_id', name: '$name' } },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gte: 2 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  if (rows.length === 0) return [];

  return rows.map((r) => {
    // Giới hạn số file hiển thị trong mỗi cụm để gọn gàng.
    const files = r.files.slice(0, 8).map((f) => ({
      id: String(f.id),
      name: f.name,
    }));
    // Độ tin cậy: càng nhiều file cùng tag càng cao (chuẩn hoá 0..1).
    const confidence = Math.min(1, 0.5 + (r.count - 2) * 0.1);
    return {
      id: r._id,
      label: r._id,
      files,
      confidence: Math.round(confidence * 100) / 100,
    };
  });
}

// ====== GET '/trends' — Số file tạo theo tháng (6 tháng gần nhất) ======
export async function getTrends(owner: string): Promise<TrendPoint[]> {
  const now = new Date();
  // Mốc đầu của 6 tháng trước (bao gồm tháng hiện tại).
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const rows = await File.aggregate<{ _id: { y: number; m: number }; count: number }>([
    { $match: { owner, status: 'ready', createdAt: { $gte: start } } },
    {
      $group: {
        _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
  ]);

  // Map 'năm-tháng' -> count để điền 0 cho tháng thiếu.
  const countByKey = new Map<string, number>();
  for (const r of rows) {
    countByKey.set(`${r._id.y}-${r._id.m}`, r.count);
  }

  const result: TrendPoint[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    result.push({
      month: VI_MONTHS[d.getMonth()],
      count: countByKey.get(key) ?? 0,
    });
  }

  return result;
}

// Giữ tham chiếu Embedding để có thể mở rộng thống kê chỉ mục về sau.
export async function countIndexed(owner: string): Promise<number> {
  return Embedding.countDocuments({ owner });
}
