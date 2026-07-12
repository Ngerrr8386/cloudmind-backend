/* Test M4 (Gói cước & Thanh toán PayOS). PayOS chưa cấu hình → checkout 503;
   kích hoạt gói (handlePaidOrder) test trực tiếp như khi webhook báo đã trả tiền. */
import { connectDB, disconnectDB } from '../config/db'
import { User } from '../models/User'
import { Plan } from '../models/Plan'
import { Subscription } from '../models/Subscription'
import { Transaction } from '../models/Transaction'
import { ensureDefaultPlans } from '../modules/billing/plans.seed'
import { handlePaidOrder } from '../modules/billing/billing.service'
import { logger } from '../utils/logger'

const BASE = `http://localhost:${process.env.PORT || 4100}/api/v1`
const GB = 1024 * 1024 * 1024
let pass = 0
let fail = 0
function check(name: string, cond: boolean, extra = ''): void {
  if (cond) { pass++; logger.info(`✅ ${name} ${extra}`) }
  else { fail++; logger.error(`❌ ${name} ${extra}`) }
}
async function api(path: string, opts: RequestInit = {}, token?: string): Promise<{ status: number; body: any }> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(opts.headers ?? {}) },
  })
  return { status: res.status, body: (await res.json().catch(() => ({}))) as any }
}

async function main(): Promise<void> {
  await connectDB()
  await ensureDefaultPlans()

  const lr = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'minhanh@gmail.com', password: 'Demo@12345' }) })
  const token = lr.body.data.accessToken as string
  const userId = lr.body.data.user.id as string

  // 1) Danh sách gói (công khai)
  const plansNoAuth = await api('/plans')
  check('GET /plans công khai (không cần token)', plansNoAuth.status === 200 && plansNoAuth.body.data.length >= 3, `(${plansNoAuth.body.data?.length} gói)`)
  const pro = plansNoAuth.body.data.find((p: any) => p.key === 'pro')
  check('gói Pro có giá + popular', pro?.priceMonthly === 99000 && pro?.popular === true)

  // 2) Subscription hiện tại (mặc định free)
  await Subscription.deleteOne({ owner: userId }) // đảm bảo trạng thái sạch
  const sub0 = await api('/subscription', {}, token)
  check('GET /subscription → free mặc định', sub0.status === 200 && sub0.body.data.isFree === true, `(${sub0.body.data?.planKey})`)

  // 3) Checkout → 503 (PayOS chưa cấu hình)
  const co = await api('/subscription/checkout', { method: 'POST', body: JSON.stringify({ planKey: 'pro' }) }, token)
  check('checkout → 503 (PayOS off)', co.status === 503, `(status ${co.status})`)

  // 4) Checkout gói free → 400
  const coFree = await api('/subscription/checkout', { method: 'POST', body: JSON.stringify({ planKey: 'free' }) }, token)
  check('checkout gói free → 400 (validation)', coFree.status === 400)

  // 5) Kích hoạt gói khi "đã thanh toán" (giả lập webhook/sync)
  const orderCode = Date.now() * 1000 + 7
  await Transaction.create({ owner: userId, orderCode, planKey: 'pro', amount: 99000, seats: 1, periodMonths: 1, status: 'pending', description: 'CloudMind Pro' })
  const okPaid = await handlePaidOrder(orderCode)
  check('handlePaidOrder thành công', okPaid === true)
  check('handlePaidOrder idempotent (gọi lại OK)', (await handlePaidOrder(orderCode)) === true)

  // 6) Subscription giờ là pro active
  const sub1 = await api('/subscription', {}, token)
  check('subscription → pro active', sub1.body.data.planKey === 'pro' && sub1.body.data.status === 'active' && !!sub1.body.data.currentPeriodEnd)

  // 7) User cập nhật plan + storage
  const u = await User.findById(userId)
  check('user.plan = Pro, storage = 500GB', u?.plan === 'Pro' && u?.storageTotal === 500 * GB, `(${u?.plan}, ${Math.round((u?.storageTotal ?? 0) / GB)}GB)`)

  // 8) Hoá đơn
  const inv = await api('/billing/invoices', {}, token)
  const myInvoice = (inv.body.data ?? []).find((i: any) => i.orderCode === orderCode)
  check('GET /billing/invoices có hoá đơn', !!myInvoice && myInvoice.invoiceNo === `INV-${orderCode}`, `(${inv.body.data?.length} hoá đơn)`)
  const invOne = await api(`/billing/invoices/${myInvoice.id}`, {}, token)
  check('GET /billing/invoices/:id', invOne.status === 200 && invOne.body.data.amount === 99000)

  // 9) Huỷ gói
  const cancel = await api('/subscription/cancel', { method: 'POST' }, token)
  check('POST /subscription/cancel → canceled, autoRenew false', cancel.status === 200 && cancel.body.data.status === 'canceled' && cancel.body.data.autoRenew === false)

  // Cleanup: trả minhanh về trạng thái seed
  await Subscription.deleteOne({ owner: userId })
  await Transaction.deleteMany({ owner: userId })
  await User.findByIdAndUpdate(userId, { plan: 'Pro', storageTotal: 500 * GB })

  logger.info(`\n=== KẾT QUẢ M4: ${pass} pass / ${fail} fail ===`)
  await disconnectDB()
  process.exit(fail === 0 ? 0 : 1)
}

main().catch((err) => { logger.error({ err }, 'Test M4 lỗi'); process.exit(1) })
