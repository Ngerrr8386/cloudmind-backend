import { z } from 'zod';

export const createConversationSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
});

export const conversationIdSchema = z.object({
  id: z.string().min(1, 'Thiếu id cuộc trò chuyện'),
});

export const messageIdSchema = z.object({
  id: z.string().min(1, 'Thiếu id tin nhắn'),
});

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1, 'Nội dung tin nhắn không được để trống'),
});

export const streamQuerySchema = z.object({
  q: z.string().trim().min(1, 'Thiếu nội dung câu hỏi (?q=)'),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
