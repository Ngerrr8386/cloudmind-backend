import { GoogleGenerativeAI } from '@google/generative-ai'
import { env, geminiConfigured } from './env'
import { logger } from '../utils/logger'
import { ApiError } from '../utils/ApiError'

let client: GoogleGenerativeAI | null = null

/** Khởi tạo Gemini client. Bỏ qua nếu thiếu API key. */
export function initGemini(): void {
  if (!geminiConfigured) {
    logger.warn('⚠️  GEMINI_API_KEY chưa cấu hình — các tính năng AI sẽ bị tắt')
    return
  }
  if (client) return
  client = new GoogleGenerativeAI(env.GEMINI_API_KEY as string)
  logger.info('✅ Gemini client đã khởi tạo')
}

export const isGeminiReady = (): boolean => client !== null

/** Model sinh văn bản (hỏi đáp, tóm tắt, gợi ý...). */
export function getGenerativeModel(model = env.GEMINI_MODEL) {
  if (!client) throw ApiError.unavailable('Dịch vụ AI (Gemini) chưa được cấu hình')
  return client.getGenerativeModel({ model })
}

/** Model embedding cho tìm kiếm ngữ nghĩa / RAG. */
export function getEmbeddingModel() {
  if (!client) throw ApiError.unavailable('Dịch vụ AI (Gemini) chưa được cấu hình')
  return client.getGenerativeModel({ model: env.GEMINI_EMBED_MODEL })
}
