import { Conversation } from '../../models/Conversation';
import { Message } from '../../models/Message';
import { ApiError } from '../../utils/ApiError';
import { getRelevantChunks } from './retrieval.service';
import { generateText } from './gemini.gateway';

export interface MessageSource {
  fileId: string;
  fileName: string;
  snippet: string;
  relevance: number;
}

interface RagChunk {
  fileId: string;
  fileName: string;
  text: string;
  relevance: number;
}

function buildPrompt(chunks: RagChunk[], question: string): string {
  const context = chunks.length
    ? chunks
        .map(
          (c, i) =>
            `[Đoạn ${i + 1} — Tệp: ${c.fileName}]\n${c.text}`,
        )
        .join('\n\n')
    : '(Không tìm thấy đoạn ngữ cảnh nào liên quan.)';

  return [
    'Bạn là trợ lý AI của CloudMind, hỗ trợ người dùng hỏi đáp về tài liệu của họ.',
    'Hãy CHỈ trả lời dựa trên các đoạn ngữ cảnh được cung cấp bên dưới (mỗi đoạn có kèm tên tệp nguồn).',
    'Nếu các đoạn ngữ cảnh không chứa đủ thông tin để trả lời, hãy nói rõ rằng bạn không tìm thấy thông tin trong tài liệu, không được bịa đặt.',
    'Luôn trả lời bằng tiếng Việt, ngắn gọn, rõ ràng và trích dẫn tên tệp khi phù hợp.',
    '',
    '=== NGỮ CẢNH ===',
    context,
    '',
    '=== CÂU HỎI ===',
    question,
    '',
    '=== TRẢ LỜI ===',
  ].join('\n');
}

function toSources(chunks: RagChunk[]): MessageSource[] {
  return chunks.map((c) => ({
    fileId: c.fileId,
    fileName: c.fileName,
    snippet: c.text.slice(0, 160),
    relevance: c.relevance,
  }));
}

export async function runRag(
  owner: string,
  question: string,
): Promise<{ answer: string; sources: MessageSource[] }> {
  const chunks = await getRelevantChunks(owner, question, 5);
  const prompt = buildPrompt(chunks, question);
  const answer = await generateText(prompt, 'chat', owner);
  return { answer, sources: toSources(chunks) };
}

export async function listConversations(owner: string) {
  const conversations = await Conversation.find({ owner }).sort({
    lastMessageAt: -1,
    createdAt: -1,
  });
  return conversations.map((c) => c.toJSON());
}

export async function createConversation(
  owner: string,
  input: { title?: string },
) {
  const conversation = await Conversation.create({
    owner,
    title: input.title?.trim() || 'Cuộc trò chuyện mới',
    messageCount: 0,
  });
  return conversation.toJSON();
}

export async function getConversation(owner: string, id: string) {
  const conversation = await Conversation.findOne({ _id: id, owner });
  if (!conversation) {
    throw ApiError.notFound('Không tìm thấy cuộc trò chuyện');
  }
  const messages = await Message.find({
    conversation: conversation._id,
    owner,
  }).sort({ createdAt: 1 });
  return {
    conversation: conversation.toJSON(),
    messages: messages.map((m) => m.toJSON()),
  };
}

export async function sendMessage(
  owner: string,
  id: string,
  input: { content: string },
) {
  const conversation = await Conversation.findOne({ _id: id, owner });
  if (!conversation) {
    throw ApiError.notFound('Không tìm thấy cuộc trò chuyện');
  }

  const content = input.content.trim();

  await Message.create({
    conversation: conversation._id,
    owner,
    role: 'user',
    content,
  });

  const { answer, sources } = await runRag(owner, content);

  const assistantMessage = await Message.create({
    conversation: conversation._id,
    owner,
    role: 'assistant',
    content: answer,
    sources,
  });

  conversation.lastMessageAt = new Date();
  conversation.messageCount = (conversation.messageCount || 0) + 2;
  await conversation.save();

  return assistantMessage.toJSON();
}

export async function regenerateMessage(owner: string, messageId: string) {
  const assistantMessage = await Message.findOne({
    _id: messageId,
    owner,
    role: 'assistant',
  });
  if (!assistantMessage) {
    throw ApiError.notFound('Không tìm thấy tin nhắn trợ lý');
  }

  const previousUser = await Message.findOne({
    conversation: assistantMessage.conversation,
    owner,
    role: 'user',
    createdAt: { $lt: assistantMessage.createdAt },
  }).sort({ createdAt: -1 });

  if (!previousUser) {
    throw ApiError.badRequest('Không tìm thấy câu hỏi của người dùng để tạo lại');
  }

  const { answer, sources } = await runRag(owner, previousUser.content);

  assistantMessage.content = answer;
  // Mongoose tự ép fileId string → ObjectId khi lưu
  assistantMessage.sources = sources as unknown as typeof assistantMessage.sources;
  await assistantMessage.save();

  return assistantMessage.toJSON();
}

export async function deleteConversation(owner: string, id: string) {
  const conversation = await Conversation.findOne({ _id: id, owner });
  if (!conversation) {
    throw ApiError.notFound('Không tìm thấy cuộc trò chuyện');
  }
  await Message.deleteMany({ conversation: conversation._id, owner });
  await conversation.deleteOne();
  return { message: 'Đã xoá' };
}
