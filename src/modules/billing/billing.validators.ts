import { z } from 'zod'

export const checkoutSchema = z.object({
  planKey: z.enum(['pro', 'team']),
  seats: z.coerce.number().int().min(1).max(500).optional(),
  months: z.coerce.number().int().min(1).max(24).optional(),
})

export const orderCodeParam = z.object({
  orderCode: z.coerce.number().int().positive(),
})
