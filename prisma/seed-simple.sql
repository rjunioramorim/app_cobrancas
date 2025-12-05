-- ============================================================================
-- Script SQL equivalente ao seed do Prisma (prisma/seed.ts)
-- Versão simplificada - compatível com qualquer cliente SQL
-- ============================================================================
-- 
-- ANTES DE EXECUTAR:
-- 1. Gere o hash da senha com bcrypt:
--    node -e "const bcrypt = require('bcrypt'); bcrypt.hash('SUA_SENHA', 10).then(h => console.log(h))"
--
-- 2. Substitua 'SEU_HASH_BCRYPT_AQUI' abaixo pelo hash gerado
-- 3. Ajuste 'admin@admin.com' se quiser usar outro email
--
-- ============================================================================

-- 1. LIMPAR DADOS EXISTENTES (exceto o admin)
DELETE FROM cobrancas;
DELETE FROM clients;
DELETE FROM users WHERE email != 'admin@admin.com';

-- 2. CRIAR OU ATUALIZAR O USUÁRIO ADMIN
-- ⚠️ SUBSTITUA 'SEU_HASH_BCRYPT_AQUI' pelo hash gerado com bcrypt
-- Exemplo de hash para senha "admin123": $2b$10$dODUr4BcsBdU9ISz1dR7veyBbd3lim8iIT6XXtXo2J110bo6g4wny

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
    gen_random_uuid(),
    'Administrador',
    'admin@admin.com',  -- Ajuste se necessário
    'SEU_HASH_BCRYPT_AQUI',  -- ⚠️ SUBSTITUA pelo hash gerado
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

-- 3. VERIFICAÇÃO
SELECT 
    id,
    nome,
    email,
    role,
    "isActive",
    "mustChangePassword",
    "createdAt"
FROM users 
WHERE email = 'admin@admin.com';


