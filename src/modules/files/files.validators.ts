import { z } from 'zod'
import { TONES } from '../../utils/tones'

export const uploadUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1),
  size: z.coerce.number().int().nonnegative().default(0),
  folderId: z.string().nullish(),
  workspaceId: z.string().nullish(),
})

export const confirmSchema = z.object({
  size: z.coerce.number().int().nonnegative().optional(),
})

export const listFilesQuery = z.object({
  scope: z.enum(['personal', 'workspace']).optional(),
  folderId: z.string().optional(),
  type: z.string().optional(),
  starred: z.coerce.boolean().optional(),
  trashed: z.coerce.boolean().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['updatedAt', 'createdAt', 'name', 'size']).default('updatedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export const patchFileSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    folderId: z.string().nullish(),
    tags: z.array(z.string().max(40)).max(20).optional(),
    tone: z.enum(TONES).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Không có trường nào để cập nhật' })

export const shareSchema = z.object({
  permission: z.enum(['view', 'edit']).default('view'),
  expiresInDays: z.coerce.number().int().positive().max(365).optional(),
})

export const bulkSchema = z.object({
  ids: z.array(z.string()).min(1, 'Cần ít nhất 1 file'),
  action: z.enum(['trash', 'restore', 'delete', 'star', 'unstar', 'move']),
  folderId: z.string().nullish(),
})
