# NHB Status Report

Plataforma de governança de entregas e relatórios de status para os prestadores de serviço da **Norsk Hydro Brasil**. Permite que administradores cadastrem empresas, definam metas de entrega por período e acompanhem o cumprimento através de um dashboard executivo, enquanto prestadores registram seus apontamentos com anexos.

## Sumário

- [Arquitetura](#arquitetura)
- [Stack](#stack)
- [Pré-requisitos](#pré-requisitos)
- [Setup rápido (bootstrap)](#setup-rápido-bootstrap)
- [Setup manual passo a passo](#setup-manual-passo-a-passo)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Banco de dados](#banco-de-dados)
- [Scripts disponíveis](#scripts-disponíveis)
- [Autenticação e primeiro acesso](#autenticação-e-primeiro-acesso)
- [Convenções de desenvolvimento](#convenções-de-desenvolvimento)
- [Docker](#docker)

---

## Arquitetura

Monorepo gerenciado por **pnpm workspaces** com três pacotes:

```
nhb-project-delivery/
├── apps/api/          → @nhb-status-report/api    (NestJS · DDD Clean Architecture · Prisma)
├── apps/web/          → @nhb-status-report/web    (React · Vite · Tailwind · shadcn/ui)
└── packages/shared/   → @nhb-status-report/shared (contratos TypeScript compartilhados)
```

O backend organiza cada domínio (auth, users, companies, status-reports, status-report-goals) em uma vertical slice completa (`domain/`, `application/`, `infrastructure/`, `presentation/`). O frontend é organizado por feature (`features/<feature>/{components,hooks,pages,types}`).

## Stack

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 18 · Vite · TypeScript · Tailwind CSS · shadcn/ui · React Router v6 · react-hook-form + zod · recharts · react-i18next |
| Backend | NestJS 10 · Prisma 6 · class-validator · JWT (passport-jwt) · Multer · Swagger |
| Banco | PostgreSQL 16 |
| Build/dev | pnpm 9 · Vite · tsc · ESLint · Jest |
| Infra dev | Docker Compose (Postgres) |

## Pré-requisitos

- **Node.js** 20+ (recomendado via `nvm` — há um `.nvmrc`)
- **pnpm** 9+ (`corepack enable && corepack prepare pnpm@9.15.0 --activate`)
- **Docker** + **Docker Compose** (para o Postgres local)
- **Git**

Opcional: `psql` na máquina para inspeção, mas não é necessário porque `pnpm prisma:studio` provê uma UI completa.

---

## Setup rápido (bootstrap)

Tudo em um comando — instala dependências, cria os `.env`, sobe o Postgres, roda migrations, popula o admin e inicia os dois servidores:

```bash
git clone https://github.com/diogofaria73/nhb-project-delivery.git
cd nhb-project-delivery
pnpm bootstrap
```

Depois desse comando:

- API rodando em **http://localhost:3000** (Swagger em **http://localhost:3000/api/docs**)
- Web rodando em **http://localhost:5173**
- Login admin: `admin@platform.com` / `Admin@123` (você será forçado a trocar a senha no primeiro acesso)

---

## Setup manual passo a passo

Se preferir entender cada etapa ou rodar em uma máquina sem Docker:

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Criar arquivos `.env`

```bash
node scripts/setup-env.js
# ou copie manualmente:
cp apps/api/.env.example apps/api/.env
# (apps/web não exige .env — defaults do Vite são suficientes)
```

Edite `apps/api/.env` se quiser ajustar o `JWT_SECRET` ou apontar para um Postgres remoto via `DATABASE_URL`.

### 3. Subir o Postgres

```bash
pnpm docker:up        # docker compose up -d  (container "nhb-status-report-postgres" na porta 5432)
node scripts/wait-for-db.js   # aguarda o container ficar saudável
```

Se já tem um Postgres rodando localmente, basta ajustar `DATABASE_URL` no `apps/api/.env` e pular este passo.

### 4. Gerar o cliente Prisma, aplicar migrations e popular o admin

```bash
pnpm --filter @nhb-status-report/api prisma:generate
pnpm --filter @nhb-status-report/api prisma:migrate    # cria todas as tabelas
pnpm --filter @nhb-status-report/api prisma:seed       # cria o usuário admin
```

### 5. Subir os servidores

```bash
pnpm dev              # roda API + Web em paralelo
# ou separadamente:
pnpm dev:api
pnpm dev:web
```

### 6. Primeiro login

Abra **http://localhost:5173/login** e entre com `admin@platform.com` / `Admin@123`. O sistema redireciona para `/first-login` exigindo a troca de senha. Depois disso você cai direto no dashboard de status reports.

---

## Estrutura do projeto

### Backend (`apps/api`)

```
src/
├── modules/
│   ├── auth/                       Login, primeiro acesso, JWT
│   ├── users/                      CRUD de usuários (Admin)
│   ├── companies/                  CRUD de empresas prestadoras (Admin)
│   ├── status-reports/             Apontamentos + anexos + analytics
│   │   ├── domain/                 Entities, value objects, repository interfaces
│   │   ├── application/            Use cases + DTOs
│   │   ├── infrastructure/         Prisma repos + storage providers
│   │   └── presentation/           Controllers HTTP
│   └── status-report-goals/        Metas de entrega por período
└── shared/
    ├── domain/                     BaseEntity, interfaces comuns
    └── infrastructure/             PrismaService, guards, filters
```

Princípios:
- Dependency rule: camada interna não importa de camada externa
- Repository pattern: interfaces em `domain/repositories/`, implementação em `infrastructure/repositories/`
- Um caso de uso = uma classe injetável

### Frontend (`apps/web`)

```
src/
├── app/                Layout, rotas, providers
├── components/ui/      Componentes shadcn (gerados)
├── features/           Módulos por feature
│   ├── auth/
│   ├── users/
│   ├── companies/
│   ├── status-reports/             (dashboard + sub-página /submissions)
│   ├── status-report-analytics/    (heatmap, tabela, hooks)
│   ├── goals/
│   ├── first-login/
│   └── account/
├── hooks/              Hooks compartilhados (useCurrentUser, etc.)
├── i18n/               Locales en + pt-BR
├── lib/                Utilitários (cn, máscaras, formatadores)
├── services/           Cliente HTTP + um service por recurso
├── styles/             Tailwind + CSS global
└── types/              Tipos compartilhados (mirroram packages/shared)
```

Padrão: **Page → Component → Hook → Service → API**. Nada de chamada HTTP direta dentro de componentes.

---

## Variáveis de ambiente

### `apps/api/.env`

| Variável | Default | Descrição |
| --- | --- | --- |
| `NODE_ENV` | `development` | Ambiente |
| `PORT` | `3000` | Porta do servidor NestJS |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/nhb_status_report?schema=public` | String de conexão do Postgres |
| `JWT_SECRET` | `nhb-dev-secret-change-in-production` | Segredo de assinatura do JWT — **trocar em produção** |
| `JWT_EXPIRATION` | `28800` | Expiração do token em segundos (8h) |

### `apps/web`

Não exige `.env` em desenvolvimento. Em produção, configure o `VITE_API_URL` para apontar para o backend (default: `http://localhost:3000/api`).

---

## Banco de dados

### Modelos principais

- `User` (com `mustChangePassword` para fluxo de primeiro acesso)
- `Company` (empresas prestadoras, com CNPJ e `isActive`)
- `StatusReportSubmission` (apontamento mensal + anexos)
- `StatusReportAttachment` (metadados de arquivo)
- `StatusReportGoal` (meta por período: QUARTERLY · SEMESTRAL · ANNUAL, com `deliveriesPerPeriod` e `monthlyDeadlineDay`)

Schema completo em `apps/api/prisma/schema.prisma`.

### Migrations

Já existem migrations versionadas para todo o estado atual. Em desenvolvimento:

```bash
pnpm --filter @nhb-status-report/api prisma:migrate          # aplicar / criar nova migration
pnpm --filter @nhb-status-report/api prisma:studio           # abrir UI do Prisma
```

Em produção:

```bash
pnpm --filter @nhb-status-report/api prisma:migrate:prod     # apenas aplica migrations existentes
```

### Storage de anexos

Os anexos das submissões são gravados via `IStorageProvider`. O default é `LocalDiskStorage`, que grava em `apps/api/uploads/` (gitignored). Para produção, troque por um provider remoto (S3, GCS) implementando a mesma interface em `apps/api/src/modules/status-reports/infrastructure/storage/`.

---

## Scripts disponíveis

Do root do monorepo:

| Comando | Descrição |
| --- | --- |
| `pnpm bootstrap` | Setup completo do zero (instala, sobe Postgres, migra, popula, roda) |
| `pnpm dev` | Roda API + Web em paralelo |
| `pnpm dev:api` | Só backend |
| `pnpm dev:web` | Só frontend |
| `pnpm build` | Build de produção dos dois apps |
| `pnpm lint` | Lint em todos os pacotes |
| `pnpm test` | Testes em todos os pacotes |
| `pnpm docker:up` | Sobe Postgres |
| `pnpm docker:down` | Para Postgres |
| `pnpm docker:logs` | Logs do Postgres |

Específicos do backend (filtrados):

| Comando | Descrição |
| --- | --- |
| `pnpm --filter @nhb-status-report/api prisma:generate` | Gera o Prisma Client |
| `pnpm --filter @nhb-status-report/api prisma:migrate` | Aplica/cria migrations (dev) |
| `pnpm --filter @nhb-status-report/api prisma:seed` | Cria o usuário admin inicial |
| `pnpm --filter @nhb-status-report/api prisma:studio` | UI do banco em http://localhost:5555 |

---

## Autenticação e primeiro acesso

1. Login via `POST /api/auth/login` retorna um JWT em cookie HttpOnly + body
2. O cliente armazena também em `localStorage` para o `Authorization: Bearer` header (fluxo híbrido)
3. Usuários criados pelo Admin recebem `mustChangePassword=true` — o frontend redireciona para `/first-login` no próximo login
4. Roles: `ADMINISTRATOR` (acesso total) e `USER` (acesso ao próprio dashboard e submissões)

Documentação interativa Swagger em **http://localhost:3000/api/docs**.

---

## Convenções de desenvolvimento

- **TypeScript estrito.** `any` proibido — use `unknown` + narrow ou tipos próprios.
- **Sem default exports** — sempre named exports.
- **Sem imports relativos atravessando camadas** (e.g. controller importando de `../../domain/`).
- **DTOs com `class-validator`** em todo endpoint.
- **Idioma do código:** inglês. Comentários e identificadores em inglês.
- **Idioma da UI:** EN + PT-BR (i18n via react-i18next, locale default = `pt-BR`).
- **Commits:** estilo conventional (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`...).

Diretrizes completas em [`CLAUDE.md`](./CLAUDE.md).

---

## Docker

Em desenvolvimento, só o Postgres roda em container (`docker-compose.yml` na raiz). API e Web rodam direto no host com hot reload.

Para um build full-Docker (não usado em dev), o `apps/api/Dockerfile` empacota o backend. Web pode ser servida via qualquer hosting estático após `pnpm build:web` (output em `apps/web/dist`).

---

## Documentação adicional

- Specs das User Stories em [`docs/specs/`](./docs/specs)
- Instruções operacionais (princípios, padrões, checklist de feature nova) em [`CLAUDE.md`](./CLAUDE.md)
