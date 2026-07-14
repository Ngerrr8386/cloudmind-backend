import { Types } from 'mongoose'
import { Folder } from '../../models/Folder'
import { File } from '../../models/File'
import { ApiError } from '../../utils/ApiError'
import type { Tone } from '../../utils/tones'

interface FolderWithStats {
  id: string
  name: string
  icon: string
  tone: string
  parentId: string | null
  workspaceId: string | null
  fileCount: number
  size: number
  trashedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/** Thống kê số file + dung lượng theo folder (không tính file đã xoá). */
async function folderStats(owner: string): Promise<Map<string, { count: number; size: number }>> {
  const rows = await File.aggregate<{ _id: Types.ObjectId | null; count: number; size: number }>([
    { $match: { owner: new Types.ObjectId(owner), status: { $ne: 'trashed' } } },
    { $group: { _id: '$folderId', count: { $sum: 1 }, size: { $sum: '$size' } } },
  ])
  return new Map(rows.map((r) => [String(r._id), { count: r.count, size: r.size }]))
}

export async function listFolders(
  owner: string,
  opts: { trashed?: boolean } = {},
): Promise<FolderWithStats[]> {
  const status = opts.trashed ? 'trashed' : 'active'
  const [folders, stats] = await Promise.all([
    Folder.find({ owner, status }).sort({ createdAt: 1 }).lean(),
    folderStats(owner),
  ])
  return folders.map((f) => {
    const s = stats.get(String(f._id))
    return {
      id: String(f._id),
      name: f.name,
      icon: f.icon,
      tone: f.tone,
      parentId: f.parentId ? String(f.parentId) : null,
      workspaceId: f.workspaceId ? String(f.workspaceId) : null,
      fileCount: s?.count ?? 0,
      size: s?.size ?? 0,
      trashedAt: f.trashedAt ?? null,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }
  })
}

export async function folderTree(owner: string) {
  const flat = await listFolders(owner)
  const byId = new Map(flat.map((f) => [f.id, { ...f, children: [] as unknown[] }]))
  const roots: unknown[] = []
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : null
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  return roots
}

export async function createFolder(
  owner: string,
  input: { name: string; icon?: string; tone?: string; parentId?: string | null; workspaceId?: string | null },
) {
  const folder = await Folder.create({
    owner,
    name: input.name,
    icon: input.icon,
    tone: input.tone,
    parentId: input.parentId ?? null,
    workspaceId: input.workspaceId ?? null,
  })
  return folder.toJSON()
}

async function findOwned(owner: string, id: string) {
  const folder = await Folder.findOne({ _id: id, owner })
  if (!folder) throw ApiError.notFound('Không tìm thấy thư mục')
  return folder
}

export async function getFolder(owner: string, id: string) {
  const folder = await findOwned(owner, id)
  const files = await File.find({ owner, folderId: id, status: { $ne: 'trashed' } })
    .sort({ updatedAt: -1 })
    .lean()
  return {
    folder: folder.toJSON(),
    files: files.map((f) => ({ ...f, id: String(f._id), _id: undefined })),
  }
}

export async function updateFolder(
  owner: string,
  id: string,
  input: { name?: string; icon?: string; tone?: string; parentId?: string | null },
) {
  const folder = await findOwned(owner, id)
  if (input.parentId === id) throw ApiError.badRequest('Không thể đặt thư mục làm cha của chính nó')
  if (input.name !== undefined) folder.name = input.name
  if (input.icon !== undefined) folder.icon = input.icon
  if (input.tone !== undefined) folder.tone = input.tone as Tone
  if (input.parentId !== undefined) folder.parentId = input.parentId ? new Types.ObjectId(input.parentId) : null
  await folder.save()
  return folder.toJSON()
}

/** Xoá mềm: đưa thư mục vào Thùng rác (có thể khôi phục). File & thư mục con giữ nguyên
 *  (thư mục con tạm hiển thị ở gốc cho tới khi khôi phục thư mục cha). */
export async function deleteFolder(owner: string, id: string): Promise<void> {
  const folder = await findOwned(owner, id)
  if (folder.status === 'trashed') return // idempotent
  folder.status = 'trashed'
  folder.trashedAt = new Date()
  await folder.save()
}

/** Khôi phục thư mục từ Thùng rác về đúng vị trí cũ (parentId giữ nguyên). */
export async function restoreFolder(owner: string, id: string) {
  const folder = await findOwned(owner, id)
  folder.status = 'active'
  folder.trashedAt = null
  await folder.save()
  return folder.toJSON()
}

/** Xoá vĩnh viễn: đưa file trong thư mục về gốc, reparent thư mục con lên cha, rồi xoá hẳn. */
export async function permanentDeleteFolder(owner: string, id: string): Promise<void> {
  const folder = await findOwned(owner, id)
  await File.updateMany({ owner, folderId: id }, { $set: { folderId: null } })
  await Folder.updateMany({ owner, parentId: id }, { $set: { parentId: folder.parentId ?? null } })
  await folder.deleteOne()
}
