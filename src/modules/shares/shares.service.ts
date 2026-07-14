import { Share } from '../../models/Share'
import { File } from '../../models/File'
import { User } from '../../models/User'
import { ApiError } from '../../utils/ApiError'
import { createDownloadUrl } from '../files/storage.service'

/** Tra cứu share theo token công khai; ném lỗi nếu không tồn tại / hết hạn / file đã bị xoá. */
async function resolveShare(token: string) {
  const share = await Share.findOne({ token })
  if (!share) throw ApiError.notFound('Liên kết chia sẻ không tồn tại hoặc đã bị thu hồi')
  if (share.expiresAt && share.expiresAt.getTime() < Date.now()) {
    throw new ApiError(410, 'GONE', 'Liên kết chia sẻ đã hết hạn')
  }
  const file = await File.findById(share.file)
  if (!file || file.status === 'trashed') throw ApiError.notFound('Tài liệu không còn khả dụng')
  return { share, file }
}

/** Thông tin công khai của file được chia sẻ — KHÔNG lộ owner id, storageKey, workspace... */
export async function getSharedFile(token: string) {
  const { share, file } = await resolveShare(token)
  const owner = await User.findById(file.owner).select('name')
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    permission: share.permission,
    sharedBy: owner?.name ?? 'Người dùng CloudMind',
    sharedAt: share.createdAt,
    expiresAt: share.expiresAt ?? null,
    canDownload: !!file.storageKey,
  }
}

/** Link tải file được chia sẻ (signed URL, có hạn). */
export async function getSharedDownloadUrl(token: string) {
  const { file } = await resolveShare(token)
  if (!file.storageKey) throw ApiError.badRequest('Tài liệu chưa sẵn sàng để tải')
  const url = await createDownloadUrl(file.storageKey, file.name)
  return { url, name: file.name, expiresIn: 3600 }
}
