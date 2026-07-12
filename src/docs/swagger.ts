import { Router } from 'express'
import swaggerUi from 'swagger-ui-express'
import { openapiDocument } from './openapi.generated'

const router = Router()

/** Spec thô (JSON) — dùng cho client codegen / import Postman. */
router.get('/openapi.json', (_req, res) => {
  res.json(openapiDocument)
})

/** Giao diện Swagger UI tương tác. */
router.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(openapiDocument, {
    customSiteTitle: 'CloudMind API Docs',
    swaggerOptions: { persistAuthorization: true, docExpansion: 'none', filter: true },
  }),
)

export default router
