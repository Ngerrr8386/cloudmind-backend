import { Plan, type IPlan } from '../../models/Plan'
import { Subscription } from '../../models/Subscription'
import { Transaction } from '../../models/Transaction'
import { User } from '../../models/User'
import { ApiError } from '../../utils/ApiError'
import { getPayos } from '../../config/payos'
import { env } from '../../config/env'
import { logger } from '../../utils/logger'
import { ensureWorkspaceForOwner } from '../workspaces/workspace.service'
import { notify } from '../notifications/notifications.service'

function amountFor(plan: IPlan, seats: number, months: number): number {
  // Năm (bội số 12): áp giá năm ưu đãi nếu có; phần lẻ tháng tính theo giá tháng.
  const years = Math.floor(months / 12)
  const extraMonths = months % 12
  const base =
    plan.priceYearly > 0
      ? plan.priceYearly * years + plan.priceMonthly * extraMonths
      : plan.priceMonthly * months
  return plan.pricingModel === 'per_seat' ? base * seats : base
}

function storageFor(plan: IPlan, seats: number): number {
  return plan.pricingModel === 'per_seat' ? plan.storageBytes * seats : plan.storageBytes
}

export async function listPlans() {
  const plans = await Plan.find({ active: true }).sort({ sortOrder: 1 }).lean()
  return plans.map((p) => ({ ...p, id: String(p._id), _id: undefined }))
}

export async function getSubscription(owner: string) {
  const sub = await Subscription.findOne({ owner }).lean()
  if (!sub) {
    const free = await Plan.findOne({ key: 'free' }).lean()
    return { status: 'active', planKey: 'free', seats: 1, autoRenew: false, currentPeriodEnd: null, isFree: true, plan: free }
  }
  const plan = await Plan.findOne({ key: sub.planKey }).lean()
  return {
    id: String(sub._id),
    status: sub.status,
    planKey: sub.planKey,
    seats: sub.seats,
    autoRenew: sub.autoRenew,
    currentPeriodStart: sub.currentPeriodStart,
    currentPeriodEnd: sub.currentPeriodEnd,
    isFree: sub.planKey === 'free',
    plan,
  }
}

/** Tạo phiên thanh toán PayOS cho một gói trả phí. */
export async function createCheckout(owner: string, input: { planKey: string; seats?: number; months?: number }) {
  const plan = await Plan.findOne({ key: input.planKey, active: true })
  if (!plan) throw ApiError.notFound('Gói cước không tồn tại')
  if (plan.priceMonthly <= 0) throw ApiError.badRequest('Gói miễn phí không cần thanh toán')

  // Gói tính-theo-ghế bắt đầu với số ghế kèm theo của gói (giá đã gồm N ghế này);
  // người mua có thể chọn nhiều hơn, nhưng không ít hơn số ghế kèm theo.
  const included = Math.max(1, plan.includedSeats || 1)
  const seats = plan.pricingModel === 'per_seat' ? Math.max(included, input.seats ?? included) : 1
  const months = input.months ?? 1
  const amount = amountFor(plan, seats, months)
  const orderCode = Date.now() * 1000 + Math.floor(Math.random() * 1000)
  const description = `CloudMind ${plan.name}`.slice(0, 25)

  const tx = await Transaction.create({
    owner, orderCode, planKey: plan.key, amount, seats, periodMonths: months, status: 'pending', description,
  })

  try {
    const link = await getPayos().paymentRequests.create({
      orderCode,
      amount,
      description,
      returnUrl: `${env.APP_URL}/billing/success?orderCode=${orderCode}`,
      cancelUrl: `${env.APP_URL}/billing/cancel?orderCode=${orderCode}`,
    })
    tx.payosPaymentLinkId = link.paymentLinkId
    tx.checkoutUrl = link.checkoutUrl
    tx.qrCode = link.qrCode
    await tx.save()
    return { orderCode, amount, planKey: plan.key, checkoutUrl: link.checkoutUrl, qrCode: link.qrCode }
  } catch (err) {
    tx.status = 'failed'
    await tx.save()
    throw err
  }
}

