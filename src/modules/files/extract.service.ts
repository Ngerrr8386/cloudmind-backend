import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import pdfParse from 'pdf-parse/lib/pdf-parse.js'
import { logger } from '../../utils/logger'

const MAX_CHARS = 120_000

const TEXT_EXTS = new Set([
  'txt', 'md', 'markdown', 'csv', 'tsv', 'json', 'log', 'xml', 'html', 'htm', 'yaml', 'yml',
  'js', 'ts', 'tsx', 'jsx', 'py', 'java', 'go', 'rs', 'c', 'cpp', 'cs', 'rb', 'php', 'sql', 'sh', 'css',
])

function ext(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

function isTextLike(mimeType: string | undefined, e: string): boolean {
  return Boolean(mimeType?.startsWith('text/')) || mimeType === 'application/json' || TEXT_EXTS.has(e)
}

function isPdf(mimeType: string | undefined, e: string): boolean {
  return mimeType === 'application/pdf' || e === 'pdf'
}

function isDocx(mimeType: string | undefined, e: string): boolean {
  return e === 'docx' || Boolean(mimeType?.includes('wordprocessingml'))
}

function isSpreadsheet(mimeType: string | undefined, e: string): boolean {
  return ['xlsx', 'xls'].includes(e) || Boolean(mimeType?.includes('spreadsheetml')) || mimeType === 'application/vnd.ms-excel'
}

/** Có thể trích xuất nội dung văn bản được không (để quyết định tải file về). */
export function isExtractable(mimeType: string | undefined, name: string): boolean {
  const e = ext(name)
  return isTextLike(mimeType, e) || isPdf(mimeType, e) || isDocx(mimeType, e) || isSpreadsheet(mimeType, e)
}

function parseSpreadsheet(buffer: Buffer): string {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  return wb.SheetNames.map((sheet) => `# ${sheet}\n${XLSX.utils.sheet_to_csv(wb.Sheets[sheet])}`).join('\n\n')
}

/**
 * Trích xuất văn bản từ buffer theo loại file (PDF, Word, Excel, text/code).
 * Trả '' nếu không hỗ trợ hoặc lỗi → caller tự fallback metadata.
 */
export async function extractText(buffer: Buffer, mimeType: string | undefined, name: string): Promise<string> {
  const e = ext(name)
  try {
    if (isTextLike(mimeType, e)) {
      return buffer.toString('utf8').slice(0, MAX_CHARS)
    }
    if (isPdf(mimeType, e)) {
      const data = await pdfParse(buffer)
      return data.text.slice(0, MAX_CHARS)
    }
    if (isDocx(mimeType, e)) {
      const { value } = await mammoth.extractRawText({ buffer })
      return value.slice(0, MAX_CHARS)
    }
    if (isSpreadsheet(mimeType, e)) {
      return parseSpreadsheet(buffer).slice(0, MAX_CHARS)
    }
  } catch (err) {
    logger.warn({ err: err instanceof Error ? err.message : err }, `Không trích xuất được nội dung: ${name}`)
  }
  return ''
}
