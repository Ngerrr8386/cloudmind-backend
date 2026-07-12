import { Types } from 'mongoose';
import { File } from '../../models/File';
import { Summary } from '../../models/Summary';
import { Embedding } from '../../models/Embedding';
import { generateJSON } from './gemini.gateway';
import { ApiError } from '../../utils/ApiError';
import type { SummaryLength } from './summarize.validators';

interface EmbeddingChunk {
  text: string;
}

interface FileDoc {
  _id: Types.ObjectId;
  owner: string;
  name: string;
  aiSummary?: string;
  tags: string[];
  save: () => Promise<unknown>;
  aiProcessed?: boolean;
}

interface SummaryPayload {
  content: string;
  keyPoints: string[];
  keywords: string[];
}

const LENGTH_GUIDE: Record<SummaryLength, string> = {
  short: 'khoảng 2 câu ngắn gọn',
  medium: 'khoảng 1 đoạn văn',
  detailed: 'khoảng 3 đoạn văn chi tiết',
};

/**
 * Lấy File thuộc owner hoặc ném 404.
 */
async function getOwnedFile(owner: string, fileId: string): Promise<FileDoc> {
  if (!Types.ObjectId.isValid(fileId)) {
    throw ApiError.notFound('Không tìm thấy tệp');
  }
  const file = await File.findOne({ _id: fileId, owner });
  if (!file) {
    throw ApiError.notFound('Không tìm thấy tệp');
  }
  return file as unknown as FileDoc;
}

/**
 * Lấy nội dung văn bản để tóm tắt từ các embedding chunk, fallback về metadata.
 */
async function collectContent(owner: string, fileId: string, file: FileDoc): Promise<string> {
  const chunks = (await Embedding.find({ file: fileId, owner })
    .sort({ chunkIndex: 1 })
    .limit(25)
    .lean()) as unknown as EmbeddingChunk[];

  const text = chunks.map((c) => c.text).join(' ').trim();
  if (text) {
    return text;
  }

  const fallback = [file.name, file.aiSummary || '', (file.tags || []).join(' ')]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fallback;
}

function buildPrompt(length: SummaryLength, content: string): string {
  return [
    'Bạn là trợ lý tóm tắt tài liệu. Hãy đọc ngữ cảnh dưới đây và tóm tắt bằng tiếng Việt.',
    `Yêu cầu độ dài tóm tắt: ${LENGTH_GUIDE[length]}.`,
    'Trả về JSON với đúng cấu trúc sau (chỉ JSON, không thêm chú thích):',
    '{',
    '  "content": "phần tóm tắt theo độ dài yêu cầu",',
    '  "keyPoints": ["5 ý chính, mỗi ý một câu ngắn"],',
    '  "keywords": ["5 đến 8 từ khóa quan trọng"]',
    '}',
    'Tất cả nội dung trong JSON phải viết bằng tiếng Việt.',
    '',
    'NGỮ CẢNH:',
    content || '(Không có nội dung chi tiết, hãy tóm tắt dựa trên thông tin có sẵn.)',
  ].join('\n');
}

/**
 * Tạo (hoặc cập nhật) tóm tắt cho một tệp theo độ dài.
 * regenerate không thay đổi logic upsert (luôn ghi đè theo (file,length)),
 * nhưng được giữ để controller phân biệt ngữ nghĩa.
 */
export async function summarizeFile(
  owner: string,
  fileId: string,
  length: SummaryLength,
): Promise<Record<string, unknown>> {
  const file = await getOwnedFile(owner, fileId);
  const content = await collectContent(owner, fileId, file);

  const prompt = buildPrompt(length, content);
  const result = await generateJSON<SummaryPayload>(prompt, 'summarize', owner);

  const summaryContent = (result.content || '').trim();
  const keyPoints = Array.isArray(result.keyPoints) ? result.keyPoints.filter(Boolean) : [];
  const keywords = Array.isArray(result.keywords) ? result.keywords.filter(Boolean) : [];

  const summary = await Summary.findOneAndUpdate(
    { file: fileId, length },
    {
      file: fileId,
      owner,
      length,
      content: summaryContent,
      keyPoints,
      keywords,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  if (length === 'medium') {
    file.aiSummary = summaryContent;
    if (file.aiProcessed !== true) {
      file.aiProcessed = true;
    }
    await file.save();
  }

  return (summary as unknown as { toJSON: () => Record<string, unknown> }).toJSON();
}

/**
 * Lấy tóm tắt đã lưu theo độ dài; 404 nếu chưa có.
 */
export async function getSummary(
  owner: string,
  fileId: string,
  length: SummaryLength,
): Promise<Record<string, unknown>> {
  await getOwnedFile(owner, fileId);

  const summary = await Summary.findOne({ file: fileId, owner, length });
  if (!summary) {
    throw ApiError.notFound(
      `Chưa có bản tóm tắt cho độ dài "${length}". Hãy gọi POST để tạo tóm tắt mới.`,
    );
  }

  return (summary as unknown as { toJSON: () => Record<string, unknown> }).toJSON();
}
