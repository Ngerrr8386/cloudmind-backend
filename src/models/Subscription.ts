import { Schema, model, Types } from 'mongoose'
import { baseToJSON } from '../utils/model'
import type { PlanKey } from './Plan'

export type SubStatus = 'active' | 'canceled' | 'pending' | 'expired'

export interface ISubscription {
  owner: Types.ObjectId
  planKey: PlanKey
  status: SubStatus
  seats: number
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  autoRenew: boolean
  lastOrderCode?: number
  createdAt: Date
  updatedAt: Date
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    planKey: { type: String, required: true },
    status: { type: String, enum: ['active', 'canceled', 'pending', 'expired'], default: 'active' },
    seats: { type: Number, default: 1 },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    autoRenew: { type: Boolean, default: true },
    lastOrderCode: { type: Number },
  },
  { timestamps: true, toJSON: baseToJSON },
)

export const Subscription = model<ISubscription>('Subscription', subscriptionSchema)
