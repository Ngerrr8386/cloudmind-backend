import { z } from 'zod'
import { TONES } from '../../utils/tones'

export const updateProfileSchema = z
  .object({
    name: z.string().min(1).max(80).optional(),
    handle: z.string().max(40).optional(),
    bio: z.string().max(280).optional(),
    tone: z.enum(TONES).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Không có trường nào để cập nhật' })

export const aiSettingsSchema = z
  .object({
    autoSummarize: z.boolean().optional(),
    folderSuggestions: z.boolean().optional(),
    allowIndexing: z.boolean().optional(),
    improveModel: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Không có trường nào để cập nhật' })

export const appearanceSchema = z
  .object({
    theme: z.enum(['light', 'dark', 'auto']).optional(),
    accent: z.enum(TONES).optional(),
    reduceMotion: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Không có trường nào để cập nhật' })

export const twoFactorSchema = z.object({ enabled: z.boolean() })
