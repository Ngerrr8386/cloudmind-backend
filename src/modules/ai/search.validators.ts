import { z } from 'zod';

export const searchSchema = z.object({
  query: z.string().min(1, 'Truy vấn không được để trống'),
  mode: z.enum(['semantic', 'keyword', 'hybrid']).default('semantic'),
  type: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(10),
});

export const reindexSchema = z.object({
  fileId: z.string().min(1, 'fileId không được để trống'),
});

export type SearchInput = z.infer<typeof searchSchema>;
export type ReindexInput = z.infer<typeof reindexSchema>;
