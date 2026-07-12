# syntax=docker/dockerfile:1

# =========================================================
#  CloudMind Backend — multi-stage build
#  Node 22 LTS · Debian slim (an toàn cho firebase-admin/grpc)
#  Tất cả dependency đều pure-JS (bcryptjs, pdf-parse, mammoth,
#  xlsx...) nên KHÔNG cần toolchain build native.
# =========================================================

# ----------------------------
# Stage 1 — builder (TypeScript -> dist)
# ----------------------------
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Cài full deps (gồm devDependencies) để chạy tsc
COPY package.json package-lock.json ./
RUN npm ci

# Build mã nguồn: src -> dist (tsc theo tsconfig.json)
COPY tsconfig.json ./
COPY src ./src
RUN npm run build \
  # Loại bỏ devDependencies khỏi node_modules -> chỉ còn deps production
  && npm prune --omit=dev

# ----------------------------
# Stage 2 — runtime (chỉ chạy, không có công cụ build)
# ----------------------------
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=4100
WORKDIR /app

# dumb-init: làm PID 1, forward SIGTERM/SIGINT cho Node
# -> kích hoạt graceful shutdown (server.close + disconnectDB) trong server.ts
RUN apt-get update \
  && apt-get install -y --no-install-recommends dumb-init \
  && rm -rf /var/lib/apt/lists/*

# Lấy artifact đã build + node_modules đã prune từ builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

# Chạy dưới user không phải root (image node có sẵn user "node")
USER node

EXPOSE 4100

# Health check qua endpoint /api/v1/health (đã loại khỏi rate-limit).
# Dùng fetch có sẵn trong Node 22 -> không cần cài curl/wget.
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4100)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