/** Tạo phiên PayOS để MUA THÊM ghế cho gói Team — prorated theo số ngày còn lại của kỳ. */
export async function createSeatCheckout(owner: string, newSeats: number) {
  const sub = await Subscription.findOne({ owner, planKey: 'team' })
  if (!sub || (sub.status !== 'active' && sub.status !== 'canceled')) {
    throw ApiError.badRequest('Không tìm thấy gói Team đang hoạt động để mua thêm ghế')
  }
  const plan = await Plan.findOne({ key: 'team', active: true })
  if (!plan) throw ApiError.notFound('Gói Team không tồn tại')

  const added = newSeats - sub.seats
  if (added <= 0) throw ApiError.badRequest('Số ghế mới phải lớn hơn số ghế hiện tại')

  // Prorate theo số ngày còn lại của kỳ hiện tại (giá tháng của gói per_seat là theo từng ghế).
  const now = Date.now()
  const end = sub.currentPeriodEnd ? sub.currentPeriodEnd.getTime() : now
  const remainingDays = Math.max(0, Math.ceil((end - now) / (24 * 60 * 60 * 1000)))
  const amount = Math.round(plan.priceMonthly * added * (remainingDays / 30))
  if (amount <= 0) throw ApiError.badRequest('Kỳ hiện tại sắp kết thúc — hãy chờ gia hạn rồi điều chỉnh ghế')

  const orderCode = Date.now() * 1000 + Math.floor(Math.random() * 1000)
  const description = `CloudMind Team +${added} ghe`.slice(0, 25)
  const tx = await Transaction.create({
    owner, orderCode, planKey: 'team', kind: 'seats', amount, seats: newSeats, periodMonths: 0, status: 'pending', description,
  })

  try {
    const link = await getPayos().paymentRequests.create({
      orderCode,
      amount,
      description,
      returnUrl: `${env.APP_URL}/billing/success?orderCode=${orderCode}`,
      cancelUrl: `${env.APP_URL}/billing/cancel?orderCode=${orderCode}`,
    })
    tx.payosPaymentLinkId = link.paymentLinkId
    tx.checkoutUrl = link.checkoutUrl
    tx.qrCode = link.qrCode
    await tx.save()
    return { orderCode, amount, addedSeats: added, checkoutUrl: link.checkoutUrl, qrCode: link.qrCode }
  } catch (err) {
    tx.status = 'failed'
    await tx.save()
    throw err
  }
}

/** Kích hoạt gói khi đơn đã thanh toán (idempotent). Dùng bởi webhook + sync. */
export async function handlePaidOrder(orderCode: number): Promise<boolean> {
  const tx = await Transaction.findOne({ orderCode })
  if (!tx) {
    logger.warn(`PayOS: không tìm thấy giao dịch cho orderCode ${orderCode}`)
    return false
  }
  if (tx.status === 'paid') return true // idempotent

  tx.status = 'paid'
  tx.paidAt = new Date()
  tx.invoiceNo = `INV-${orderCode}`
  await tx.save()

  const plan = await Plan.findOne({ key: tx.planKey })
  if (!plan) return true

  // Đơn MUA THÊM GHẾ: chỉ cập nhật số ghế + dung lượng, GIỮ NGUYÊN kỳ hạn hiện tại.
  if (tx.kind === 'seats') {
    await Subscription.updateOne({ owner: tx.owner }, { seats: tx.seats })
    await User.findByIdAndUpdate(tx.owner, { storageTotal: storageFor(plan, tx.seats) })
    try {
      await ensureWorkspaceForOwner(String(tx.owner), tx.seats)
    } catch (err) {
      logger.warn({ err }, 'Không đồng bộ được seat cho workspace')
    }
    await notify(String(tx.owner), {
      type: 'payment',
      title: 'Đã mua thêm ghế',
      message: `Số ghế nhóm đã cập nhật thành ${tx.seats}. Cảm ơn bạn!`,
      meta: { orderCode, seats: tx.seats },
    })
    logger.info(`💺 Cập nhật ${tx.seats} ghế cho user ${tx.owner} (order ${orderCode})`)
    return true
  }

  const now = new Date()
  const end = new Date(now.getTime() + tx.periodMonths * 30 * 24 * 60 * 60 * 1000)
  await Subscription.findOneAndUpdate(
    { owner: tx.owner },
    {
      owner: tx.owner,
      planKey: tx.planKey,
      status: 'active',
      seats: tx.seats,
      currentPeriodStart: now,
      currentPeriodEnd: end,
      autoRenew: true,
      lastOrderCode: orderCode,
    },
    { upsert: true },
  )
  await User.findByIdAndUpdate(tx.owner, { plan: plan.name, storageTotal: storageFor(plan, tx.seats) })

  // Gói Team → tự tạo/đồng bộ workspace cho chủ sở hữu
  if (plan.key === 'team') {
    try {
      await ensureWorkspaceForOwner(String(tx.owner), tx.seats)
    } catch (err) {
      logger.warn({ err }, 'Không tạo được workspace cho gói Team')
    }
  }

  await notify(String(tx.owner), {
    type: 'payment',
    title: 'Thanh toán thành công',
    message: `Đã kích hoạt gói ${plan.name}. Cảm ơn bạn!`,
    meta: { orderCode, plan: plan.key },
  })

  logger.info(`💳 Kích hoạt gói ${plan.name} cho user ${tx.owner} (order ${orderCode})`)
  return true
}

