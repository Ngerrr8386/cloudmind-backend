import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import * as searchService from './search.service';
import type { SearchInput, ReindexInput } from './search.validators';

export const search = asyncHandler(async (req: Request, res: Response) => {
  const owner = req.user!.id;
  const result = await searchService.search(owner, req.body as SearchInput);
  ok(res, result);
});

export const suggestions = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, { suggestions: searchService.getSuggestions() });
});

export const reindex = asyncHandler(async (req: Request, res: Response) => {
  const owner = req.user!.id;
  const result = await searchService.reindex(owner, req.body as ReindexInput);
  ok(res, result);
});
