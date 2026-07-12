import { z } from 'zod';

const PLANS = ['Free', 'Pro', 'Team'] as const;
const STATUSES = ['active', 'trial', 'suspended', 'pending'] as const;
const ROLES = ['customer', 'admin'] as const;

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).optional(),
  plan: z.enum(PLANS).optional(),
  status: z.enum(STATUSES).optional(),
  role: z.enum(ROLES).optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID không hợp lệ'),
});

export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
  name: z.string().trim().min(1, 'Tên không được để trống').max(120),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').max(200),
  role: z.enum(ROLES).optional(),
  plan: z.enum(PLANS).optional(),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    plan: z.enum(PLANS).optional(),
    status: z.enum(STATUSES).optional(),
    role: z.enum(ROLES).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Cần ít nhất một trường để cập nhật',
  });

export const updatePlanSchema = z.object({
  plan: z.enum(PLANS, { required_error: 'Gói dịch vụ là bắt buộc' }),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