/** Đồng bộ trạng thái đơn từ PayOS (dùng khi không nhận được webhook, vd local dev). */
export async function syncOrder(owner: string, orderCode: number) {
  const tx = await Transaction.findOne({ owner, orderCode })
  if (!tx) throw ApiError.notFound('Không tìm thấy giao dịch')
  if (tx.status === 'paid') return { status: 'paid' as const }

  const info = await getPayos().paymentRequests.get(orderCode)
  const status = String((info as { status?: string }).status ?? '').toUpperCase()
  if (status === 'PAID') {
    await handlePaidOrder(orderCode)
    return { status: 'paid' as const }
  }
  if (status === 'CANCELLED' || status === 'EXPIRED') {
    tx.status = status === 'CANCELLED' ? 'canceled' : 'expired'
    await tx.save()
  }
  return { status: tx.status }
}

export async function cancelCheckout(owner: string, orderCode: number) {
  const tx = await Transaction.findOne({ owner, orderCode })
  if (!tx) throw ApiError.notFound('Không tìm thấy giao dịch')
  if (tx.status === 'pending') {
    try {
      await getPayos().paymentRequests.cancel(orderCode, 'Người dùng huỷ')
    } catch (err) {
      logger.warn({ err }, 'Không huỷ được link PayOS')
    }
    tx.status = 'canceled'
    await tx.save()
  }
  return { status: tx.status }
}

export async function cancelSubscription(owner: string) {
  const sub = await Subscription.findOne({ owner })
  if (!sub || sub.status !== 'active' || sub.planKey === 'free') {
    throw ApiError.badRequest('Không có gói trả phí đang hoạt động để huỷ')
  }
  sub.autoRenew = false
  sub.status = 'canceled' // vẫn dùng tới hết kỳ; không gia hạn
  await sub.save()
  return getSubscription(owner)
}

export async function listInvoices(owner: string) {
  const txs = await Transaction.find({ owner, status: 'paid' }).sort({ paidAt: -1 }).lean()
  return txs.map((t) => ({
    id: String(t._id),
    invoiceNo: t.invoiceNo,
    orderCode: t.orderCode,
    planKey: t.planKey,
    amount: t.amount,
    currency: t.currency,
    seats: t.seats,
    periodMonths: t.periodMonths,
    paidAt: t.paidAt,
    description: t.description,
  }))
}

export async function getInvoice(owner: string, id: string) {
  const t = await Transaction.findOne({ _id: id, owner, status: 'paid' }).lean()
  if (!t) throw ApiError.notFound('Không tìm thấy hoá đơn')
  return { ...t, id: String(t._id), _id: undefined }
}
