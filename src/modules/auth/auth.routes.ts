import { Router } from 'express'
import * as c from './auth.controller'
import { validate } from '../../middleware/validate'
import { requireAuth } from '../../middleware/auth'
import { authLimiter } from '../../middleware/rateLimit'
import {
  registerSchema,
  loginSchema,
  googleSchema,
  changePasswordSchema,
  verifyEmailSchema,
  emailOnlySchema,
  resetPasswordSchema,
} from './auth.validators'

const router = Router()

router.post('/register', authLimiter, validate(registerSchema), c.register)
router.post('/verify-email', authLimiter, validate(verifyEmailSchema), c.verifyEmail)
router.post('/resend-otp', authLimiter, validate(emailOnlySchema), c.resendVerification)
router.post('/login', authLimiter, validate(loginSchema), c.login)
router.post('/google', authLimiter, validate(googleSchema), c.google)
router.post('/forgot-password', authLimiter, validate(emailOnlySchema), c.forgotPassword)
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), c.resetPassword)
router.post('/refresh', c.refresh)
router.post('/logout', c.logout)
router.post('/logout-all', requireAuth, c.logoutAll)
router.get('/me', requireAuth, c.me)
router.post('/change-password', requireAuth, validate(changePasswordSchema), c.changePassword)

export default router
