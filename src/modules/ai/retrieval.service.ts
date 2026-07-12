import type { FilterQuery } from 'mongoose'
import { File, type IFile } from '../../models/File'
import { Embedding } from '../../models/Embedding'
import { embedText, moderateText } from './gemini.gateway'
import { cosineSimilarity } from '../../utils/cosine'
import { getBucket, isFirebaseReady } from '../../config/firebase'
import { extractText as extractFileContent, isExtractable } from '../files/extract.service'
import { logger } from '../../utils/logger'

/* --------------------------- Trích xuất & chunk --------------------------- */

interface ExtractableFile {
  name: string
  storageKey?: string
  mimeType?: string
  aiSummary?: string
  tags: string[]
}

async function extractText(file: ExtractableFile): Promise<string> {
  // Tải file từ Firebase và trích xuất toàn diện (PDF, Word, Excel, text/code)
  if (isFirebaseReady() && file.storageKey && isExtractable(file.mimeType, file.name)) {
    try {
      const [buf] = await getBucket().file(file.storageKey).download()
      const text = await extractFileContent(buf, file.mimeType, file.name)
      if (text.trim()) return text
    } catch (err) {
      logger.warn({ err }, 'Không tải/trích xuất được nội dung file')
    }
  }
  // Fallback metadata (ảnh/âm thanh/video, hoặc khi chưa cấu hình Firebase / không trích được)
  return [file.name, file.aiSummary, file.tags?.join(' ')].filter(Boolean).join('\n')
}

function chunkText(text: string, size = 1000, overlap = 150, max = 60): string[] {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (!clean) return []
  const chunks: string[] = []
  for (let i = 0; i < clean.length && chunks.length < max; i += size - overlap) {
    chunks.push(clean.slice(i, i + size))
  }
  return chunks
}

/* --------------------------- Tạo & xoá embedding --------------------------- */

export async function storeEmbeddings(fileId: string, owner: string): Promise<number> {
  const file = await File.findOne({ _id: fileId, owner })
  if (!file) return 0

  file.embedStatus = 'processing'
  await file.save()

  try {
    const text = await extractText(file)
    const chunks = chunkText(text)
    if (!chunks.length) {
      file.embedStatus = 'failed'
      await file.save()
      return 0
    }

    await Embedding.deleteMany({ file: fileId })
    const docs = []
    for (let i = 0; i < chunks.length; i++) {
      const vector = await embedText(chunks[i], 'embedding', owner)
      docs.push({ file: file._id, owner: file.owner, workspaceId: file.workspaceId ?? null, chunkIndex: i, text: chunks[i], vector })
    }
    await Embedding.insertMany(docs)
    file.aiProcessed = true
    file.embedStatus = 'done'
    file.embedChunks = docs.length

    // Kiểm duyệt nội dung tự động (không chặn upload): chỉ gắn cờ nếu đang 'clean',
    // KHÔNG ghi đè quyết định thủ công của admin (clean do admin đã duyệt vẫn giữ).
    try {
      if (file.moderationStatus === 'clean') {
        const mod = await moderateText(text, owner)
        if (mod.flagged) {
          file.moderationStatus = 'flagged'
          file.flagReason = `[AI] ${mod.category}: ${mod.reason}`.slice(0, 300)
          logger.warn(`🚩 File ${fileId} bị AI gắn cờ kiểm duyệt: ${mod.category}`)
        }
      }
    } catch {
      /* lỗi kiểm duyệt không được chặn embedding */
    }

    await file.save()
    return docs.length
  } catch (err) {
    // Đánh dấu thất bại (vd chưa cấu hình Gemini / lỗi trích xuất) rồi ném tiếp để enqueue log.
    file.embedStatus = 'failed'
    await file.save().catch(() => {})
    throw err
  }
}

/** Chạy nền — không chặn response upload. Lỗi (vd chưa cấu hình Gemini) chỉ log. */
export function enqueueEmbedding(fileId: string, owner: string): void {
  void storeEmbeddings(fileId, owner)
    .then((n) => n && logger.info(`🔎 Đã embed ${n} đoạn cho file ${fileId}`))
    .catch((err) => logger.warn(`Bỏ qua embedding file ${fileId}: ${err?.message ?? err}`))
}

export async function deleteEmbeddings(fileId: string): Promise<void> {
  await Embedding.deleteMany({ file: fileId })
}

/* --------------------------- Tìm kiếm ngữ nghĩa --------------------------- */

export interface SemanticHit {
  file: { id: string; name: string; type: string; folderId: string | null; tone: string; size: number }
  relevance: number
  snippet: string
}

export async function semanticSearch(
  owner: string,
  query: string,
  opts: { limit?: number; type?: string } = {},
): Promise<SemanticHit[]> {
  const qVec = await embedText(query, 'search', owner)
  const embs = await Embedding.find({ owner }).lean()

  const best = new Map<string, { score: number; text: string }>()
  for (const e of embs) {
    const score = cosineSimilarity(qVec, e.vector)
    const fid = String(e.file)
    const cur = best.get(fid)
    if (!cur || cur.score < score) best.set(fid, { score, text: e.text })
  }

  const fileFilter: FilterQuery<IFile> = { _id: { $in: [...best.keys()] }, status: 'ready' }
  if (opts.type) fileFilter.type = opts.type
  const files = await File.find(fileFilter).lean()
  const fmap = new Map(files.map((f) => [String(f._id), f]))

  return [...best.entries()]
    .filter(([fid]) => fmap.has(fid))
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, opts.limit ?? 10)
    .map(([fid, v]) => {
      const f = fmap.get(fid)!
      return {
        file: { id: fid, name: f.name, type: f.type, folderId: f.folderId ? String(f.folderId) : null, tone: f.tone, size: f.size },
        relevance: Math.round(v.score * 1000) / 1000,
        snippet: v.text.slice(0, 240),
      }
    })
}

/** Lấy top-k đoạn liên quan cho RAG. */
export async function getRelevantChunks(owner: string, query: string, k = 5) {
  const qVec = await embedText(query, 'chat', owner)
  const embs = await Embedding.find({ owner }).lean()
  if (!embs.length) return []

  // Chỉ dùng embedding của file còn 'ready' (loại file đã vào thùng rác/đã xoá)
  // — lọc TRƯỚC khi cắt top-k để không mất kết quả hợp lệ.
  const fileIds = [...new Set(embs.map((e) => String(e.file)))]
  const files = await File.find({ _id: { $in: fileIds }, status: 'ready' }).select('name').lean()
  const fmap = new Map(files.map((f) => [String(f._id), f.name]))

  const scored = embs
    .filter((e) => fmap.has(String(e.file)))
    .map((e) => ({ e, score: cosineSimilarity(qVec, e.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
  if (!scored.length) return []

  return scored.map((s) => ({
    fileId: String(s.e.file),
    fileName: fmap.get(String(s.e.file)) ?? 'Tài liệu',
    text: s.e.text,
    relevance: Math.round(s.score * 1000) / 1000,
  }))
}
