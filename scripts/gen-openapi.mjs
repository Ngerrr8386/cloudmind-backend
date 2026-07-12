/* Sinh OpenAPI 3 spec từ API_ENDPOINTS.md → src/docs/openapi.generated.ts */
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { dirname } from 'path'

const ROOT = new URL('..', import.meta.url).pathname
const MD = ROOT + 'API_ENDPOINTS.md'
const OUT = ROOT + 'src/docs/openapi.generated.ts'

// Request body mẫu cho vài endpoint quan trọng (đẹp hơn khi "Try it out")
const BODY_OVERRIDES = {
  'POST /auth/register': { email: 'ban@email.com', password: 'MatKhau@123', name: 'Tên của bạn' },
  'POST /auth/login': { email: 'ban@email.com', password: 'MatKhau@123' },
  'POST /auth/google': { idToken: '<firebase-id-token>' },
  'POST /auth/verify-email': { email: 'ban@email.com', code: '123456' },
  'POST /auth/forgot-password': { email: 'ban@email.com' },
  'POST /auth/reset-password': { email: 'ban@email.com', code: '123456', newPassword: 'MatKhauMoi@123' },
  'POST /subscription/checkout': { planKey: 'pro', seats: 1, months: 1 },
  'POST /files/upload-url': { fileName: 'tai-lieu.pdf', contentType: 'application/pdf', size: 12345 },
  'POST /ai/search': { query: 'kiến trúc RAG là gì', mode: 'semantic' },
}

const md = readFileSync(MD, 'utf8')
const lines = md.split('\n')

const tags = []
const tagSeen = new Set()
let currentTag = 'Chung'

const paths = {}
let count = 0

const ENDPOINT_RE = /^- \[[ x]\]\s+(.*)$/
const METHOD_RE = /\*\*(GET|POST|PATCH|PUT|DELETE)\*\*\s+`([^`]+)`/

function cleanTag(raw) {
  return raw.replace(/`[^`]*`/g, '').replace(/🆕/g, '').replace(/[*_]/g, '').trim()
}
function cleanText(raw) {
  return raw.replace(/`/g, '').replace(/\*\*/g, '').replace(/🆕/g, '').replace(/~~/g, '').trim()
}

for (const line of lines) {
  const h = line.match(/^##\s+\d+\.\s+(.+)$/)
  if (h) {
    currentTag = cleanTag(h[1])
    if (!tagSeen.has(currentTag)) { tagSeen.add(currentTag); tags.push({ name: currentTag }) }
    continue
  }
  if (line.includes('~~')) continue // bỏ endpoint N/A (gạch ngang)
  const m = line.match(ENDPOINT_RE)
  if (!m) continue
  const rest = m[1]
  const mm = rest.match(METHOD_RE)
  if (!mm) continue

  const method = mm[1].toLowerCase()
  let path = mm[2]
  if (!path.startsWith('/')) continue

  const isPublic = rest.includes('🌐') && !rest.includes('👤') && !rest.includes('🛡️')
  const isAdmin = path.startsWith('/admin/')
  const descPart = rest.split('—').slice(1).join('—')
  const summary = cleanText(descPart) || cleanText(rest)

  // :param -> {param}
  const params = []
  const oaPath = path.replace(/:([A-Za-z0-9_]+)/g, (_x, name) => {
    params.push(name)
    return `{${name}}`
  })

  const op = {
    tags: [currentTag],
    summary,
    security: isPublic ? [] : [{ bearerAuth: [] }],
    responses: {
      [method === 'post' ? '201' : '200']: { description: 'Thành công', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
      '400': { $ref: '#/components/responses/Error' },
      ...(isPublic ? {} : { '401': { $ref: '#/components/responses/Error' } }),
      ...(isAdmin ? { '403': { $ref: '#/components/responses/Error' } } : {}),
    },
  }
  if (params.length) {
    op.parameters = params.map((name) => ({ name, in: 'path', required: true, schema: { type: 'string' } }))
  }
  if (['post', 'patch', 'put'].includes(method)) {
    const override = BODY_OVERRIDES[`${mm[1]} ${path}`]
    op.requestBody = {
      required: Boolean(override),
      content: { 'application/json': { schema: { type: 'object' }, ...(override ? { example: override } : {}) } },
    }
  }

  if (!paths[oaPath]) paths[oaPath] = {}
  paths[oaPath][method] = op
  count++
}

const doc = {
  openapi: '3.0.3',
  info: {
    title: 'CloudMind API',
    version: '1.0.0',
    description: 'API CloudMind — Node.js · MongoDB · Firebase · Gemini · PayOS.\n\nXác thực: gửi header `Authorization: Bearer <accessToken>`. Lấy token qua `POST /auth/login` hoặc `POST /auth/verify-email`.',
  },
  servers: [
    { url: '/api/v1', description: 'Tương đối (cùng host)' },
    { url: 'http://localhost:4100/api/v1', description: 'Local dev' },
  ],
  tags,
  paths,
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Success: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {},
          meta: { type: 'object', nullable: true, properties: { page: { type: 'integer' }, limit: { type: 'integer' }, total: { type: 'integer' } } },
        },
        required: ['success'],
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'object', properties: { code: { type: 'string' }, message: { type: 'string' }, details: {} } },
        },
        required: ['success', 'error'],
      },
    },
    responses: {
      Error: { description: 'Lỗi', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
    },
  },
}

const banner = '/* TỰ ĐỘNG SINH từ API_ENDPOINTS.md bằng `npm run docs:gen` — KHÔNG sửa tay. */\n'
const body = `${banner}export const openapiDocument: Record<string, unknown> = ${JSON.stringify(doc, null, 2)}\n`
mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, body)
console.log(`✅ Sinh OpenAPI: ${count} endpoint · ${tags.length} tag · ${Object.keys(paths).length} path → ${OUT.replace(ROOT, '')}`)
