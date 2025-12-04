# Guia de Deploy em Produção

## 📋 Checklist de Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no seu ambiente de produção (Portainer, Docker Compose, etc.):

### 🔴 Obrigatórias

- **`DATABASE_URL`**: URL de conexão com o banco PostgreSQL
  - Formato: `postgresql://usuario:senha@host:porta/database`
  - Exemplo: `postgresql://postgres:senha123@db.example.com:5432/cobrancas`
  - ⚠️ **IMPORTANTE**: Deve começar com `postgresql://` ou `postgres://`

- **`AUTH_SECRET`**: Chave secreta para criptografia do NextAuth
  - Gere uma chave segura: `openssl rand -base64 32`
  - Ou use: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
  - ⚠️ **IMPORTANTE**: Mantenha esta chave segura e não a compartilhe

### 🟡 Opcionais (mas recomendadas)

- **`NEXTAUTH_URL`**: URL pública da aplicação (usado pelo NextAuth)
  - Exemplo: `https://cobrancas.smarttcode.com.br`
  - Se não configurado, o NextAuth usa `trustHost: true` (já configurado)

- **`NEXT_PUBLIC_API_URL`**: URL pública da API (se necessário para o frontend)
  - Exemplo: `https://cobrancas.smarttcode.com.br`

- **`NODE_ENV`**: Ambiente de execução
  - Valor: `production` (já configurado no docker-compose)

## 🐳 Configuração Docker

### Dockerfile

O Dockerfile está configurado para:
- ✅ Build multi-stage (otimizado)
- ✅ Output standalone do Next.js
- ⚠️ **ATENÇÃO**: Migrations e seed são executados durante o build
  - Isso requer `DATABASE_URL` disponível durante o build
  - Se não quiser isso, remova as linhas 31-32 do Dockerfile

### Docker Compose

O `docker-compose.yml` já está configurado com:
- ✅ Traefik para roteamento e SSL
- ✅ Rede externa `network_public`
- ✅ Variáveis de ambiente básicas

**Ajuste necessário**: Adicione todas as variáveis obrigatórias no `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - DATABASE_URL=${DATABASE_URL}  # ⚠️ Configure no Portainer/ambiente
  - AUTH_SECRET=${AUTH_SECRET}    # ⚠️ Configure no Portainer/ambiente
  - NEXTAUTH_URL=${NEXTAUTH_URL}  # Opcional
  - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}  # Opcional
```

## 🚀 Processo de Deploy

### 1. Build da Imagem

A imagem é construída automaticamente via GitHub Actions quando há push na branch `main` ou `prod`.

**Build manual** (se necessário):
```bash
docker build -t app-cobrancas:latest .
```

**Com DATABASE_URL para migrations durante o build**:
```bash
docker build --build-arg DATABASE_URL="postgresql://..." -t app-cobrancas:latest .
```

### 2. Configurar Variáveis no Portainer

1. Acesse o Portainer
2. Vá em **Stacks** → Selecione sua stack
3. Em **Environment variables**, adicione:
   - `DATABASE_URL` (obrigatório)
   - `AUTH_SECRET` (obrigatório)
   - `NEXTAUTH_URL` (opcional, mas recomendado)
   - `NEXT_PUBLIC_API_URL` (opcional)

### 3. Deploy via Portainer Webhook

O GitHub Actions dispara automaticamente o webhook do Portainer após o build.

**Webhook manual** (se necessário):
```bash
curl -X POST $PORTAINER_WEBHOOK_URL
```

### 4. Verificar Deploy

Após o deploy, verifique:
- ✅ Container está rodando: `docker ps`
- ✅ Logs sem erros: `docker logs <container-id>`
- ✅ Aplicação acessível: `https://cobrancas.smarttcode.com.br`
- ✅ Login funcionando

## 🔧 Problemas Comuns

### Erro: "DATABASE_URL must start with postgresql://"

**Causa**: Variável `DATABASE_URL` não configurada ou formato incorreto.

**Solução**: 
- Verifique se `DATABASE_URL` está configurada no Portainer
- Formato correto: `postgresql://usuario:senha@host:porta/database`

### Erro: "UntrustedHost"

**Causa**: NextAuth não confia no host.

**Solução**: Já corrigido com `trustHost: true` no `src/auth.ts`. Se persistir, configure `NEXTAUTH_URL`.

### Erro: "Migrations já aplicadas ou DATABASE_URL não configurado"

**Causa**: Durante o build, `DATABASE_URL` não estava disponível.

**Solução**: 
- Se migrations devem rodar no build: passe `DATABASE_URL` como build arg
- Se preferir rodar migrations no runtime: remova linhas 31-32 do Dockerfile e use entrypoint

### Erro: "Seed já executado ou não configurado"

**Causa**: Durante o build, `DATABASE_URL` não estava disponível ou seed já foi executado.

**Solução**: 
- Seed é idempotente (usa `upsert`), então pode rodar múltiplas vezes
- Se preferir rodar seed manualmente: use `npm run bootstrap:admin` após deploy

## 📝 Scripts Úteis

### Bootstrap do Admin (após deploy)

Se o seed não rodou durante o build, execute manualmente:

```bash
# Dentro do container ou com acesso ao banco
npm run bootstrap:admin
```

**Variáveis necessárias**:
- `ADMIN_EMAIL` (opcional, padrão: `admin@admin.com`)
- `ADMIN_PASSWORD` (obrigatório)

### Verificar Conexão com Banco

```bash
# Dentro do container
npx prisma db pull
```

### Rodar Migrations Manualmente

```bash
# Dentro do container
npx prisma migrate deploy
```

## 🔒 Segurança

- ✅ Nunca commite `.env` ou variáveis sensíveis no código
- ✅ Use secrets do GitHub Actions para variáveis sensíveis
- ✅ Use secrets do Portainer para variáveis de ambiente
- ✅ Gere `AUTH_SECRET` único e seguro
- ✅ Use SSL/TLS (já configurado via Traefik)

## 📊 Monitoramento

Após o deploy, monitore:
- Logs do container: `docker logs -f <container-id>`
- Health check: Acesse a URL da aplicação
- Banco de dados: Verifique conexões e queries

## 🆘 Suporte

Em caso de problemas:
1. Verifique os logs: `docker logs <container-id>`
2. Verifique variáveis de ambiente no Portainer
3. Verifique conectividade com o banco de dados
4. Verifique se todas as migrations foram aplicadas

