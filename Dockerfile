# -----------------------------
# 1) STAGE: deps
# -----------------------------
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY package.json package-lock.json* pnpm-lock.yaml* ./
COPY prisma ./prisma

RUN npm install

# -----------------------------
# 2) STAGE: builder
# -----------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Aceita DATABASE_URL como build arg
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Instala Prisma globalmente
RUN npm install -g prisma@^6.19.0

RUN apk add --no-cache libc6-compat openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gera o Prisma Client
RUN prisma generate

# Executa migrations durante o build
# Nota: DATABASE_URL deve estar disponível durante o build
RUN prisma migrate deploy || echo "⚠️ Migrations já aplicadas ou DATABASE_URL não configurado."

# Build do Next.js
RUN npm run build

# -----------------------------
# 3) STAGE: runner (produção)
# -----------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache libc6-compat openssl

# Instala Prisma globalmente no runner também (para possíveis comandos futuros)
RUN npm install -g prisma@^6.19.0

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.next/standalone ./

# Copia o entrypoint
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER appuser

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]

