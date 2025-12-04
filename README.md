## Visão geral

Aplicação para gerenciamento de clientes e cobranças usando Next.js (App Router), Prisma e NextAuth. O shell principal oferece sidebar em telas grandes e bottom navigation em dispositivos móveis.

## Funcionalidades atuais

- Dashboard inicial com atalhos rápidos e métricas resumidas
- CRUD básico de clientes (lista, detalhes, cadastro e edição)
- API REST `/api/clients` respeitando camadas Controller + Service + Prisma
- Seed com usuário admin, usuário padrão, clientes e cobranças demo

## Configuração

```bash
pnpm install
pnpm db:push # ou prisma migrate deploy
pnpm seed
pnpm dev
```

## Testes

Executa validações unitárias dos schemas Zod.

```bash
pnpm test
```

## Estrutura útil

- `src/components/layout`: AppShell, Sidebar e BottomNav reutilizáveis
- `src/components/clients`: formulários client-side
- `src/schemas` / `src/server`: validações, controllers e services
- `src/app/(dashboard)/clients`: páginas server components protegidas

## Integração n8n / Evolution API

### Tokens de API
- Antes de rodar o seed, defina `N8N_API_TOKEN` (e opcionalmente `N8N_API_TOKEN_NAME`) para gerar uma API key vinculada ao usuário demo.
- Em produção, gere tokens adicionais inserindo na tabela `api_tokens` (o valor deve ser armazenado como `sha256` – o helper `hashApiToken` em `src/server/utils/api-auth.ts` pode ser usado num script).
- Para chamadas autenticadas, envie `Authorization: Bearer <API_KEY>`. Chamadas internas do app continuam aceitando o JWT emitido pelo NextAuth.
- Admins podem gerenciar tokens via `/admin/users`, onde cada chave é exibida apenas no momento da criação (similar ao fluxo da AWS).

### Endpoints
`GET /api/integrations/cobrancas`
- Retorna até 50 cobranças filtradas por:
- Pendentes que vencem exatamente em 2 dias a partir de hoje
- Atrasadas (`ATRASADO`) de clientes ativos
  - Somente registros com `messageAttempts < 3`
- Query params: `limit` (máx. 50) e `cursor` (paginador por ID).
- Resposta inclui `category` (`upcoming` ou `overdue`) e `messageAttempts` atuais para o n8n decidir ações.

`POST /api/integrations/cobrancas/:id/attempt`
- Incrementa o contador `messageAttempts` (máximo 3). Quando atingir 3, novas chamadas retornam `400`.

`POST /api/cobrancas/:id/message`
- Atualiza a quantidade de mensagens enviadas (`messageAttemptsDelta`) e opcionalmente concatena uma observação.
- Payload exemplo:
```json
{
  "messageAttemptsDelta": 1,
  "observacoes": "WhatsApp enviado às 10h",
  "appendObservacoes": true
}
```

### Fluxo com n8n
1. n8n chama o endpoint de listagem, pagina até processar todas as cobranças elegíveis.
2. Para cada envio realizado via Evolution API (no n8n), chame `POST /attempt` para registrar a tentativa.
3. Cobranças com 3 tentativas deixam de aparecer automaticamente; basta ajustar o fluxo para repetir diariamente.
