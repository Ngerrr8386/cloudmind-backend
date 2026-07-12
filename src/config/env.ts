import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4100),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:5174'),

  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/cloudmind'),
  // Ép tên database (hữu ích khi dùng Atlas SRV không ghi tên DB trong URI → tránh rơi vào DB "test")
  MONGODB_DB_NAME: z.string().default('cloudmind'),

  JWT_ACCESS_SECRET: z.string().min(8).default('dev_access_secret_change_me'),
  JWT_REFRESH_SECRET: z.string().min(8).default('dev_refresh_secret_change_me'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),

  // Firebase Admin (optional — guarded at runtime)
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),

  // Gemini (optional)
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  GEMINI_EMBED_MODEL: z.string().default('gemini-embedding-001'),

  // App
  APP_NAME: z.string().default('CloudMind'),
  APP_URL: z.string().default('http://localhost:5173'),

  // SMTP (email / OTP) — dùng app password của Gmail hoặc SMTP bất kỳ
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.string().default('false').transform((v) => v === 'true' || v === '1'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(), // vd: "CloudMind <no-reply@cloudmind.vn>"
  OTP_TTL_MINUTES: z.coerce.number().default(10),

  // PayOS (thanh toán)
  PAYOS_CLIENT_ID: z.string().optional(),
  PAYOS_API_KEY: z.string().optional(),
  PAYOS_CHECKSUM_KEY: z.string().optional(),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Biến môi trường không hợp lệ:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
export const isProd = env.NODE_ENV === 'production'

export const corsOrigins = env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
export const firebaseConfigured = Boolean(
  env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY,
)
export const geminiConfigured = Boolean(env.GEMINI_API_KEY)
export const mailConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS)
export const payosConfigured = Boolean(env.PAYOS_CLIENT_ID && env.PAYOS_API_KEY && env.PAYOS_CHECKSUM_KEY)
