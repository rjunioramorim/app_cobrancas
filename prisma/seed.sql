-- ============================================================================
-- Script SQL equivalente ao seed do Prisma (prisma/seed.ts)
-- ============================================================================
-- 
-- COMO GERAR O HASH DA SENHA:
-- 1. No terminal do projeto, execute:
--    node -e "const bcrypt = require('bcrypt'); bcrypt.hash('SUA_SENHA', 10).then(h => console.log(h))"
--
-- 2. Ou use o script do projeto:
--    ADMIN_PASSWORD="sua_senha" npm run bootstrap:admin
--
-- 3. Copie o hash gerado e substitua 'SEU_HASH_BCRYPT_AQUI' abaixo
--
-- ============================================================================

-- Configurações (ajuste conforme necessário)
\set admin_email 'admin@admin.com'
\set admin_password_hash 'SEU_HASH_BCRYPT_AQUI'  -- ⚠️ SUBSTITUA pelo hash gerado com bcrypt
-- Exemplo de hash para senha "admin123": $2b$10$dODUr4BcsBdU9ISz1dR7veyBbd3lim8iIT6XXtXo2J110bo6g4wny

-- ============================================================================
-- 1. LIMPAR DADOS EXISTENTES (exceto o admin)
-- ============================================================================
-- Remove todas as cobranças
DELETE FROM cobrancas;

-- Remove todos os clientes
DELETE FROM clients;

-- Remove todos os usuários exceto o admin
DELETE FROM users WHERE email != :'admin_email';

-- ============================================================================
-- 2. CRIAR OU ATUALIZAR O USUÁRIO ADMIN
-- ============================================================================
-- Usa INSERT ... ON CONFLICT (upsert) para criar ou atualizar

INSERT INTO users (
    id,
    nome,
    email,
    password,
    role,
    "isActive",
    "mustChangePassword",
    "passwordChangedAt",
    "createdAt",
    "updatedAt"
)
VALUES (
    gen_random_uuid(),  -- Gera um novo UUID
    'Administrador',
    :'admin_email',
    :'admin_password_hash',  -- ⚠️ Hash gerado com bcrypt.hash('senha', 10)
    'ADMIN',
    true,
    false,
    NULL,
    NOW(),
    NOW()
)
ON CONFLICT (email) 
DO UPDATE SET
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    "isActive" = EXCLUDED."isActive",
    "mustChangePassword" = EXCLUDED."mustChangePassword",
    "updatedAt" = NOW();

-- ============================================================================
-- 3. VERIFICAÇÃO
-- ============================================================================
-- Verifica se o admin foi criado/atualizado corretamente
SELECT 
    id,
    nome,
    email,
    role,
    "isActive",
    "mustChangePassword",
    "createdAt",
    "updatedAt"
FROM users 
WHERE email = :'admin_email';

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- - Este script faz o equivalente ao seed do Prisma
-- - O hash da senha DEVE ser gerado com bcrypt (não use senha em texto plano)
-- - Se o usuário admin já existir, ele será atualizado
-- - Todos os outros dados (cobranças, clientes, outros usuários) serão removidos
-- ============================================================================

