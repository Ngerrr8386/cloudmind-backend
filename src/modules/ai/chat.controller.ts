import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok, created } from '../../utils/response';
import * as chatService from './chat.service';

export const listConversations = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await chatService.listConversations(req.user!.id);
    ok(res, data);
  },
);

export const createConversation = asyncHandler(
  async (req: Request, res: Response) => {
    const conv = await chatService.createConversation(req.user!.id, req.body);
    created(res, conv);
  },
);

export const getConversation = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await chatService.getConversation(
      req.user!.id,
      req.params.id,
    );
    ok(res, data);
  },
);

export const sendMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const message = await chatService.sendMessage(
      req.user!.id,
      req.params.id,
      req.body,
    );
    ok(res, message);
  },
);

export const regenerateMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const message = await chatService.regenerateMessage(
      req.user!.id,
      req.params.id,
    );
    ok(res, message);
  },
);

export const deleteConversation = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await chatService.deleteConversation(
      req.user!.id,
      req.params.id,
    );
    ok(res, data);
  },
);

// SSE streaming — tự ghi stream, không dùng ok()/asyncHandler chuẩn.
export const streamMessage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (typeof (res as { flushHeaders?: () => void }).flushHeaders === 'function') {
    (res as { flushHeaders: () => void }).flushHeaders();
  }

  const owner = req.user!.id;
  const conversationId = req.params.id;
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  try {
    if (!q) {
      res.write(
        `data: ${JSON.stringify({ error: 'Thiếu nội dung câu hỏi (?q=)' })}\n\n`,
      );
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    const message = await chatService.sendMessage(owner, conversationId, {
      content: q,
    });

    res.write(
      `data: ${JSON.stringify({
        delta: message.content,
        sources: message.sources ?? [],
        messageId: String(message._id),
      })}\n\n`,
    );
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    const messageText =
      err instanceof Error ? err.message : 'Đã xảy ra lỗi khi xử lý câu hỏi';
    res.write(`data: ${JSON.stringify({ error: messageText })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
};
