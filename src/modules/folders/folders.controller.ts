import * as svc from './folders.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { ok, created } from '../../utils/response'

export const list = asyncHandler(async (req, res) => {
  const q = req.query as unknown as { trashed?: boolean }
  ok(res, await svc.listFolders(req.user!.id, { trashed: q.trashed }))
})

export const tree = asyncHandler(async (req, res) => {
  ok(res, await svc.folderTree(req.user!.id))
})

export const create = asyncHandler(async (req, res) => {
  created(res, await svc.createFolder(req.user!.id, req.body))
})

export const get = asyncHandler(async (req, res) => {
  ok(res, await svc.getFolder(req.user!.id, req.params.id))
})

export const update = asyncHandler(async (req, res) => {
  ok(res, await svc.updateFolder(req.user!.id, req.params.id, req.body))
})

export const remove = asyncHandler(async (req, res) => {
  await svc.deleteFolder(req.user!.id, req.params.id)
  ok(res, { message: 'Đã chuyển thư mục vào thùng rác' })
})

export const restore = asyncHandler(async (req, res) => {
  ok(res, await svc.restoreFolder(req.user!.id, req.params.id))
})

export const permanent = asyncHandler(async (req, res) => {
  await svc.permanentDeleteFolder(req.user!.id, req.params.id)
  ok(res, { message: 'Đã xoá vĩnh viễn thư mục' })
})
