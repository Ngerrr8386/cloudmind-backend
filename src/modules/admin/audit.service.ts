import { Types, FilterQuery } from 'mongoose';
import { AuditLog } from '../../models/AuditLog';
import { ApiError } from '../../utils/ApiError';

export type AuditSeverity = 'info' | 'warning' | 'critical';

interface AuditLogLean {
  _id: Types.ObjectId;
  actor?: Types.ObjectId;
  actorName: string;
  action: string;
  target?: string;
  severity: AuditSeverity;
  message: string;
  ip?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

export interface AuditLogView {
  id: string;
  actor?: string;
  actorName: string;
  action: string;
  target?: string;
  severity: AuditSeverity;
  message: string;
  ip?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

export interface ListAuditParams {
  page?: number;
  limit?: number;
  q?: string;
  severity?: AuditSeverity;
}

export interface AuditCounts {
  total: number;
  info: number;
  warning: number;
  critical: number;
}

export interface ListAuditResult {
  items: AuditLogView[];
  page: number;
  limit: number;
  total: number;
  counts: AuditCounts;
}

export interface ExportAuditResult {
  format: 'json';
  count: number;
  rows: AuditLogView[];
}

const MAX_LIMIT = 100;
const EXPORT_LIMIT = 1000;

function toView(doc: AuditLogLean): AuditLogView {
  return {
    id: doc._id.toString(),
    actor: doc.actor ? doc.actor.toString() : undefined,
    actorName: doc.actorName,
    action: doc.action,
    target: doc.target,
    severity: doc.severity,
    message: doc.message,
    ip: doc.ip,
    meta: doc.meta,
    createdAt: doc.createdAt,
  };
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildFilter(params: ListAuditParams): FilterQuery<AuditLogLean> {
  const filter: FilterQuery<AuditLogLean> = {};

  if (params.severity) {
    filter.severity = params.severity;
  }

  const q = params.q?.trim();
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ message: rx }, { action: rx }];
  }

  return filter;
}

export async function listAuditLogs(params: ListAuditParams): Promise<ListAuditResult> {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const limit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(params.limit ?? 20)));
  const skip = (page - 1) * limit;

  const filter = buildFilter(params);

  const [rows, total, info, warning, critical] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<AuditLogLean[]>()
      .exec(),
    AuditLog.countDocuments(filter).exec(),
    AuditLog.countDocuments({ ...filter, severity: 'info' }).exec(),
    AuditLog.countDocuments({ ...filter, severity: 'warning' }).exec(),
    AuditLog.countDocuments({ ...filter, severity: 'critical' }).exec(),
  ]);

  return {
    items: rows.map(toView),
    page,
    limit,
    total,
    counts: { total, info, warning, critical },
  };
}

export async function getAuditLog(id: string): Promise<AuditLogView> {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('ID nhật ký không hợp lệ');
  }

  const doc = await AuditLog.findById(id).lean<AuditLogLean | null>().exec();
  if (!doc) {
    throw ApiError.notFound('Không tìm thấy bản ghi nhật ký');
  }

  return toView(doc);
}

export async function exportAuditLogs(params: ListAuditParams): Promise<ExportAuditResult> {
  const filter = buildFilter(params);

  const rows = await AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(EXPORT_LIMIT)
    .lean<AuditLogLean[]>()
    .exec();

  const views = rows.map(toView);

  return {
    format: 'json',
    count: views.length,
    rows: views,
  };
}
