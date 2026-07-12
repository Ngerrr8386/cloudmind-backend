import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
  name: z.string().min(1, 'Vui lòng nhập tên').max(80),
})

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

export const googleSchema = z.object({
  idToken: z.string().min(10, 'Thiếu Firebase ID token'),
})

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Mật khẩu mới tối thiểu 8 ký tự'),
})

const otpCode = z.string().regex(/^\d{6}$/, 'Mã OTP gồm 6 chữ số')

export const verifyEmailSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  code: otpCode,
})

export const emailOnlySchema = z.object({
  email: z.string().email('Email không hợp lệ'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  code: otpCode,
  newPassword: z.string().min(8, 'Mật khẩu mới tối thiểu 8 ký tự'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
