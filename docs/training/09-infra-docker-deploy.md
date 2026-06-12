# 09 — Infra & deploy

Como o app é empacotado e rodado em produção. Curto e prático: você não precisa ser DevOps, mas precisa entender o suficiente para debugar quando algo quebra.

---

## Dois modos de rodar este projeto

### Modo desenvolvimento (você no dia a dia)

```
┌─────────────────────────┐
│  Sua máquina (host)     │
│                         │
│  pnpm dev:api ──→ :3000 │
│  pnpm dev:web ──→ :5173 │
│                         │
│  ┌───────────────────┐  │
│  │ Docker container  │  │
│  │ postgres:16       │  │
│  │ porta 5432 interna│  │
│  └───────────────────┘  │
└─────────────────────────┘
```

- API e Web rodam no **host** (hot reload, dev tools)
- Só o **Postgres** roda em container

Por que? Hot reload é dolorosamente lento dentro de container no macOS (filesystem montado). Postgres em container é trivial e portátil.

### Modo "full Docker" (simula produção localmente)

```
┌─────────────────────────────┐
│  Docker compose             │
│                             │
│  ┌────────────┐  ┌────────┐ │
│  │ app        │  │postgres│ │
│  │ (NestJS +  │←→│        │ │
│  │  web dist) │  │        │ │
│  │ :3000 int  │  │ :5432  │ │
│  │ :3001 host │  │  int   │ │
│  └────────────┘  └────────┘ │
└─────────────────────────────┘
```

- Mesma imagem que iria pra produção
- NestJS **serve o frontend estático** (build do Vite) na mesma porta (`/api` para API, `/` para SPA)
- Acessível em `http://localhost:3001` (porta 3001 pra não bater com seu `pnpm dev`)

Quando usar: testar deploy localmente, validar Dockerfile, debugar problema só-em-produção.

---

## `docker-compose.yml` — o conjunto local

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: nhb-status-report-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: nhb_status_report
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
    networks:
      - nhb-net

  app:
    build: { context: ., dockerfile: Dockerfile }
    image: nhb-status-report:local
    depends_on:
      postgres: { condition: service_healthy }
    environment:
      NODE_ENV: production
      PORT: "3000"
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/nhb_status_report?schema=public
      JWT_SECRET: nhb-local-secret-change-before-prod
      CORS_ORIGIN: http://localhost:3001
      STORAGE_DRIVER: local
      STORAGE_LOCAL_PATH: /app/storage
    ports:
      - "3001:3000"        # ← host 3001 → container 3000
    volumes:
      - app_storage:/app/storage
    networks:
      - nhb-net

volumes:
  postgres_data:
  app_storage:
```

Pontos didáticos:

- **`postgres` resolve como hostname** dentro da network `nhb-net`. É por isso que `DATABASE_URL` usa `postgres:5432`, não `localhost:5432`.
- **Sem `ports` no Postgres** — fica fechado para o host (evita conflito com outros Postgres seus).
- **`depends_on` + `healthcheck`** — app só sobe depois do Postgres aceitar conexões.
- **Volumes nomeados** — `postgres_data` mantém os dados entre `docker compose down`/`up`. Pra zerar tudo: `docker compose down -v`.
- **`STORAGE_LOCAL_PATH: /app/storage`** — onde os arquivos `.xlsx` originais ficam (montado como volume).

---

## Scripts `docker:*`

Em `package.json` (raiz):

| Script | O que faz | Quando usar |
| --- | --- | --- |
| `pnpm docker:up` | Sobe Postgres (só) | Dev day-to-day |
| `pnpm docker:down` | Para Postgres | Liberar a 5432 ou parar tudo |
| `pnpm docker:logs` | Logs do Postgres | Quando suspeita de DB indisponível |
| `pnpm docker:build` | Build da imagem `app` | Testar mudanças no Dockerfile |
| `pnpm docker:deploy` | Build + sobe `app` + `postgres` | Smoke test do build de produção |
| `pnpm docker:rebuild` | Down + build `--no-cache` + up | Quando cache do Docker te enganou |

> ⚠️ `docker:rebuild` é destrutivo — `docker compose down` para tudo. Se você tinha dados úteis, perdeu (mas como o volume é nomeado, o **Postgres** mantém; só os containers reiniciam).

---

## `Dockerfile` — multistage

Imagem final é pequena e roda como **usuário não-root**. O arquivo tem 4 stages:

### Stage 1 — `deps`

Instala dependências do monorepo (incluindo dev deps necessárias pro build).

```dockerfile
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile
```

Por que copiar **só os `package.json`** primeiro? Cache do Docker: se você mudar só um arquivo de código mas não as deps, esta stage **não roda de novo**.

### Stage 2 — `build-web`

Roda `pnpm build` no `apps/web/`. Output: `apps/web/dist/` com HTML/CSS/JS estáticos.

### Stage 3 — `build-api`

Roda `prisma generate`, `pnpm build` no api, compila o `seed.ts`. Output: `apps/api/dist/`.

### Stage 4 — `production`

Imagem final magra:

- Copia só os artefatos das stages anteriores
- Instala **`tini`** (PID 1 que reencaminha sinais — `SIGTERM` chega ao Node corretamente)
- Cria usuário `nhb` não-root
- `EXPOSE 3000`
- `ENTRYPOINT ["/sbin/tini", "--", "sh", "entrypoint.sh"]`

### `entrypoint.sh` (resumido)

```bash
#!/bin/sh
set -e
# 1. Aplica migrations
npx prisma migrate deploy
# 2. Roda seed (idempotente — cria admin se não existir)
node dist/seed/seed.js
# 3. Sobe o NestJS
node dist/main.js
```

---

## Como o NestJS serve o frontend

Em produção, o frontend é **servido pelo próprio NestJS** via `@nestjs/serve-static`. A variável de ambiente `WEB_BUILD_PATH=/app/web-dist` (definida no Dockerfile) aponta para o `dist` do Vite, copiado da stage `build-web`.

Resultado: **uma única URL** serve API (`/api/...`) e SPA (`/`). Sem CORS, sem proxy reverso adicional. Simples.

---

## Variáveis de ambiente

Backend lê via `ConfigService`. Em dev: `apps/api/.env`. Em prod: variáveis do container.

| Variável | Default dev | O que faz |
| --- | --- | --- |
| `NODE_ENV` | `development` | Toggle de logs/comportamentos |
| `PORT` | `3000` | Porta do NestJS |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/nhb_status_report?schema=public` | Conexão Postgres |
| `JWT_SECRET` | `nhb-dev-secret-change-in-production` | Assinatura JWT — **trocar em prod** |
| `JWT_EXPIRATION` | `28800` | Segundos (8h) |
| `CORS_ORIGIN` | `http://localhost:5173` | Origem permitida para CORS |
| `STORAGE_DRIVER` | `local` | `local` ou `azure` (se for implementado) |
| `STORAGE_LOCAL_PATH` | `apps/api/uploads` | Onde gravar arquivos |

