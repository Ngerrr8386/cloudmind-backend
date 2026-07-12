import { Router } from 'express'
import searchRoutes from './search.routes'
import chatRoutes from './chat.routes'
import summarizeRoutes from './summarize.routes'
import insightsRoutes from './insights.routes'
import suggestRoutes from './suggest.routes'

/** Gộp toàn bộ route AI dưới /ai. */
const router = Router()

router.use('/', searchRoutes) // /ai/search, /ai/search/suggestions, /ai/reindex
router.use('/chat', chatRoutes) // /ai/chat/...
router.use('/summarize', summarizeRoutes) // /ai/summarize/...
router.use('/insights', insightsRoutes) // /ai/insights/...
router.use('/', suggestRoutes) // /ai/suggest-folder

export default router
