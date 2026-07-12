import { File } from '../../models/File';
import { Folder } from '../../models/Folder';
import { generateJSON } from './gemini.gateway';
import { ApiError } from '../../utils/ApiError';
import type { SuggestFolderInput } from './suggest.validators';

export interface FolderSuggestion {
  folderId: string;
  folderName: string;
  confidence: number;
  reason: string;
}

interface SuggestFolderResult {
  suggestions: FolderSuggestion[];
}

interface FolderLean {
  _id: unknown;
  name: string;
  icon?: string;
  tone?: string;
  parentId?: unknown;
}

interface FileLean {
  name: string;
  aiSummary?: string;
  tags?: string[];
}

export async function suggestFolder(
  owner: string,
  input: SuggestFolderInput,
): Promise<SuggestFolderResult> {
  // 1. Lấy mô tả file.
  let description: string;

  if (input.fileId) {
    const file = await File.findOne({ _id: input.fileId, owner }).lean<FileLean>();
    if (!file) {
      throw ApiError.notFound('Không tìm thấy tệp tin');
    }
    const parts: string[] = [`Tên tệp: ${file.name}`];
    if (file.aiSummary) {
      parts.push(`Tóm tắt: ${file.aiSummary}`);
    }
    if (file.tags && file.tags.length > 0) {
      parts.push(`Thẻ: ${file.tags.join(', ')}`);
    }
    if (input.text) {
      parts.push(`Nội dung bổ sung: ${input.text}`);
    }
    description = parts.join('\n');
  } else {
    const parts: string[] = [];
    if (input.fileName) {
      parts.push(`Tên tệp: ${input.fileName}`);
    }
    if (input.text) {
      parts.push(`Nội dung: ${input.text}`);
    }
    description = parts.join('\n');
  }

  // 2. Lấy danh sách thư mục.
  const folders = await Folder.find({ owner }).lean<FolderLean[]>();
  if (folders.length === 0) {
    throw ApiError.badRequest('Bạn chưa có thư mục nào');
  }

  const folderList = folders
    .map((f) => `- id: ${String(f._id)} | tên: ${f.name}`)
    .join('\n');

  const validIds = new Set(folders.map((f) => String(f._id)));

  // 3. Gọi Gemini để gợi ý.
  const prompt = [
    'Bạn là trợ lý sắp xếp tệp tin thông minh.',
    'Dưới đây là danh sách các thư mục hiện có của người dùng (mỗi dòng gồm id và tên):',
    folderList,
    '',
    'Thông tin về tệp tin cần sắp xếp:',
    description,
    '',
    'Hãy chọn từ 1 đến 3 thư mục PHÙ HỢP NHẤT để lưu tệp tin này.',
    'CHỈ được chọn trong danh sách thư mục đã cho và phải trả về đúng folderId tương ứng.',
    'Với mỗi gợi ý, cung cấp confidence (số thực từ 0 đến 1) thể hiện mức độ phù hợp và một reason ngắn gọn bằng tiếng Việt giải thích lý do.',
    'Trả lời bằng tiếng Việt.',
    'Trả về JSON đúng định dạng: { "suggestions": [ { "folderId": string, "folderName": string, "confidence": number, "reason": string } ] }',
  ].join('\n');

  const result = await generateJSON<{ suggestions: FolderSuggestion[] }>(
    prompt,
    'suggest',
    owner,
  );

  const raw = Array.isArray(result?.suggestions) ? result.suggestions : [];

  // 4. Lọc bỏ folderId không hợp lệ, sort theo confidence desc.
  const suggestions = raw
    .filter((s) => s && validIds.has(String(s.folderId)))
    .map((s) => {
      const folder = folders.find((f) => String(f._id) === String(s.folderId));
      const confidence =
        typeof s.confidence === 'number' && Number.isFinite(s.confidence)
          ? Math.min(1, Math.max(0, s.confidence))
          : 0;
      return {
        folderId: String(s.folderId),
        folderName: folder ? folder.name : String(s.folderName ?? ''),
        confidence,
        reason: typeof s.reason === 'string' ? s.reason : '',
      };
    })
    .sort((a, b) => b.confidence - a.confidence);

  return { suggestions };
}
