import { getGenerativeModel, getEmbeddingModel, isGeminiReady } from '../../config/gemini'
import { env } from '../../config/env'
import { AiUsage, type AiFeature } from '../../models/AiUsage'
import { ApiError } from '../../utils/ApiError'
import { logger } from '../../utils/logger'

export { isGeminiReady }

async function logUsage(
  owner: string | undefined,
  feature: AiFeature,
  model: string,
  inputTokens: number,
  outputTokens: number,
  latencyMs: number,
): Promise<void> {
  try {
    await AiUsage.create({ owner, feature, model, inputTokens, outputTokens, latencyMs })
  } catch (err) {
    logger.warn({ err }, 'Không ghi được aiUsage')
  }
}

/** Vector embedding cho một đoạn văn bản. */
export async function embedText(text: string, feature: AiFeature, owner?: string): Promise<number[]> {
  const model = getEmbeddingModel() // ném 503 nếu chưa cấu hình Gemini
  const t0 = Date.now()
  const res = await model.embedContent(text)
  await logUsage(owner, feature, env.GEMINI_EMBED_MODEL, Math.ceil(text.length / 4), 0, Date.now() - t0)
  return res.embedding.values
}

/** Sinh văn bản tự do. */
export async function generateText(prompt: string, feature: AiFeature, owner?: string): Promise<string> {
  const model = getGenerativeModel()
  const t0 = Date.now()
  const res = await model.generateContent(prompt)
  const usage = res.response.usageMetadata
  await logUsage(owner, feature, env.GEMINI_MODEL, usage?.promptTokenCount ?? 0, usage?.candidatesTokenCount ?? 0, Date.now() - t0)
  return res.response.text()
}

/** Sinh JSON có cấu trúc (insights, gợi ý, điểm chính...). */
export async function generateJSON<T>(prompt: string, feature: AiFeature, owner?: string): Promise<T> {
  const model = getGenerativeModel()
  const t0 = Date.now()
  const res = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' },
  })
  const usage = res.response.usageMetadata
  await logUsage(owner, feature, env.GEMINI_MODEL, usage?.promptTokenCount ?? 0, usage?.candidatesTokenCount ?? 0, Date.now() - t0)
  try {
    return JSON.parse(res.response.text()) as T
  } catch {
    throw new ApiError(502, 'AI_PARSE', 'AI trả về định dạng JSON không hợp lệ')
  }
}

export interface ModerationResult {
  flagged: boolean
  category: string
  reason: string
}

/**
 * Kiểm duyệt nội dung văn bản bằng AI. Trả flagged=false (an toàn) nếu chưa cấu hình
 * Gemini hoặc khi có lỗi — KHÔNG chặn upload, chỉ gắn cờ để admin xem xét.
 */
export async function moderateText(text: string, owner?: string): Promise<ModerationResult> {
  const safe: ModerationResult = { flagged: false, category: 'none', reason: '' }
  if (!isGeminiReady()) return safe
  const snippet = text.replace(/\s+/g, ' ').trim().slice(0, 6000)
  if (!snippet) return safe
  const prompt = [
    'Bạn là bộ kiểm duyệt nội dung của một nền tảng lưu trữ tài liệu. Phân loại đoạn văn bản dưới đây có VI PHẠM chính sách không.',
    'Các loại vi phạm: sexual (khiêu dâm/đồi truỵ), violence (bạo lực cực đoan), hate (thù ghét/kỳ thị), harassment (quấy rối), dangerous_illegal (ma tuý, vũ khí, tự hại, hoạt động bất hợp pháp).',
    'Tài liệu công việc/học tập/tin tức bình thường KHÔNG phải vi phạm.',
    'CHỈ trả JSON đúng dạng: {"flagged": boolean, "category": "sexual|violence|hate|harassment|dangerous_illegal|none", "reason": "lý do ngắn gọn bằng tiếng Việt"}.',
    '',
    '=== NỘI DUNG ===',
    snippet,
  ].join('\n')
  try {
    const r = await generateJSON<ModerationResult>(prompt, 'moderation', owner)
    return { flagged: Boolean(r?.flagged), category: r?.category ?? 'none', reason: r?.reason ?? '' }
  } catch {
    return safe
  }
}
