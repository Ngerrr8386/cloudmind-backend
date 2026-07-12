import { z } from 'zod'
import { TONES } from '../../utils/tones'

const toneEnum = z.enum(TONES)

export const createFolderSchema = z.object({
  name: z.string().min(1, 'Tên thư mục bắt buộc').max(120),
  icon: z.string().max(40).optional(),
  tone: toneEnum.optional(),
  parentId: z.string().nullish(),
  workspaceId: z.string().nullish(),
})

export const updateFolderSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    icon: z.string().max(40).optional(),
    tone: toneEnum.optional(),
    parentId: z.string().nullish(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Không có trường nào để cập nhật' })

export const listFoldersQuery = z.object({
  scope: z.enum(['personal', 'workspace']).optional(),
})
