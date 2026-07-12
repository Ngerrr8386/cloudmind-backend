import { Schema, model } from 'mongoose'
import { baseToJSON } from '../utils/model'

export interface IIntegration {
  key: string
  name: string
  enabled: boolean
  config?: Record<string, unknown>
}

export interface ISetting {
  key: string // luôn = 'global' (singleton)
  general: { appName: string; supportEmail: string; language: string; maintenance: boolean }
  ai: { chatModel: string; embedModel: string; features: { search: boolean; chat: boolean; summarize: boolean; suggest: boolean }; monthlyQuotaFree: number }
  limits: { maxUploadMB: number; rateLimitPerMin: number }
  security: { enforce2fa: boolean; sessionTimeoutMins: number; ipAllowlist: string[] }
  integrations: IIntegration[]
  createdAt: Date
  updatedAt: Date
}

const settingSchema = new Schema<ISetting>(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    general: {
      appName: { type: String, default: 'CloudMind' },
      supportEmail: { type: String, default: 'support@cloudmind.vn' },
      language: { type: String, default: 'vi' },
      maintenance: { type: Boolean, default: false },
    },
    ai: {
      chatModel: { type: String, default: 'gemini-2.0-flash' },
      embedModel: { type: String, default: 'gemini-embedding-001' },
      features: {
        search: { type: Boolean, default: true },
        chat: { type: Boolean, default: true },
        summarize: { type: Boolean, default: true },
        suggest: { type: Boolean, default: true },
      },
      monthlyQuotaFree: { type: Number, default: 20 },
    },
    limits: {
      maxUploadMB: { type: Number, default: 1024 },
      rateLimitPerMin: { type: Number, default: 120 },
    },
    security: {
      enforce2fa: { type: Boolean, default: false },
      sessionTimeoutMins: { type: Number, default: 43200 },
      ipAllowlist: { type: [String], default: [] },
    },
    integrations: {
      type: [
        {
          _id: false,
          key: String,
          name: String,
          enabled: { type: Boolean, default: false },
          config: Schema.Types.Mixed,
        },
      ],
      default: [],
    },
  },
  { timestamps: true, toJSON: baseToJSON },
)

export const Setting = model<ISetting>('Setting', settingSchema)
