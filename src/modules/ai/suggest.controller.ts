import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import * as suggestService from './suggest.service';
import type { SuggestFolderInput } from './suggest.validators';

export const suggestFolder = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as SuggestFolderInput;
  const result = await suggestService.suggestFolder(req.user!.id, input);
  ok(res, result);
});
