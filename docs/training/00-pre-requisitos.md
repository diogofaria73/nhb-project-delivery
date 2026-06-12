# 00 — Pré-requisitos

Antes de mergulhar na arquitetura, você precisa de (a) o ambiente rodando e (b) algumas bases de conhecimento.

---

## Conhecimento esperado

Você **não precisa** dominar todos os tópicos abaixo — mas precisa pelo menos saber do que se trata. O tutorial explica o **como aplicamos** cada um neste projeto.

| Tópico | Nível esperado | Onde estudar se faltar |
| --- | --- | --- |
| TypeScript (tipos, generics básicos, `strict` mode) | Intermediário | [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/) |
| Promises e `async/await` | Confortável | MDN |
| React (componentes funcionais, hooks, props) | Confortável | [React docs](https://react.dev/) |
| HTTP (métodos, status codes, headers) | Básico | MDN HTTP |
| Git (branch, commit, rebase básico, PR) | Básico | [Pro Git book](https://git-scm.com/book) cap 1–3 |
| SQL básico (SELECT, JOIN, índice) | Básico | qualquer tutorial de Postgres |
| Conceito de **injeção de dependência** | Conhecer o nome | Vai aparecer no cap 3 |
| **NestJS** | Não precisa saber | Capítulos 3 e 4 introduzem |
| **Prisma** | Não precisa saber | Capítulo 7 introduz |
| **DDD / Clean Architecture** | Não precisa | É o objetivo do tutorial |

---

## Ambiente de desenvolvimento

### Software obrigatório

| Software | Versão | Como instalar |
| --- | --- | --- |
| **Node.js** | 20+ | [nvm](https://github.com/nvm-sh/nvm) (use o `.nvmrc` do repo) |
| **pnpm** | 9.15.0+ | `corepack enable && corepack prepare pnpm@9.15.0 --activate` |
| **Docker Desktop** | Atual | [docker.com](https://www.docker.com/products/docker-desktop) |
| **Git** | 2.30+ | Já vem no macOS / via instalador no Windows |

Por que `corepack`? Porque garante que **todo mundo usa exatamente a mesma versão do pnpm** — sem precisar de `npm install -g pnpm`. O arquivo `package.json` da raiz declara `"packageManager": "pnpm@9.15.0"` e o `corepack` respeita isso.

### Editor recomendado

**VS Code** com as extensões:

- ESLint (`dbaeumer.vscode-eslint`)
- Prisma (`Prisma.prisma`) — syntax highlight e autocompletar para `schema.prisma`
- Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)

---

## Setup do projeto — passo a passo

Clone e rode tudo:

```bash
git clone <url-do-repo>
cd nhb-project-delivery
pnpm bootstrap
```

O que `pnpm bootstrap` faz (script em `package.json:22`):

1. `pnpm install` — instala dependências de todos os workspaces
2. `node scripts/setup-env.js` — cria `apps/api/.env` a partir do `.env.example`
3. `pnpm docker:up` — sobe o container do Postgres
4. `node scripts/wait-for-db.js` — espera o banco ficar pronto
5. `prisma:generate` — gera o Prisma Client (tipos TypeScript do schema)
6. `prisma:migrate` — aplica as migrations no banco
7. `prisma:seed` — cria o usuário admin inicial
8. `pnpm dev` — sobe a API (porta 3000) e o web (porta 5173) em paralelo

> ⚠️ Se você já tem outro Postgres na 5432 ou outro serviço na 3000/5173, ajuste antes — o `docker-compose.yml` usa `5432` interno e o web/api usam `5173`/`3000`.

### Validando que está tudo certo

Abra outro terminal e rode:

```bash
# 1. API respondendo
curl http://localhost:3000/api/docs   # Swagger HTML

# 2. Web servindo
curl -s http://localhost:5173 | head -1   # <!doctype html>

# 3. Banco respondendo
docker exec -it nhb-status-report-postgres psql -U postgres -d nhb_status_report -c '\dt'
# Deve listar: users, project_imports, project_snapshots, _prisma_migrations
```

Se as três funcionam, está pronto.

### Login pela primeira vez

1. Abra http://localhost:5173/login
2. Email: `admin@platform.com` · Senha: `Admin@123`
3. Você será redirecionado para `/first-login` exigindo trocar a senha
4. Após trocar, cai no `/dashboard`

> 🔍 A senha inicial está em `apps/api/prisma/seed.ts`. Sim, em texto puro. Não, isso não é problema de segurança porque o `mustChangePassword` força a troca no primeiro login.

---

## Comandos que você vai usar todo dia

Memorize estes (todos rodados da raiz do repo):

```bash
pnpm dev                                  # sobe API + Web
pnpm dev:api                              # só backend
pnpm dev:web                              # só frontend
pnpm docker:up                            # sobe Postgres
pnpm docker:down                          # para Postgres
pnpm docker:logs                          # logs do Postgres

# Backend específicos (precisam do --filter):
pnpm --filter @nhb-status-report/api prisma:generate   # após mudar schema.prisma
pnpm --filter @nhb-status-report/api prisma:migrate    # criar/aplicar migration em dev
pnpm --filter @nhb-status-report/api prisma:studio     # UI do banco em :5555
pnpm --filter @nhb-status-report/api test              # testes do backend
```

> 💡 **Dica:** crie aliases no seu shell pros comandos `--filter` mais longos. Algo como `alias nhb-prisma="pnpm --filter @nhb-status-report/api prisma:"` e depois `nhb-prisma migrate`.

---

## Estrutura mental do projeto (5 segundos)

Antes de seguir, fixe esta imagem na cabeça — todos os capítulos voltam a ela:

```
nhb-project-delivery/
├── apps/
│   ├── api/         ← NestJS, DDD, Prisma → http://localhost:3000
│   └── web/         ← React + Vite        → http://localhost:5173
├── packages/
│   └── shared/      ← tipos TS usados pelos dois acima
├── docs/
│   ├── specs/       ← User Stories (BR-XX), o "o que" do produto
│   └── training/    ← você está aqui
└── prisma/          ← (dentro de apps/api) schema do banco + migrations
```

---

## 🛠 Exercício

1. Rode `pnpm bootstrap` do zero (se já rodou antes, dê um `pnpm docker:down -v` para zerar o volume e refaça).
2. Logue como admin e troque a senha.
3. Abra o **Swagger** em http://localhost:3000/api/docs e identifique:
   - Quantos endpoints existem em `Project Tracking`?
   - Quais exigem role `ADMINISTRATOR` (procure o cadeado / `ApiBearerAuth`)?
4. Abra o **Prisma Studio** com `pnpm --filter @nhb-status-report/api prisma:studio`. Conte quantos `User` existem após o seed.
5. Anote em um bloquinho: **uma dúvida que você ficou sobre o produto** (vamos responder no cap 01).

**Critério de pronto:** você abre os três URLs acima sem erro, consegue fazer login, e tem uma dúvida anotada.

➡️ Próximo: [01 — Visão geral do produto](./01-visao-geral.md)
