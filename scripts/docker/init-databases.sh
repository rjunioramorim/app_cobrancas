#!/bin/bash
set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variáveis de ambiente com valores padrão
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-docker}
POSTGRES_HOST=${POSTGRES_HOST:-db}
POSTGRES_PORT=${POSTGRES_PORT:-5432}

COBRANCAS_DB=${POSTGRES_DB:-cobrancas_db}
N8N_DB=${N8N_DB_NAME:-n8n}
EVOLUTION_DB=${EVOLUTION_DB_NAME:-evolution}

echo -e "${YELLOW}⏳ Aguardando PostgreSQL estar pronto...${NC}"

# Aguarda o PostgreSQL estar pronto
until PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c '\q' 2>/dev/null; do
  echo -e "${YELLOW}   PostgreSQL ainda não está pronto, aguardando...${NC}"
  sleep 2
done

echo -e "${GREEN}✅ PostgreSQL está pronto!${NC}"

# Função para criar banco de dados se não existir
create_database_if_not_exists() {
  local db_name=$1
  local db_description=$2
  
  echo -e "${YELLOW}📊 Verificando banco de dados: ${db_name}${NC}"
  
  # Verifica se o banco já existe
  DB_EXISTS=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$db_name'" 2>/dev/null | tr -d ' ' || echo "0")
  
  if [ "$DB_EXISTS" = "1" ]; then
    echo -e "${GREEN}   ✓ Banco de dados '${db_name}' já existe${NC}"
  else
    echo -e "${YELLOW}   → Criando banco de dados '${db_name}'...${NC}"
    if PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE \"$db_name\";" >/dev/null 2>&1; then
      echo -e "${GREEN}   ✓ Banco de dados '${db_name}' criado com sucesso!${NC}"
    else
      echo -e "${RED}   ✗ Erro ao criar banco de dados '${db_name}'${NC}"
      # Tenta obter a mensagem de erro
      ERROR_MSG=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE \"$db_name\";" 2>&1 || true)
      echo -e "${RED}   Detalhes: ${ERROR_MSG}${NC}"
      exit 1
    fi
  fi
}

# Cria os bancos de dados
echo -e "\n${YELLOW}🔧 Iniciando criação dos bancos de dados...${NC}\n"

create_database_if_not_exists "$COBRANCAS_DB" "Aplicação principal"
create_database_if_not_exists "$N8N_DB" "n8n"
create_database_if_not_exists "$EVOLUTION_DB" "Evolution API"

echo -e "\n${GREEN}✅ Todos os bancos de dados estão prontos!${NC}\n"

# Lista os bancos criados
echo -e "${YELLOW}📋 Bancos de dados disponíveis:${NC}"
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "\l" | grep -E "($COBRANCAS_DB|$N8N_DB|$EVOLUTION_DB)" || true

echo -e "\n${GREEN}🎉 Inicialização concluída!${NC}"

