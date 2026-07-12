import { Schema, model, Types } from 'mongoose'
import { baseToJSON } from '../utils/model'
import type { PlanKey } from './Plan'

export type TxStatus = 'pending' | 'paid' | 'canceled' | 'failed' | 'expired' | 'refunded'

export interface ITransaction {
  owner: Types.ObjectId
  orderCode: number
  planKey: PlanKey
  kind: 'plan' | 'seats'
  amount: number
  currency: string
  seats: number
  periodMonths: number
  status: TxStatus
  description: string
  payosPaymentLinkId?: string
  checkoutUrl?: string
  qrCode?: string
  invoiceNo?: string
  paidAt?: Date
  createdAt: Date
  updatedAt: Date
}

const transactionSchema = new Schema<ITransaction>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderCode: { type: Number, required: true, unique: true, index: true },
    planKey: { type: String, required: true },
    kind: { type: String, enum: ['plan', 'seats'], default: 'plan', index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'VND' },
    seats: { type: Number, default: 1 },
    periodMonths: { type: Number, default: 1 },
    status: { type: String, enum: ['pending', 'paid', 'canceled', 'failed', 'expired', 'refunded'], default: 'pending', index: true },
    description: { type: String, default: '' },
    payosPaymentLinkId: { type: String },
    checkoutUrl: { type: String },
    qrCode: { type: String },
    invoiceNo: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true, toJSON: baseToJSON },
)

export const Transaction = model<ITransaction>('Transaction', transactionSchema)
