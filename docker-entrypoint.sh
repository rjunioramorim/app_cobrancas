#!/bin/sh
set -e

echo "🚀 Executando Prisma Migrate..."
npx prisma migrate deploy

echo "🌱 Executando Prisma Seed..."
npx prisma db seed || echo "⚠️ Seed já executado ou não configurado."

echo "✅ Iniciando a aplicação..."
exec node server.js
