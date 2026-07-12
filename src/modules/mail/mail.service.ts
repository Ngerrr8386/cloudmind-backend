import nodemailer, { type Transporter } from 'nodemailer'
import { env, mailConfigured } from '../../config/env'
import { logger } from '../../utils/logger'
import type { RenderedEmail } from './templates'

let transporter: Transporter | null = null

/** Khởi tạo SMTP transporter. Nếu chưa cấu hình → fallback log ra console (dev). */
export function initMailer(): void {
  if (!mailConfigured) {
    logger.warn('⚠️  SMTP chưa cấu hình — OTP/email sẽ log ra console (chế độ dev)')
    return
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE, // true cho cổng 465, false cho 587 (STARTTLS)
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  })
  logger.info('✅ SMTP mailer đã khởi tạo')
}

export const isMailerReady = (): boolean => transporter !== null

function fromAddress(): string {
  return env.SMTP_FROM || `${env.APP_NAME} <${env.SMTP_USER ?? 'no-reply@cloudmind.local'}>`
}

/**
 * Gửi email. Áp dụng các thực hành tốt để tránh spam:
 * có cả text + html, From hiển thị tên, Reply-To, List-Unsubscribe.
 */
export async function sendMail(to: string, email: RenderedEmail): Promise<void> {
  if (!transporter) {
    logger.info(`📧 [DEV email] → ${to} | ${email.subject}`)
    return
  }
  await transporter.sendMail({
    from: fromAddress(),
    to,
    subject: email.subject,
    text: email.text,
    html: email.html,
    replyTo: env.SMTP_FROM || env.SMTP_USER,
    headers: {
      'List-Unsubscribe': `<mailto:${env.SMTP_USER ?? 'no-reply@cloudmind.local'}?subject=unsubscribe>`,
      'X-Entity-Ref-ID': `${env.APP_NAME.toLowerCase()}-otp`,
    },
  })
  logger.info(`📧 Đã gửi email tới ${to}: ${email.subject}`)
}
