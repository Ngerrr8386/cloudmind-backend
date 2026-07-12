import { Schema, model } from 'mongoose'
import { baseToJSON } from '../utils/model'

export type PlanKey = 'free' | 'pro' | 'team'
export type PricingModel = 'flat' | 'per_seat'

export interface IPlan {
  key: PlanKey
  name: string
  tagline: string
  priceMonthly: number // VND
  priceYearly: number // VND (1 năm)
  currency: string
  storageBytes: number
  pricingModel: PricingModel
  /** Số ghế kèm sẵn khi mua gói tính-theo-ghế (per_seat); cũng là số ghế tối thiểu. Gói flat: bỏ qua. */
  includedSeats: number
  aiMonthlyQuota: number // -1 = không giới hạn
  features: string[]
  active: boolean
  popular: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

const planSchema = new Schema<IPlan>(
  {
    key: { type: String, enum: ['free', 'pro', 'team'], required: true, unique: true },
    name: { type: String, required: true },
    tagline: { type: String, default: '' },
    priceMonthly: { type: Number, default: 0 },
    priceYearly: { type: Number, default: 0 },
    currency: { type: String, default: 'VND' },
    storageBytes: { type: Number, required: true },
    pricingModel: { type: String, enum: ['flat', 'per_seat'], default: 'flat' },
    includedSeats: { type: Number, default: 1, min: 1 },
    aiMonthlyQuota: { type: Number, default: -1 },
    features: { type: [String], default: [] },
    active: { type: Boolean, default: true },
    popular: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: baseToJSON },
)

export const Plan = model<IPlan>('Plan', planSchema)

const GB = 1024 ** 3
const TB = 1024 ** 4

/** Gói mặc định (khớp trang giá frontend). */
export const DEFAULT_PLANS: Partial<IPlan>[] = [
  {
    key: 'free', name: 'Free', tagline: 'Bắt đầu miễn phí', priceMonthly: 0, priceYearly: 0,
    storageBytes: 15 * GB, pricingModel: 'flat', aiMonthlyQuota: 20, sortOrder: 1,
    features: ['15 GB lưu trữ', 'Tìm kiếm cơ bản', '20 lượt AI/tháng'],
  },
  {
    key: 'pro', name: 'Pro', tagline: 'Cho cá nhân chuyên nghiệp', priceMonthly: 99000, priceYearly: 990000,
    storageBytes: 500 * GB, pricingModel: 'flat', aiMonthlyQuota: -1, popular: true, sortOrder: 2,
    features: ['500 GB lưu trữ', 'AI không giới hạn', 'Tóm tắt & gợi ý thư mục'],
  },
  {
    key: 'team', name: 'Team', tagline: 'Cả nhóm cùng thông minh', priceMonthly: 249000, priceYearly: 2490000,
    storageBytes: 2 * TB, pricingModel: 'per_seat', includedSeats: 1, aiMonthlyQuota: -1, sortOrder: 3,
    features: ['2 TB/thành viên', 'Workspace chung', 'Phân quyền & nhật ký'],
  },
]
