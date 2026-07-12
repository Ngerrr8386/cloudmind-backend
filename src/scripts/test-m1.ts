/* Test M1: OTP đăng ký/verify, reset mật khẩu, Hồ sơ & Cài đặt, avatar. */
import { writeFileSync } from 'fs'
import { connectDB, disconnectDB } from '../config/db'
import { User } from '../models/User'
import { OtpCode } from '../models/OtpCode'
import { otpEmail } from '../modules/mail/templates'
import { logger } from '../utils/logger'

const BASE = `http://localhost:${process.env.PORT || 4100}/api/v1`
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

  // 0) Render email mẫu (kiểm tra cấu trúc chống spam)
  const sample = otpEmail({ code: '482917', purpose: 'verify', minutes: 10, name: 'Minh Anh' })
  writeFileSync('/private/tmp/claude-501/-Volumes-RCAdvisor-CloudMind/e020b91f-21f7-41d0-9a4d-b96e4e70142f/scratchpad/sample-otp-email.html', sample.html)
  check('email có HTML + plain-text (multipart)', sample.html.length > 200 && sample.text.includes('482917'))
  check('email: doctype + preheader ẩn + subject chứa mã', sample.html.includes('<!doctype') && sample.html.includes('display:none') && sample.subject.includes('482917'))

  const email = `otptest.${Date.now()}@example.com`
  const PW = 'Test@12345'

  // 1) Đăng ký → gửi OTP (dev trả devOtp)
  const reg = await api('/auth/register', { method: 'POST', body: JSON.stringify({ email, password: PW, name: 'OTP Test' }) })
  check('register → requiresVerification + devOtp', reg.status === 201 && reg.body.data?.requiresVerification === true && /^\d{6}$/.test(reg.body.data?.devOtp ?? ''), `(status ${reg.status})`)
  const otp = reg.body.data.devOtp as string

  // 2) Login khi CHƯA verify → 403
  const loginBefore = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password: PW }) })
  check('login chưa verify → 403 EMAIL_NOT_VERIFIED', loginBefore.status === 403 && loginBefore.body.error?.code === 'EMAIL_NOT_VERIFIED')

  // 3) Verify sai mã → 400
  const badVerify = await api('/auth/verify-email', { method: 'POST', body: JSON.stringify({ email, code: '000000' }) })
  check('verify mã sai → 400', badVerify.status === 400)

  // 4) Verify đúng → cấp token
  const verify = await api('/auth/verify-email', { method: 'POST', body: JSON.stringify({ email, code: otp }) })
  check('verify đúng → access token', verify.status === 200 && !!verify.body.data?.accessToken)
  let token = verify.body.data.accessToken as string

  // 5) Login sau verify
  const loginAfter = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password: PW }) })
  check('login sau verify → 200', loginAfter.status === 200 && !!loginAfter.body.data?.accessToken)
  token = loginAfter.body.data.accessToken

  // 6) Hồ sơ
  const prof = await api('/me/profile', {}, token)
  check('GET /me/profile', prof.status === 200 && prof.body.data?.email === email)
  const patchProf = await api('/me/profile', { method: 'PATCH', body: JSON.stringify({ name: 'OTP Đã Đổi', bio: 'Xin chào' }) }, token)
  check('PATCH /me/profile', patchProf.body.data?.name === 'OTP Đã Đổi' && patchProf.body.data?.bio === 'Xin chào')

  // 7) Cài đặt
  const getSet = await api('/me/settings', {}, token)
  check('GET /me/settings có ai+appearance', !!getSet.body.data?.ai && !!getSet.body.data?.appearance)
  const ai = await api('/me/settings/ai', { method: 'PATCH', body: JSON.stringify({ autoSummarize: false }) }, token)
  check('PATCH settings/ai', ai.body.data?.ai?.autoSummarize === false)
  const ap = await api('/me/settings/appearance', { method: 'PATCH', body: JSON.stringify({ theme: 'dark', accent: 'emerald' }) }, token)
  check('PATCH settings/appearance', ap.body.data?.appearance?.theme === 'dark' && ap.body.data?.appearance?.accent === 'emerald')

  // 8) Sessions + 2FA
  const sess = await api('/me/sessions', {}, token)
  check('GET /me/sessions >= 1', Array.isArray(sess.body.data) && sess.body.data.length >= 1, `(${sess.body.data?.length})`)
  const tfa = await api('/me/2fa', { method: 'POST', body: JSON.stringify({ enabled: true }) }, token)
  check('POST /me/2fa enable', tfa.body.data?.twoFactorEnabled === true)

  // 9) Avatar (Firebase thật)
  const fd = new FormData()
  fd.append('avatar', new Blob([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])], { type: 'image/png' }), 'a.png')
  const av = await fetch(`${BASE}/me/avatar`, { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: fd })
  const avBody: any = await av.json().catch(() => ({}))
  check('POST /me/avatar → avatarUrl (Firebase)', av.status === 200 && typeof avBody.data?.avatarUrl === 'string', `(status ${av.status})`)

  // 10) Quên & đặt lại mật khẩu
  const forgot = await api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })
  check('forgot-password → devOtp', forgot.status === 200 && /^\d{6}$/.test(forgot.body.data?.devOtp ?? ''))
  const resetOtp = forgot.body.data.devOtp as string
  const NEWPW = 'New@99999'
  const reset = await api('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, code: resetOtp, newPassword: NEWPW }) })
  check('reset-password → 200', reset.status === 200)
  const loginNew = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password: NEWPW }) })
  check('login mật khẩu mới → 200', loginNew.status === 200)
  const loginOld = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password: PW }) })
  check('login mật khẩu cũ → 401', loginOld.status === 401)

  // 11) Xoá tài khoản
  const token2 = loginNew.body.data.accessToken as string
  const del = await api('/me/account', { method: 'DELETE' }, token2)
  check('DELETE /me/account', del.status === 200)
  const gone = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password: NEWPW }) })
  check('login sau khi xoá → 401', gone.status === 401)

  // Cleanup phòng hờ
  await User.deleteOne({ email })
  await OtpCode.deleteMany({ email })

  logger.info(`\n=== KẾT QUẢ M1: ${pass} pass / ${fail} fail ===`)
  await disconnectDB()
  process.exit(fail === 0 ? 0 : 1)
}

main().catch((err) => { logger.error({ err }, 'Test M1 lỗi'); process.exit(1) })
