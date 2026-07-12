import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import * as summarizeService from './summarize.service';
import type { SummaryLength } from './summarize.validators';

/**
 * POST /ai/summarize/:fileId
 * Tạo (hoặc cập nhật) tóm tắt cho tệp theo độ dài.
 */
export const createSummary = asyncHandler(async (req: Request, res: Response) => {
  const owner = req.user!.id;
  const { fileId } = req.params;
  const length = (req.body.length as SummaryLength) ?? 'medium';

  const summary = await summarizeService.summarizeFile(owner, fileId, length);
  ok(res, summary);
});

/**
 * GET /ai/summarize/:fileId
 * Trả về bản tóm tắt đã lưu theo độ dài (?length=).
 */
export const fetchSummary = asyncHandler(async (req: Request, res: Response) => {
  const owner = req.user!.id;
  const { fileId } = req.params;
  const length = (req.query.length as SummaryLength) ?? 'medium';

  const summary = await summarizeService.getSummary(owner, fileId, length);
  ok(res, summary);
});

/**
 * POST /ai/summarize/:fileId/regenerate
 * Luôn tạo lại tóm tắt (ghi đè bản cũ).
 */
export const regenerateSummary = asyncHandler(async (req: Request, res: Response) => {
  const owner = req.user!.id;
  const { fileId } = req.params;
  const length = (req.body.length as SummaryLength) ?? 'medium';

  const summary = await summarizeService.summarizeFile(owner, fileId, length);
  ok(res, summary);
});
