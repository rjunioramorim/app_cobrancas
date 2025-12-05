-- ============================================================================
-- EXEMPLO COMPLETO: Script SQL do seed com hash de exemplo
-- ============================================================================
-- 
-- Este é um exemplo PRONTO PARA USAR com a senha "admin123"
-- Hash gerado: $2b$10$dODUr4BcsBdU9ISz1dR7veyBbd3lim8iIT6XXtXo2J110bo6g4wny
--
-- ⚠️ ATENÇÃO: Este hash é para a senha "admin123"
-- Se quiser usar outra senha, gere um novo hash:
--    node -e "const bcrypt = require('bcrypt'); bcrypt.hash('SUA_SENHA', 10).then(h => console.log(h))"
--
-- ============================================================================

-- 1. Limpar dados existentes (exceto o admin)
DELETE FROM cobrancas;
DELETE FROM clients;
DELETE FROM users WHERE email != 'admin@admin.com';

-- 2. Criar ou atualizar o usuário admin
-- Hash para senha "admin123": $2b$10$dODUr4BcsBdU9ISz1dR7veyBbd3lim8iIT6XXtXo2J110bo6g4wny
INSERT INTO users (
    id,
    nome,
    email,
    password,
    role,
    "isActive",
    "createdAt",
    "updatedAt"
)
VALUES (
    gen_random_uuid(),
    'Administrador',
    'admin@admin.com',
    '$2b$10$dODUr4BcsBdU9ISz1dR7veyBbd3lim8iIT6XXtXo2J110bo6g4wny',  -- Senha: admin123
    'ADMIN',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) 
DO UPDATE SET
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = NOW();

-- 3. Verificação
SELECT 
    id,
    nome,
    email,
    role,
    "isActive",
    
    "createdAt"
FROM users 
WHERE email = 'admin@admin.com';

