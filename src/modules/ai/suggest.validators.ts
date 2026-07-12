import { z } from 'zod';

export const suggestFolderSchema = z
  .object({
    fileId: z.string().trim().min(1).optional(),
    fileName: z.string().trim().min(1).optional(),
    text: z.string().trim().min(1).optional(),
  })
  .refine((data) => Boolean(data.fileId) || Boolean(data.fileName), {
    message: 'Cần cung cấp ít nhất fileId hoặc fileName',
  });

export type SuggestFolderInput = z.infer<typeof suggestFolderSchema>;
