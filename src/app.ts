import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import pinoHttp from 'pino-http'
import { corsOrigins } from './config/env'
import { logger } from './utils/logger'
import apiRoutes from './routes'
import docsRouter from './docs/swagger'
import { apiLimiter } from './middleware/rateLimit'
import { notFound } from './middleware/notFound'
import { errorHandler } from './middleware/error'

const app = express()

app.set('trust proxy', 1)
app.disable('x-powered-by')

app.use(helmet())
app.use(cors({ origin: corsOrigins, credentials: true }))
app.use(compression())
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/v1/health' } }))

// Root
app.get('/', (_req, res) => {
  res.json({ name: 'CloudMind API', version: 'v1', health: '/api/v1/health' })
})
// LB health (không qua rate-limit)
app.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }))

// Tài liệu API (Swagger UI + spec) — không qua rate-limit
app.use('/api/v1', docsRouter)

// API v1
app.use('/api/v1', apiLimiter, apiRoutes)

// 404 + error
app.use(notFound)
app.use(errorHandler)

export default app
