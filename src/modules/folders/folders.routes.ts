import { Router } from 'express'
import * as c from './folders.controller'
import { requireAuth } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { createFolderSchema, updateFolderSchema, listFoldersQuery } from './folders.validators'

const router = Router()
router.use(requireAuth)

router.get('/', validate(listFoldersQuery, 'query'), c.list)
router.get('/tree', c.tree)
router.post('/', validate(createFolderSchema), c.create)
router.get('/:id', c.get)
router.patch('/:id', validate(updateFolderSchema), c.update)
router.post('/:id/restore', c.restore)
router.delete('/:id/permanent', c.permanent)
router.delete('/:id', c.remove)

export default router
