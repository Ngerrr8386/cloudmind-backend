import crypto from 'crypto'
import type { FilterQuery } from 'mongoose'
import { File, type IFile } from '../../models/File'
import { Share } from '../../models/Share'
import { User } from '../../models/User'
import { ApiError } from '../../utils/ApiError'
import { inferFileType, toneForType } from '../../utils/fileType'
import {
  buildObjectPath,
  createUploadUrl,
  createDownloadUrl,
  saveObject,
  deleteObject,
} from './storage.service'
import { enqueueEmbedding, deleteEmbeddings } from '../ai/retrieval.service'

function toDTO(f: Record<string, unknown> & { _id: unknown }) {
  const { _id, __v, ...rest } = f
  return { id: String(_id), ...rest }
}

async function findOwned(owner: string, id: string) {
  const file = await File.findOne({ _id: id, owner })
  if (!file) throw ApiError.notFound('Không tìm thấy file')
  return file
}

/** Tăng/giảm dung lượng đã dùng; chặn nếu vượt hạn mức. */
async function applyStorageDelta(owner: string, delta: number): Promise<void> {
  if (delta === 0) return
  const user = await User.findById(owner)
  if (!user) throw ApiError.notFound('Không tìm thấy người dùng')
  if (delta > 0 && user.storageUsed + delta > user.storageTotal) {
    throw new ApiError(413, 'STORAGE_FULL', 'Vượt quá dung lượng lưu trữ của gói')
  }
  user.storageUsed = Math.max(0, user.storageUsed + delta)
  await user.save()
}

/* ----------------------------- Upload ----------------------------- */

export async function requestUploadUrl(
  owner: string,
  input: { fileName: string; contentType: string; size: number; folderId?: string | null; workspaceId?: string | null },
) {
  const type = inferFileType(input.fileName, input.contentType)
  const file = await File.create({
    owner,
    name: input.fileName,
    type,
    mimeType: input.contentType,
    size: input.size,
    folderId: input.folderId ?? null,
    workspaceId: input.workspaceId ?? null,
    tone: toneForType(type),
    status: 'pending',
  })
  const storageKey = buildObjectPath(owner, file.id, input.fileName)
  file.storageKey = storageKey
  await file.save()

  const uploadUrl = await createUploadUrl(storageKey, input.contentType)
  return { file: file.toJSON(), uploadUrl, storageKey, method: 'PUT' as const }
}

export async function confirmUpload(owner: string, id: string, size?: number) {
  const file = await findOwned(owner, id)
  if (file.status === 'ready') return file.toJSON() // idempotent
  if (typeof size === 'number') file.size = size
  if (!file.storageCounted) {
    await applyStorageDelta(owner, file.size)
    file.storageCounted = true
  }
  file.status = 'ready'
  await file.save()
  enqueueEmbedding(file.id, owner) // chạy nền: embedding cho tìm kiếm/RAG
  return file.toJSON()
}

export async function directUpload(
  owner: string,
  upload: { originalname: string; mimetype: string; buffer: Buffer; size: number },
  input: { folderId?: string | null; workspaceId?: string | null },
) {
  // multer giải mã tên file multipart theo latin1 → khôi phục UTF-8 (tên tiếng Việt).
  const originalname = Buffer.from(upload.originalname, 'latin1').toString('utf8')
  const type = inferFileType(originalname, upload.mimetype)
  const file = await File.create({
    owner,
    name: originalname,
    type,
    mimeType: upload.mimetype,
    size: upload.size,
    folderId: input.folderId ?? null,
    workspaceId: input.workspaceId ?? null,
    tone: toneForType(type),
    status: 'pending',
  })
  const storageKey = buildObjectPath(owner, file.id, originalname)
  await saveObject(storageKey, upload.buffer, upload.mimetype)
  await applyStorageDelta(owner, upload.size)
  file.storageKey = storageKey
  file.storageCounted = true
  file.status = 'ready'
  await file.save()
  enqueueEmbedding(file.id, owner) // chạy nền
  return file.toJSON()
}

/* ----------------------------- Đọc ----------------------------- */

export async function listFiles(
  owner: string,
  q: {
    folderId?: string
    type?: string
    starred?: boolean
    trashed?: boolean
    q?: string
    page: number
    limit: number
    sort: string
    order: 'asc' | 'desc'
  },
) {
  const filter: FilterQuery<IFile> = { owner }
  filter.status = q.trashed ? 'trashed' : { $ne: 'trashed' }
  if (q.folderId) filter.folderId = q.folderId
  if (q.type) filter.type = q.type
  if (q.starred) filter.starred = true
  if (q.q) filter.name = { $regex: q.q, $options: 'i' }

  const sort: Record<string, 1 | -1> = { [q.sort]: q.order === 'asc' ? 1 : -1 }
  const [items, total] = await Promise.all([
    File.find(filter).sort(sort).skip((q.page - 1) * q.limit).limit(q.limit).lean(),
    File.countDocuments(filter),
  ])
  return { items: items.map((f) => toDTO(f as never)), total }
}

