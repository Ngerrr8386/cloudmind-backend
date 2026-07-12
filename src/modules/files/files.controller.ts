import type { Request } from 'express'
import * as svc from './files.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { ok, created } from '../../utils/response'
import { ApiError } from '../../utils/ApiError'

type ListQuery = {
  folderId?: string
  type?: string
  starred?: boolean
  trashed?: boolean
  q?: string
  page: number
  limit: number
  sort: string
  order: 'asc' | 'desc'
}

export const uploadUrl = asyncHandler(async (req, res) => {
  created(res, await svc.requestUploadUrl(req.user!.id, req.body))
})

export const confirm = asyncHandler(async (req, res) => {
  ok(res, await svc.confirmUpload(req.user!.id, req.params.id, req.body?.size))
})

export const directUpload = asyncHandler(async (req: Request, res) => {
  if (!req.file) throw ApiError.badRequest('Thiếu file (field "file")')
  const result = await svc.directUpload(req.user!.id, req.file, {
    folderId: req.body?.folderId,
    workspaceId: req.body?.workspaceId,
  })
  created(res, result)
})

export const list = asyncHandler(async (req, res) => {
  const q = req.query as unknown as ListQuery
  const { items, total } = await svc.listFiles(req.user!.id, q)
  ok(res, items, { page: q.page, limit: q.limit, total })
})

export const get = asyncHandler(async (req, res) => {
  ok(res, await svc.getFile(req.user!.id, req.params.id))
})

export const download = asyncHandler(async (req, res) => {
  ok(res, await svc.getDownloadUrl(req.user!.id, req.params.id))
})

export const preview = asyncHandler(async (req, res) => {
  ok(res, await svc.getPreviewUrl(req.user!.id, req.params.id))
})

export const patch = asyncHandler(async (req, res) => {
  ok(res, await svc.patchFile(req.user!.id, req.params.id, req.body))
})

export const star = asyncHandler(async (req, res) => {
  ok(res, await svc.toggleStar(req.user!.id, req.params.id))
})

export const share = asyncHandler(async (req, res) => {
  created(res, await svc.createShare(req.user!.id, req.params.id, req.body))
})

export const shares = asyncHandler(async (req, res) => {
  ok(res, await svc.listShares(req.user!.id, req.params.id))
})

export const revokeShare = asyncHandler(async (req, res) => {
  await svc.revokeShare(req.user!.id, req.params.id, req.params.shareId)
  ok(res, { message: 'Đã thu hồi chia sẻ' })
})

export const trash = asyncHandler(async (req, res) => {
  ok(res, await svc.trashFile(req.user!.id, req.params.id))
})

export const restore = asyncHandler(async (req, res) => {
  ok(res, await svc.restoreFile(req.user!.id, req.params.id))
})

export const permanent = asyncHandler(async (req, res) => {
  await svc.permanentDelete(req.user!.id, req.params.id)
  ok(res, { message: 'Đã xoá vĩnh viễn' })
})

export const bulk = asyncHandler(async (req, res) => {
  ok(res, await svc.bulk(req.user!.id, req.body))
})
