import { Router } from 'express'
import * as c from './shares.controller'

/** Truy cập file qua liên kết chia sẻ — CÔNG KHAI (không requireAuth). Mount tại /shares. */
const router = Router()

router.get('/:token', c.view)
router.get('/:token/download', c.download)

export default router
