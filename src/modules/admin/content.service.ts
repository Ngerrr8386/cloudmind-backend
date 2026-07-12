import { Types } from 'mongoose';
import { File } from '../../models/File';
import { Report } from '../../models/Report';
import { ApiError } from '../../utils/ApiError';
import { logAudit } from './admin.shared';

export interface ListContentParams {
  page?: number;
  limit?: number;
  q?: string;
  moderationStatus?: 'clean' | 'flagged' | 'reviewing' | 'removed';
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

const MAX_LIMIT = 100;

function normalizePagination(page?: number, limit?: number): { page: number; limit: number; skip: number } {
  const safePage = page && page > 0 ? Math.floor(page) : 1;
  let safeLimit = limit && limit > 0 ? Math.floor(limit) : 20;
  if (safeLimit > MAX_LIMIT) safeLimit = MAX_LIMIT;
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Danh sách file kèm bộ lọc trạng thái kiểm duyệt và tìm kiếm theo tên.
 */
export async function listContent(params: ListContentParams): Promise<PaginatedResult<Record<string, unknown>>> {
  const { page, limit, skip } = normalizePagination(params.page, params.limit);

  const filter: Record<string, unknown> = {};
  if (params.moderationStatus) {
    filter.moderationStatus = params.moderationStatus;
  }
  if (params.q && params.q.trim()) {
    filter.name = { $regex: escapeRegex(params.q.trim()), $options: 'i' };
  }

  const [docs, total] = await Promise.all([
    File.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('owner', 'name email')
      .exec(),
    File.countDocuments(filter).exec(),
  ]);

  const items = docs.map((doc) => doc.toJSON() as Record<string, unknown>);
  return { items, page, limit, total };
}

/**
 * Hàng đợi kiểm duyệt: các file đang bị gắn cờ hoặc đang xem xét.
 */
export async function getModerationQueue(): Promise<Record<string, unknown>[]> {
  const docs = await File.find({ moderationStatus: { $in: ['flagged', 'reviewing'] } })
    .sort({ createdAt: 1 })
    .populate('owner', 'name email')
    .exec();

  return docs.map((doc) => doc.toJSON() as Record<string, unknown>);
}

/**
 * Chi tiết một file kèm các báo cáo liên quan.
 */
export async function getContentDetail(id: string): Promise<Record<string, unknown>> {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('ID file không hợp lệ');
  }

  const file = await File.findById(id).populate('owner', 'name email').exec();
  if (!file) {
    throw ApiError.notFound('Không tìm thấy file');
  }

  const reportDocs = await Report.find({ file: id })
    .sort({ createdAt: -1 })
    .populate('reporter', 'name email')
    .exec();

  const result = file.toJSON() as Record<string, unknown>;
  result.reports = reportDocs.map((r) => r.toJSON() as Record<string, unknown>);
  return result;
}

/**
 * Duyệt (approve) file: đặt moderationStatus='clean', xoá lý do gắn cờ.
 */
export async function approveContent(adminId: string, id: string): Promise<Record<string, unknown>> {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('ID file không hợp lệ');
  }

  const file = await File.findById(id).exec();
  if (!file) {
    throw ApiError.notFound('Không tìm thấy file');
  }

  file.moderationStatus = 'clean';
  file.flagReason = undefined;
  await file.save();

  await logAudit(adminId, {
    action: 'content.approve',
    message: `Đã duyệt file "${file.name}"`,
    severity: 'info',
    target: id,
    meta: { fileId: id, name: file.name },
  });

  return file.toJSON() as Record<string, unknown>;
}

/**
 * Gỡ bỏ (remove) file: moderationStatus='removed', status='trashed'.
 */
export async function removeContent(adminId: string, id: string): Promise<Record<string, unknown>> {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('ID file không hợp lệ');
  }

  const file = await File.findById(id).exec();
  if (!file) {
    throw ApiError.notFound('Không tìm thấy file');
  }

  file.moderationStatus = 'removed';
  file.status = 'trashed';
  await file.save();

  await logAudit(adminId, {
    action: 'content.remove',
    message: `Đã gỡ bỏ file "${file.name}"`,
    severity: 'warning',
    target: id,
    meta: { fileId: id, name: file.name },
  });

  return file.toJSON() as Record<string, unknown>;
}

export interface ListReportsParams {
  page?: number;
  limit?: number;
  status?: 'open' | 'resolved' | 'dismissed';
}

/**
 * Danh sách báo cáo, mặc định lọc trạng thái 'open', sắp xếp mới nhất trước.
 */
export async function listReports(params: ListReportsParams): Promise<PaginatedResult<Record<string, unknown>>> {
  const { page, limit, skip } = normalizePagination(params.page, params.limit);

  const filter: Record<string, unknown> = {
    status: params.status ?? 'open',
  };

  const [docs, total] = await Promise.all([
    Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('file', 'name')
      .populate('reporter', 'name email')
      .exec(),
    Report.countDocuments(filter).exec(),
  ]);

  const items = docs.map((doc) => doc.toJSON() as Record<string, unknown>);
  return { items, page, limit, total };
}

/**
 * Xử lý báo cáo: resolve (mặc định) hoặc dismiss.
 */
export async function resolveReport(
  adminId: string,
  id: string,
  action: 'resolve' | 'dismiss' = 'resolve',
): Promise<Record<string, unknown>> {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('ID báo cáo không hợp lệ');
  }

  const report = await Report.findById(id).exec();
  if (!report) {
    throw ApiError.notFound('Không tìm thấy báo cáo');
  }

  report.status = action === 'dismiss' ? 'dismissed' : 'resolved';
  report.resolvedBy = new Types.ObjectId(adminId);
  report.resolvedAt = new Date();
  await report.save();

  await logAudit(adminId, {
    action: action === 'dismiss' ? 'report.dismiss' : 'report.resolve',
    message:
      action === 'dismiss'
        ? `Đã bỏ qua báo cáo ${id}`
        : `Đã giải quyết báo cáo ${id}`,
    severity: 'info',
    target: id,
    meta: { reportId: id, status: report.status },
  });

  return report.toJSON() as Record<string, unknown>;
}