> 🔐 **Nunca comite `.env` real** — só `.env.example`. Em prod, variáveis vêm do orquestrador (Azure Container Apps, Kubernetes secret, etc.).

---

## Deploy real (resumo)

Este projeto é desenhado para rodar em **Azure Container Apps** (origem do "Azure-NHB" no path). O fluxo conceitual:

1. CI builda a imagem (`docker build` ou Buildpacks)
2. Push pra registry (Azure Container Registry)
3. Azure Container Apps puxa a nova revisão
4. Container roda → `entrypoint.sh` → migrations → seed → app
5. Health check em `/api/health` (se implementado)
6. Tráfego é redirecionado

Detalhes de Azure ficam fora do escopo deste tutorial — pergunte ao time de DevOps quando chegar lá.

---

## Storage de arquivos

O upload de `.xlsx` precisa ser persistido **fora do container** (senão restart perde tudo). Em dev local fica em `apps/api/uploads/`. No `docker compose`, num volume nomeado. Em produção, idealmente:

- **Azure Blob Storage** via implementação alternativa do `IStorageProvider`
- Ou mount de Azure File Share como volume persistente

A abstração `IStorageProvider` em `apps/api/src/shared/infrastructure/storage/` permite trocar a implementação sem mexer no resto do código (revisitar cap 03).

---

## Debug do container

Container reclamando? Sequência típica:

```bash
# Logs
docker compose logs app -f
docker compose logs postgres -f

# Entrar no container rodando
docker compose exec app sh

# Inspeção do banco direto
docker compose exec postgres psql -U postgres -d nhb_status_report

# Confirmar que migrations rodaram
docker compose exec postgres psql -U postgres -d nhb_status_report \
  -c 'SELECT * FROM _prisma_migrations ORDER BY started_at DESC LIMIT 5'

# Reset completo (dev only — destrói dados!)
docker compose down -v
pnpm docker:deploy
```

---

## 🛠 Exercício

1. Rode `pnpm docker:deploy`. Esperar terminar. Acessar `http://localhost:3001` — você vê a tela de login? Logue como admin.
2. Compare com `pnpm dev` (porta 5173). Quais diferenças você consegue identificar entre os dois modos? (Hot reload, source maps, performance percebida…)
3. Pare tudo (`pnpm docker:down`) e rode `pnpm docker:rebuild`. Quanto tempo demorou? Por quê?
4. Abra o `Dockerfile`. Responda: o que aconteceria se a linha que cria o usuário `nhb` e dá `chown` fosse **removida**? (Pista: o `entrypoint.sh` precisaria escrever no `/app/storage`.)
5. Cenário: em produção, o app inicia mas falha logo após. Logs mostram "Migration failed: column not found". O que aconteceu? Como você corrigiria?

**Critério de pronto:** você consegue rodar o app no modo dev e no modo Docker full, e sabe debugar quando o container não sobe.

➡️ Próximo: [10 — Capstone: criar o módulo `notifications`](./10-capstone-novo-modulo.md)
