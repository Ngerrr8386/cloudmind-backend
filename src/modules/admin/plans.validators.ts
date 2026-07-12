import { z } from 'zod';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

export const planKeyEnum = z.enum(['free', 'pro', 'team']);
export const pricingModelEnum = z.enum(['flat', 'per_seat']);

/** Validate :id param dạng ObjectId hợp lệ. */
export const planIdParamSchema = z.object({
  id: z
    .string()
    .regex(objectIdRegex, 'ID gói cước không hợp lệ'),
});

/** Body tạo Plan mới. */
export const createPlanSchema = z.object({
  key: planKeyEnum,
  name: z.string().trim().min(1, 'Tên gói không được để trống').max(120),
  tagline: z.string().trim().max(240).optional(),
  priceMonthly: z
    .number({ invalid_type_error: 'Giá theo tháng phải là số' })
    .min(0, 'Giá theo tháng không được âm'),
  priceYearly: z
    .number({ invalid_type_error: 'Giá theo năm phải là số' })
    .min(0, 'Giá theo năm không được âm')
    .optional(),
  currency: z.string().trim().min(1).max(10).optional(),
  storageBytes: z
    .number({ invalid_type_error: 'Dung lượng lưu trữ phải là số' })
    .min(0, 'Dung lượng lưu trữ không được âm'),
  pricingModel: pricingModelEnum.optional(),
  includedSeats: z
    .number({ invalid_type_error: 'Số ghế kèm theo phải là số' })
    .int('Số ghế kèm theo phải là số nguyên')
    .min(1, 'Số ghế kèm theo phải ≥ 1')
    .optional(),
  aiMonthlyQuota: z
    .number({ invalid_type_error: 'Hạn mức AI phải là số' })
    .min(0, 'Hạn mức AI không được âm')
    .optional(),
  features: z.array(z.string().trim().min(1)).optional(),
  active: z.boolean().optional(),
  popular: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

/** Body cập nhật Plan — tất cả tuỳ chọn, không cho đổi key. */
export const updatePlanSchema = z
  .object({
    name: z.string().trim().min(1, 'Tên gói không được để trống').max(120).optional(),
    tagline: z.string().trim().max(240).optional(),
    priceMonthly: z
      .number({ invalid_type_error: 'Giá theo tháng phải là số' })
      .min(0, 'Giá theo tháng không được âm')
      .optional(),
    priceYearly: z
      .number({ invalid_type_error: 'Giá theo năm phải là số' })
      .min(0, 'Giá theo năm không được âm')
      .optional(),
    currency: z.string().trim().min(1).max(10).optional(),
    storageBytes: z
      .number({ invalid_type_error: 'Dung lượng lưu trữ phải là số' })
      .min(0, 'Dung lượng lưu trữ không được âm')
      .optional(),
    pricingModel: pricingModelEnum.optional(),
    includedSeats: z
      .number({ invalid_type_error: 'Số ghế kèm theo phải là số' })
      .int('Số ghế kèm theo phải là số nguyên')
      .min(1, 'Số ghế kèm theo phải ≥ 1')
      .optional(),
    aiMonthlyQuota: z
      .number({ invalid_type_error: 'Hạn mức AI phải là số' })
      .min(0, 'Hạn mức AI không được âm')
      .optional(),
    features: z.array(z.string().trim().min(1)).optional(),
    active: z.boolean().optional(),
    popular: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Cần ít nhất một trường để cập nhật',
  });

/** Query phân trang cho danh sách người đăng ký. */
export const subscribersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['active', 'canceled', 'pending', 'expired']).optional(),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type SubscribersQuery = z.infer<typeof subscribersQuerySchema>;
