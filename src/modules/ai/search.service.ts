import { semanticSearch, storeEmbeddings, SemanticHit } from './retrieval.service';
import { File } from '../../models/File';
import { ApiError } from '../../utils/ApiError';
import type { SearchInput, ReindexInput } from './search.validators';

// Một số từ dừng tiếng Việt/Anh phổ biến để loại khỏi việc tách từ khoá.
const STOP_WORDS = new Set<string>([
  'là', 'và', 'của', 'cho', 'các', 'những', 'một', 'có', 'được', 'với',
  'trong', 'về', 'tài', 'liệu', 'nào', 'gì', 'thế', 'này', 'đó', 'khi',
  'theo', 'từ', 'đến', 'hay', 'hoặc', 'thì', 'mà', 'ở', 'ra', 'nói',
  'the', 'and', 'for', 'with', 'about', 'what', 'which', 'that', 'this',
  'how', 'are', 'was', 'were', 'from', 'into', 'document', 'file',
]);

// Tách vài từ khoá có ý nghĩa từ truy vấn (dùng cho matchedConcepts).
function extractConcepts(query: string): string[] {
  const seen = new Set<string>();
  const concepts: string[] = [];
  for (const raw of query.split(/[\s,;.!?()\[\]"'“”]+/)) {
    const word = raw.trim();
    if (word.length < 2) continue;
    const lower = word.toLowerCase();
    if (STOP_WORDS.has(lower)) continue;
    if (seen.has(lower)) continue;
    seen.add(lower);
    concepts.push(word);
    if (concepts.length >= 8) break;
  }
  return concepts;
}

// Thoát ký tự đặc biệt để dùng an toàn trong regex.
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface SearchResult {
  mode: SearchInput['mode'];
  count: number;
  results: SemanticHit[];
  matchedConcepts: string[];
}

// Tìm kiếm bằng regex trên tên file và aiSummary — KHÔNG dùng Gemini.
async function keywordSearch(
  owner: string,
  query: string,
  type: string | undefined,
  limit: number,
): Promise<SemanticHit[]> {
  const pattern = new RegExp(escapeRegex(query), 'i');
  const filter: Record<string, unknown> = {
    owner,
    status: 'ready',
    $or: [{ name: pattern }, { aiSummary: pattern }],
  };
  if (type) filter.type = type;

  const docs = await File.find(filter).limit(limit).lean();

  return docs.map((doc): SemanticHit => {
    const summary: string =
      typeof doc.aiSummary === 'string' ? doc.aiSummary : '';
    let snippet = '';
    if (summary) {
      const idx = summary.toLowerCase().indexOf(query.toLowerCase());
      if (idx >= 0) {
        const start = Math.max(0, idx - 60);
        snippet = summary.slice(start, start + 200).trim();
      } else {
        snippet = summary.slice(0, 200).trim();
      }
    }
    return {
      file: {
        id: String(doc._id),
        name: doc.name,
        type: doc.type,
        folderId: doc.folderId ? String(doc.folderId) : null,
        tone: doc.tone,
        size: doc.size,
      },
      relevance: 1,
      snippet,
    };
  });
}

export async function search(
  owner: string,
  input: SearchInput,
): Promise<SearchResult> {
  const { query, mode, type, limit } = input;
  const matchedConcepts = extractConcepts(query);

  let results: SemanticHit[];
  if (mode === 'keyword') {
    results = await keywordSearch(owner, query, type, limit);
  } else {
    // 'semantic' và 'hybrid' đều dùng tìm kiếm ngữ nghĩa.
    results = await semanticSearch(owner, query, { limit, type });
  }

  return {
    mode,
    count: results.length,
    results,
    matchedConcepts,
  };
}

// Danh sách gợi ý truy vấn tĩnh — không cần Gemini.
export function getSuggestions(): string[] {
  return [
    'Tài liệu nào nói về kiến trúc RAG?',
    'So sánh doanh thu Q1 và Q2',
    'Tóm tắt các ghi chú cuộc họp gần đây',
    'Tìm hợp đồng có điều khoản bảo mật',
    'Những file nào liên quan đến kế hoạch marketing?',
    'Báo cáo tài chính năm nay có gì đáng chú ý?',
    'Tìm tài liệu về quy trình tuyển dụng',
    'Có tài liệu nào hướng dẫn triển khai sản phẩm không?',
  ];
}

export interface ReindexResult {
  fileId: string;
  chunks: number;
}

export async function reindex(
  owner: string,
  input: ReindexInput,
): Promise<ReindexResult> {
  const { fileId } = input;

  const file = await File.findOne({ _id: fileId, owner }).lean();
  if (!file) {
    throw ApiError.notFound('Không tìm thấy file');
  }

  const chunks = await storeEmbeddings(fileId, owner);
  return { fileId, chunks };
}
