import * as svc from './shares.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { ok } from '../../utils/response'

/* Public — xem/tải file qua liên kết chia sẻ (không cần đăng nhập). */
export const view = asyncHandler(async (req, res) => {
  ok(res, await svc.getSharedFile(req.params.token))
})
export const download = asyncHandler(async (req, res) => {
  ok(res, await svc.getSharedDownloadUrl(req.params.token))
})
