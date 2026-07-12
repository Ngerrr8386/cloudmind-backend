import { env } from '../../config/env'

const BRAND = '#4f46e5'
const INK = '#0f172a'
const MUTED = '#64748b'
const BORDER = '#e2e8f0'
const BG = '#f1f5f9'

/**
 * Layout email chuẩn (table-based, CSS inline) — tương thích Gmail/Outlook,
 * có preheader, và cấu trúc tối giản để giảm khả năng vào spam.
 */
function layout(opts: { preheader: string; heading: string; bodyHtml: string }): string {
  const year = new Date().getFullYear()
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${env.APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:${BG};">
<span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;mso-hide:all;">${opts.preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border:1px solid ${BORDER};border-radius:16px;overflow:hidden;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;">
  <tr>
    <td style="background:${BRAND};padding:22px 28px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">☁️ ${env.APP_NAME}</td>
      </tr></table>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 28px 8px;">
      <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:${INK};font-weight:700;">${opts.heading}</h1>
      ${opts.bodyHtml}
    </td>
  </tr>
  <tr>
    <td style="padding:24px 28px 28px;border-top:1px solid ${BORDER};">
      <p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};">
        Email được gửi tự động từ ${env.APP_NAME}. Vui lòng không trả lời email này.<br>
        © ${year} ${env.APP_NAME}. Bảo lưu mọi quyền.
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

/** Email chứa mã OTP (xác thực đăng ký hoặc đặt lại mật khẩu). */
export function otpEmail(opts: { code: string; purpose: 'verify' | 'reset'; minutes: number; name?: string }): RenderedEmail {
  const isVerify = opts.purpose === 'verify'
  const heading = isVerify ? 'Xác thực địa chỉ email của bạn' : 'Đặt lại mật khẩu'
  const intro = isVerify
    ? `Chào ${opts.name || 'bạn'}, cảm ơn bạn đã đăng ký ${env.APP_NAME}. Nhập mã bên dưới để hoàn tất xác thực:`
    : `Bạn vừa yêu cầu đặt lại mật khẩu. Nhập mã bên dưới để tiếp tục:`
  const subject = isVerify ? `Mã xác thực ${env.APP_NAME}: ${opts.code}` : `Mã đặt lại mật khẩu ${env.APP_NAME}: ${opts.code}`

  const codeBoxes = opts.code
    .split('')
    .map(
      (d) =>
        `<td style="padding:0 4px;"><div style="width:44px;height:54px;line-height:54px;text-align:center;font-size:26px;font-weight:800;color:${BRAND};background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;">${d}</div></td>`,
    )
    .join('')

  const bodyHtml = `
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${MUTED};">${intro}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px;"><tr>${codeBoxes}</tr></table>
    <p style="margin:0 0 6px;font-size:13px;line-height:1.6;color:${MUTED};">Mã có hiệu lực trong <strong style="color:${INK};">${opts.minutes} phút</strong>.</p>
    <p style="margin:0;font-size:13px;line-height:1.6;color:${MUTED};">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email — tài khoản của bạn vẫn an toàn.</p>`

  const text = [
    heading,
    '',
    intro.replace(/<[^>]+>/g, ''),
    '',
    `Mã của bạn: ${opts.code}`,
    `Hiệu lực: ${opts.minutes} phút.`,
    '',
    'Nếu bạn không yêu cầu, hãy bỏ qua email này.',
    `— ${env.APP_NAME}`,
  ].join('\n')

  return { subject, html: layout({ preheader: `Mã của bạn là ${opts.code} (hết hạn sau ${opts.minutes} phút)`, heading, bodyHtml }), text }
}

/** Email mời tham gia workspace. */
export function inviteEmail(opts: { workspaceName: string; inviterName: string; acceptUrl: string }): RenderedEmail {
  const heading = `Lời mời tham gia "${opts.workspaceName}"`
  const subject = `${opts.inviterName} mời bạn vào ${opts.workspaceName} trên ${env.APP_NAME}`
  const bodyHtml = `
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${MUTED};"><strong style="color:${INK};">${opts.inviterName}</strong> mời bạn cùng cộng tác trong không gian làm việc <strong style="color:${INK};">${opts.workspaceName}</strong> trên ${env.APP_NAME}.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;"><tr><td style="border-radius:10px;background:${BRAND};">
      <a href="${opts.acceptUrl}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Chấp nhận lời mời</a>
    </td></tr></table>
    <p style="margin:0;font-size:13px;line-height:1.6;color:${MUTED};">Nếu bạn không mong đợi lời mời này, hãy bỏ qua email.</p>`
  const text = [
    heading,
    '',
    `${opts.inviterName} mời bạn vào "${opts.workspaceName}" trên ${env.APP_NAME}.`,
    `Chấp nhận: ${opts.acceptUrl}`,
    '',
    'Nếu không mong đợi, hãy bỏ qua email này.',
  ].join('\n')
  return { subject, html: layout({ preheader: `${opts.inviterName} mời bạn vào ${opts.workspaceName}`, heading, bodyHtml }), text }
}
