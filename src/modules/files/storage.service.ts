import { getBucket, isFirebaseReady } from '../../config/firebase'

const WRITE_TTL_MS = 15 * 60 * 1000 // 15 phút
const READ_TTL_MS = 60 * 60 * 1000 // 1 giờ

function sanitize(name: string): string {
  return name.replace(/[^\w.\-]+/g, '_').slice(0, 120) || 'file'
}

/** Đường dẫn object trên Firebase Storage. */
export function buildObjectPath(ownerId: string, fileId: string, fileName: string): string {
  return `uploads/${ownerId}/${fileId}/${sanitize(fileName)}`
}

/** Signed URL để client PUT file trực tiếp lên Firebase. */
export async function createUploadUrl(objectPath: string, contentType: string): Promise<string> {
  const [url] = await getBucket()
    .file(objectPath)
    .getSignedUrl({ version: 'v4', action: 'write', expires: Date.now() + WRITE_TTL_MS, contentType })
  return url
}

/** Signed URL để tải/xem file. */
export async function createDownloadUrl(objectPath: string, downloadName?: string): Promise<string> {
  const [url] = await getBucket()
    .file(objectPath)
    .getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + READ_TTL_MS,
      ...(downloadName ? { responseDisposition: `attachment; filename="${encodeURIComponent(downloadName)}"` } : {}),
    })
  return url
}

/** Lưu trực tiếp buffer (luồng direct-upload qua BE). */
export async function saveObject(objectPath: string, buffer: Buffer, contentType: string): Promise<void> {
  await getBucket().file(objectPath).save(buffer, { contentType, resumable: false })
}

/** Xoá object khỏi Firebase (bỏ qua nếu chưa cấu hình hoặc không tồn tại). */
export async function deleteObject(objectPath?: string): Promise<void> {
  if (!objectPath || !isFirebaseReady()) return
  await getBucket().file(objectPath).delete({ ignoreNotFound: true })
}

/** Lưu buffer + trả signed read URL dài hạn (dùng cho avatar). v4 tối đa 7 ngày. */
export async function uploadAndSignedUrl(objectPath: string, buffer: Buffer, contentType: string, days = 6): Promise<string> {
  await getBucket().file(objectPath).save(buffer, { contentType, resumable: false })
  const [url] = await getBucket()
    .file(objectPath)
    .getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + days * 86400000 })
  return url
}

/** Xoá toàn bộ object theo prefix (dùng khi xoá tài khoản). */
export async function deleteByPrefix(prefix: string): Promise<void> {
  if (!isFirebaseReady()) return
  await getBucket().deleteFiles({ prefix, force: true })
}
