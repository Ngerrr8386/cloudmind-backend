import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { aiLimiter } from '../../middleware/rateLimit';
import {
  createConversationSchema,
  conversationIdSchema,
  messageIdSchema,
  sendMessageSchema,
} from './chat.validators';
import * as chatController from './chat.controller';

const router = Router();

router.use(requireAuth);

router.get('/conversations', chatController.listConversations);

router.post(
  '/conversations',
  validate(createConversationSchema, 'body'),
  chatController.createConversation,
);

router.get(
  '/conversations/:id',
  validate(conversationIdSchema, 'params'),
  chatController.getConversation,
);

router.post(
  '/conversations/:id/messages',
  aiLimiter,
  validate(conversationIdSchema, 'params'),
  validate(sendMessageSchema, 'body'),
  chatController.sendMessage,
);

router.get(
  '/conversations/:id/stream',
  aiLimiter,
  validate(conversationIdSchema, 'params'),
  chatController.streamMessage,
);

router.post(
  '/messages/:id/regenerate',
  aiLimiter,
  validate(messageIdSchema, 'params'),
  chatController.regenerateMessage,
);

router.delete(
  '/conversations/:id',
  validate(conversationIdSchema, 'params'),
  chatController.deleteConversation,
);

export default router;
