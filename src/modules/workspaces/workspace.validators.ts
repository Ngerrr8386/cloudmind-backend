import { z } from 'zod'

export const createWorkspaceSchema = z.object({ name: z.string().min(1).max(120).optional() })

export const updateWorkspaceSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    slug: z.string().max(60).optional(),
    logoUrl: z.string().url().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Không có trường nào để cập nhật' })

export const transferSchema = z.object({ memberId: z.string().min(1) })

export const memberRoleSchema = z.object({ role: z.enum(['wsadmin', 'member']) })

export const inviteSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  wsRole: z.enum(['wsadmin', 'member']).optional(),
})

export const seatsSchema = z.object({ seats: z.coerce.number().int().min(1).max(500) })

export const permissionsSchema = z.object({
  permissions: z
    .array(z.object({ user: z.string().min(1), access: z.enum(['view', 'edit']) }))
    .max(200),
})
