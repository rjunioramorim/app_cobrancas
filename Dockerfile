# Dockerfile para Next.js 16
FROM node:20-alpine AS base

#########################
# DEPENDÊNCIAS
#########################
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

#########################
# BUILDER
#########################
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desabilita telemetria
ENV NEXT_TELEMETRY_DISABLED=1

# Gera o Prisma Client antes do build
RUN npx prisma generate

# Executa migrations e seed durante o build
# Nota: DATABASE_URL deve estar disponível durante o build
RUN npx prisma migrate deploy || echo "⚠️ Migrations já aplicadas ou DATABASE_URL não configurado."
RUN npx prisma db seed || echo "⚠️ Seed já executado ou não configurado."

# Build do Next.js (standalone)
RUN npm run build

#########################
# RUNNER
#########################
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Usuário seguro
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

EXPOSE 3000

USER nextjs

CMD ["node", "server.js"]
