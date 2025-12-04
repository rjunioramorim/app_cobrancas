# Scripts de Inicialização Docker

Este diretório contém scripts auxiliares para inicialização e configuração dos serviços Docker.

## init-databases.sh

Script que cria automaticamente os bancos de dados necessários ao iniciar o `docker-compose`, se eles não existirem.

### Bancos de dados criados

- **cobrancas_db**: Banco de dados principal da aplicação
- **n8n**: Banco de dados para o n8n
- **evolution**: Banco de dados para a Evolution API

### Como funciona

1. O script aguarda o PostgreSQL estar pronto e aceitando conexões
2. Para cada banco de dados, verifica se já existe
3. Se não existir, cria o banco de dados
4. Se já existir, apenas informa que o banco já está disponível

### Integração com Docker Compose

O script é executado automaticamente através do serviço `db-init` no `docker-compose.yml`:

- O serviço `db-init` depende do serviço `db` estar saudável (healthcheck)
- Após a conclusão bem-sucedida do `db-init`, os serviços `n8n` e `evolution-api` são iniciados
- Isso garante que os bancos de dados estejam prontos antes dos serviços que os utilizam

### Variáveis de ambiente

O script utiliza as seguintes variáveis de ambiente (com valores padrão):

- `POSTGRES_USER` (padrão: `postgres`)
- `POSTGRES_PASSWORD` (padrão: `docker`)
- `POSTGRES_HOST` (padrão: `db`)
- `POSTGRES_PORT` (padrão: `5432`)
- `POSTGRES_DB` (padrão: `cobrancas_db`)
- `N8N_DB_NAME` (padrão: `n8n`)
- `EVOLUTION_DB_NAME` (padrão: `evolution`)

### Execução manual

Se necessário, você pode executar o script manualmente:

```bash
# Dentro de um container com acesso ao PostgreSQL
./scripts/docker/init-databases.sh
```

Ou usando docker-compose:

```bash
docker-compose run --rm db-init
```

### Logs

O script fornece saída colorida indicando:
- ⏳ Aguardando PostgreSQL
- ✅ PostgreSQL pronto
- 📊 Verificando banco de dados
- ✓ Banco já existe ou foi criado
- ✗ Erro ao criar banco

