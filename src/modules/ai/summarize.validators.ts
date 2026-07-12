import { z } from 'zod';

export const lengthEnum = z.enum(['short', 'medium', 'detailed']);

export const summarizeBodySchema = z.object({
  length: lengthEnum.optional().default('medium'),
});

export const summarizeParamsSchema = z.object({
  fileId: z.string().min(1, 'fileId là bắt buộc'),
});

export const summarizeQuerySchema = z.object({
  length: lengthEnum.optional().default('medium'),
});

export type SummaryLength = z.infer<typeof lengthEnum>;
