import { Router } from 'express'
import multer from 'multer'
import * as c from './me.controller'
import { requireAuth } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { updateProfileSchema, aiSettingsSchema, appearanceSchema, twoFactorSchema } from './me.validators'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

const router = Router()
router.use(requireAuth)

router.get('/profile', c.getProfile)
router.patch('/profile', validate(updateProfileSchema), c.updateProfile)
router.post('/avatar', upload.single('avatar'), c.uploadAvatar)

router.get('/settings', c.getSettings)
router.patch('/settings/ai', validate(aiSettingsSchema), c.updateAiSettings)
router.patch('/settings/appearance', validate(appearanceSchema), c.updateAppearance)

router.get('/sessions', c.listSessions)
router.delete('/sessions/:id', c.revokeSession)

router.post('/2fa', validate(twoFactorSchema), c.toggle2fa)
router.delete('/account', c.deleteAccount)

export default router
