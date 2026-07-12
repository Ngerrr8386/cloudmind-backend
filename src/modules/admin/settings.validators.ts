import { z } from 'zod';

// ===== Settings group validators =====

export const updateGeneralSchema = z
  .object({
    appName: z.string().trim().min(1, 'Tên ứng dụng không được để trống').max(120).optional(),
    supportEmail: z.string().trim().email('Email hỗ trợ không hợp lệ').optional(),
    language: z.string().trim().min(2).max(10).optional(),
    maintenance: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Cần ít nhất một trường để cập nhật',
  });

export const updateAiSchema = z
  .object({
    chatModel: z.string().trim().min(1).max(120).optional(),
    embedModel: z.string().trim().min(1).max(120).optional(),
    features: z
      .object({
        search: z.boolean().optional(),
        chat: z.boolean().optional(),
        summarize: z.boolean().optional(),
        suggest: z.boolean().optional(),
      })
      .strict()
      .optional(),
    monthlyQuotaFree: z.number().int('Hạn mức phải là số nguyên').min(0, 'Hạn mức không được âm').optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Cần ít nhất một trường để cập nhật',
  });

export const updateLimitsSchema = z
  .object({
    maxUploadMB: z.number().int('Giới hạn upload phải là số nguyên').min(1, 'Giới hạn upload tối thiểu là 1MB').max(102400).optional(),
    rateLimitPerMin: z.number().int('Giới hạn tần suất phải là số nguyên').min(1, 'Giới hạn tần suất tối thiểu là 1').max(100000).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Cần ít nhất một trường để cập nhật',
  });

export const updateSecuritySchema = z
  .object({
    enforce2fa: z.boolean().optional(),
    sessionTimeoutMins: z.number().int('Thời gian phiên phải là số nguyên').min(1, 'Thời gian phiên tối thiểu là 1 phút').max(525600).optional(),
    ipAllowlist: z.array(z.string().trim().min(1)).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Cần ít nhất một trường để cập nhật',
  });

// ===== Team validators =====

export const inviteTeamSchema = z
  .object({
    email: z.string().trim().email('Email không hợp lệ'),
    name: z.string().trim().min(1).max(120).optional(),
  })
  .strict();

export const updateRoleSchema = z
  .object({
    role: z.enum(['admin', 'customer'], {
      errorMap: () => ({ message: "Vai trò phải là 'admin' hoặc 'customer'" }),
    }),
  })
  .strict();

export const idParamSchema = z
  .object({
    id: z.string().trim().regex(/^[a-fA-F0-9]{24}$/, 'ID không hợp lệ'),
  })
  .strict();

// ===== Integrations validators =====

export const integrationKeyParamSchema = z
  .object({
    key: z.string().trim().min(1, 'Key tích hợp không được để trống').max(120),
  })
  .strict();

export const updateIntegrationSchema = z
  .object({
    enabled: z.boolean().optional(),
    config: z.record(z.unknown()).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Cần ít nhất một trường để cập nhật',
  });

// ===== Inferred types =====

export type UpdateGeneralInput = z.infer<typeof updateGeneralSchema>;
export type UpdateAiInput = z.infer<typeof updateAiSchema>;
export type UpdateLimitsInput = z.infer<typeof updateLimitsSchema>;
export type UpdateSecurityInput = z.infer<typeof updateSecuritySchema>;
export type InviteTeamInput = z.infer<typeof inviteTeamSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdateIntegrationInput = z.infer<typeof updateIntegrationSchema>;