export async function getFile(owner: string, id: string) {
  return (await findOwned(owner, id)).toJSON()
}

export async function getDownloadUrl(owner: string, id: string) {
  const file = await findOwned(owner, id)
  if (!file.storageKey || file.status === 'pending') throw ApiError.badRequest('File chưa tải lên xong')
  const url = await createDownloadUrl(file.storageKey, file.name)
  return { url, expiresIn: 3600 }
}

export async function getPreviewUrl(owner: string, id: string) {
  const file = await findOwned(owner, id)
  if (!file.storageKey || file.status === 'pending') throw ApiError.badRequest('File chưa tải lên xong')
  const url = await createDownloadUrl(file.storageKey) // inline (không attachment)
  return { url, expiresIn: 3600 }
}

/* ----------------------------- Sửa ----------------------------- */

export async function patchFile(
  owner: string,
  id: string,
  input: { name?: string; folderId?: string | null; tags?: string[]; tone?: string },
) {
  const file = await findOwned(owner, id)
  if (input.name !== undefined) file.name = input.name
  if (input.folderId !== undefined) file.set('folderId', input.folderId)
  if (input.tags !== undefined) file.tags = input.tags
  if (input.tone !== undefined) file.set('tone', input.tone)
  await file.save()
  return file.toJSON()
}

export async function toggleStar(owner: string, id: string) {
  const file = await findOwned(owner, id)
  file.starred = !file.starred
  await file.save()
  return { id: file.id, starred: file.starred }
}

/* ----------------------------- Chia sẻ ----------------------------- */

export async function createShare(
  owner: string,
  id: string,
  input: { permission: 'view' | 'edit'; expiresInDays?: number },
) {
  const file = await findOwned(owner, id)
  const token = crypto.randomBytes(16).toString('hex')
  const share = await Share.create({
    file: file._id,
    owner,
    token,
    permission: input.permission,
    expiresAt: input.expiresInDays ? new Date(Date.now() + input.expiresInDays * 86400000) : null,
  })
  file.shared = true
  await file.save()
  return { ...share.toJSON(), link: `/share/${token}` }
}

export async function listShares(owner: string, id: string) {
  await findOwned(owner, id)
  const shares = await Share.find({ file: id, owner }).sort({ createdAt: -1 }).lean()
  return shares.map((s) => toDTO(s as never))
}

export async function revokeShare(owner: string, id: string, shareId: string): Promise<void> {
  const file = await findOwned(owner, id)
  await Share.deleteOne({ _id: shareId, file: id, owner })
  const remaining = await Share.countDocuments({ file: id })
  if (remaining === 0) {
    file.shared = false
    await file.save()
  }
}

/* ----------------------------- Xoá / Khôi phục ----------------------------- */

export async function trashFile(owner: string, id: string) {
  const file = await findOwned(owner, id)
  file.status = 'trashed'
  file.trashedAt = new Date()
  await file.save()
  return { id: file.id, status: file.status }
}

export async function restoreFile(owner: string, id: string) {
  const file = await findOwned(owner, id)
  file.status = file.storageKey ? 'ready' : 'pending'
  file.trashedAt = null
  await file.save()
  return { id: file.id, status: file.status }
}

export async function permanentDelete(owner: string, id: string): Promise<void> {
  const file = await findOwned(owner, id)
  await deleteObject(file.storageKey)
  if (file.storageCounted) await applyStorageDelta(owner, -file.size)
  await Share.deleteMany({ file: id })
  await deleteEmbeddings(id)
  await file.deleteOne()
}

/* ----------------------------- Hàng loạt ----------------------------- */

export async function bulk(
  owner: string,
  input: { ids: string[]; action: 'trash' | 'restore' | 'delete' | 'star' | 'unstar' | 'move'; folderId?: string | null },
) {
  const filter = { _id: { $in: input.ids }, owner }
  switch (input.action) {
    case 'trash':
      await File.updateMany(filter, { $set: { status: 'trashed', trashedAt: new Date() } })
      break
    case 'restore':
      await File.updateMany(filter, { $set: { status: 'ready', trashedAt: null } })
      break
    case 'star':
      await File.updateMany(filter, { $set: { starred: true } })
      break
    case 'unstar':
      await File.updateMany(filter, { $set: { starred: false } })
      break
    case 'move':
      await File.updateMany(filter, { $set: { folderId: input.folderId ?? null } })
      break
    case 'delete': {
      const files = await File.find(filter)
      let freed = 0
      for (const f of files) {
        await deleteObject(f.storageKey)
        if (f.storageCounted) freed += f.size
      }
      await Share.deleteMany({ file: { $in: input.ids } })
      await Promise.all(input.ids.map((fid) => deleteEmbeddings(fid)))
      await File.deleteMany(filter)
      if (freed > 0) await applyStorageDelta(owner, -freed)
      break
    }
  }
  return { affected: input.ids.length, action: input.action }
}
