import { Router } from 'express'
import multer from 'multer'
import * as c from './files.controller'
import { requireAuth } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import {
  uploadUrlSchema,
  confirmSchema,
  listFilesQuery,
  patchFileSchema,
  shareSchema,
  bulkSchema,
} from './files.validators'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1 GB
})

const router = Router()
router.use(requireAuth)

// Tạo file / upload
router.post('/upload-url', validate(uploadUrlSchema), c.uploadUrl)
router.post('/direct-upload', upload.single('file'), c.directUpload)
router.post('/bulk', validate(bulkSchema), c.bulk)

// Danh sách + chi tiết
router.get('/', validate(listFilesQuery, 'query'), c.list)
router.get('/:id', c.get)
router.get('/:id/download', c.download)
router.get('/:id/preview', c.preview)

// Thao tác
router.post('/:id/confirm', validate(confirmSchema), c.confirm)
router.patch('/:id', validate(patchFileSchema), c.patch)
router.post('/:id/star', c.star)

// Chia sẻ
router.post('/:id/share', validate(shareSchema), c.share)
router.get('/:id/shares', c.shares)
router.delete('/:id/share/:shareId', c.revokeShare)

// Xoá / khôi phục
router.post('/:id/restore', c.restore)
router.delete('/:id/permanent', c.permanent)
router.delete('/:id', c.trash)

export default router
