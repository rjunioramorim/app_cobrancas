#!/bin/sh
set -e

echo "🚀 Starting application initialization..."

# Aguarda o banco de dados estar disponível
echo "⏳ Waiting for database to be ready..."
until npx prisma db push --skip-generate > /dev/null 2>&1 || [ $? -eq 0 ]; do
  echo "⏳ Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready!"

# Executa as migrations
echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

echo "✅ Migrations completed successfully!"

# Gera o Prisma Client (caso necessário)
echo "📦 Ensuring Prisma Client is generated..."
npx prisma generate

echo "🎉 Initialization complete! Starting Next.js server..."

# Inicia a aplicação
exec node server.js