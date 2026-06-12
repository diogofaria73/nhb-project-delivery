# 02 — Arquitetura do monorepo

Este capítulo responde uma pergunta básica: **por que três pastas em vez de três repositórios?**

---

## O que é um monorepo

Um **monorepo** é um único repositório git que contém **vários pacotes independentes**, cada um com seu próprio `package.json`. Cada pacote pode ser publicado, testado e versionado por conta própria — mas vivem juntos.

A alternativa é **polyrepo**: cada pacote num repositório separado.

| Aspecto | Polyrepo | Monorepo |
| --- | --- | --- |
| Compartilhar tipos entre back e front | Publicar pacote npm, sincronizar versões | `import { Foo } from '@nhb-status-report/shared'` |
| Refatorar um contrato | PR em N repos coordenados | 1 PR atômico |
| CI | N pipelines | 1 pipeline (mais simples, mais lento) |
| Onboarding | Clonar 3 repos, configurar 3 | 1 clone, `pnpm bootstrap` |

Para um time pequeno cuidando do back **e** do front, monorepo ganha de longe.

---

## Os três pacotes

```
nhb-project-delivery/
├── apps/
│   ├── api/             @nhb-status-report/api
│   └── web/             @nhb-status-report/web
└── packages/
    └── shared/          @nhb-status-report/shared
```

Cada um tem seu `package.json`. O `name` deles é o que você usa nos imports.

### `@nhb-status-report/api` — Backend NestJS

- **Roda em:** Node.js (porta 3000)
- **Stack:** NestJS 10, Prisma 6, PostgreSQL, JWT
- **Importa de:** `@nhb-status-report/shared`
- **É importado por:** ninguém

### `@nhb-status-report/web` — Frontend React

- **Roda em:** browser (servido em dev pelo Vite na porta 5173)
- **Stack:** React 18, Vite, Tailwind, shadcn/ui, React Router v6, react-i18next
- **Importa de:** `@nhb-status-report/shared`
- **É importado por:** ninguém

### `@nhb-status-report/shared` — Contratos compartilhados

- **Roda em:** lugar nenhum — é só TypeScript de tipos
- **Stack:** TypeScript puro, sem dependências em runtime
- **Importa de:** ninguém
- **É importado por:** `api` e `web`

A regra de ouro: **`shared` nunca tem código executável**. Só `interface`, `type`, `enum`. Por quê? Porque se você bota código rodando lá, ele precisa ser construído antes de back/front, complica o build, e cria ambiguidade sobre **onde** ele roda (Node? Browser?). Mantenha simples: só contratos.

---

## pnpm workspaces — como funciona a mágica

A raiz tem dois arquivos que fazem o pnpm enxergar os pacotes:

**`pnpm-workspace.yaml`:**
```yaml
packages:
  - apps/*
  - packages/*
```

Isso diz ao pnpm: "tudo que está em `apps/<algo>` ou `packages/<algo>` é um workspace".

Quando você roda `pnpm install` na raiz, ele:

1. Lê todos os `package.json` dos workspaces
2. Resolve dependências de uma vez só (deduplicação global em `node_modules/.pnpm/`)
3. Para cada workspace, cria links simbólicos pros pacotes que ele precisa

A consequência prática: dentro de `apps/api/`, quando você escreve

```typescript
import { ProjectStatus } from '@nhb-status-report/shared';
```

o pnpm sabe que `@nhb-status-report/shared` é o pacote em `packages/shared/`. Ele segue o symlink. Sem publicar nada em npm registry.

---

## Como rodar comandos em workspaces específicos

Da raiz do repo, você tem três jeitos:

### 1. Comando único da raiz (orquestrado)

Definidos em `package.json:6-25` da raiz:

```bash
pnpm dev              # roda dev:api e dev:web em paralelo
pnpm build            # build dos dois
pnpm lint             # lint em todos workspaces
pnpm test             # test em todos workspaces
```

### 2. Filtrar um workspace específico

```bash
pnpm --filter @nhb-status-report/api <comando>
pnpm --filter @nhb-status-report/web <comando>
```

Exemplo:

```bash
pnpm --filter @nhb-status-report/api prisma:migrate
# = entra em apps/api/ e roda o script "prisma:migrate" do package.json local
```

### 3. Em todos os workspaces

```bash
pnpm -r <comando>   # -r = recursive
pnpm -r lint        # roda lint em api, web e shared
```

---

## TypeScript: como os tipos cruzam workspaces

Cada workspace tem seu próprio `tsconfig.json`, mas todos estendem **`tsconfig.base.json`** na raiz. Esse base define:

- `target`, `module`, `lib`
- `strict: true` (obrigatório no projeto)
- Paths e settings comuns

Cada `tsconfig` local adiciona:

- `baseUrl` e `paths` (aliases) — ex.: `@modules/*` no backend, `@/*` no frontend
- `outDir`, `include`, `exclude`

Quando você importa `@nhb-status-report/shared`, o TypeScript resolve via `node_modules` (que é symlink para `packages/shared/`). Como `shared/package.json` tem `"main": "dist/index.js"` e `"types": "dist/index.d.ts"`, o TS encontra os tipos.

> 💡 Por isso o `shared` precisa ser **buildado** ao menos uma vez antes do back/front conseguirem os tipos novos. Em dev, o `pnpm dev` da raiz cuida disso. Se você editar um tipo em `shared` e o intellisense do back não pegar, rode `pnpm --filter @nhb-status-report/shared build`.

---

## Path aliases — atalhos dentro de cada app

Olhe um import real do backend:

```typescript
// apps/api/src/modules/project-tracking/presentation/controllers/project-tracking.controller.ts:21
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
```

O `@shared/...` é um alias definido no `tsconfig.json` do backend. Ele aponta para `src/shared/...`. Sem alias, o import seria `../../../shared/infrastructure/decorators/roles.decorator` — feio e frágil em refactor.

| App | Alias | Para onde aponta |
| --- | --- | --- |
| `apps/api` | `@modules/*` | `src/modules/*` |
| `apps/api` | `@shared/*` | `src/shared/*` |
| `apps/web` | `@/*` | `src/*` |

**Regra:** sempre use aliases em vez de `../../..`. Os relativos só ficam ok **dentro do mesmo módulo** (e.g., um controller importando uma DTO do mesmo módulo).

---

## Fluxo de tipos: shared → back & front

Cenário: você precisa adicionar um campo `criticalityLevel` que a API retorna no `ProjectRowDto` do dashboard. Esse campo será **lido tanto pelo backend quanto pelo frontend**. Vai pra `shared`:

```
1. Edita: packages/shared/src/types/project-tracking-contracts.ts
          → adiciona  criticalityLevel: 'LOW' | 'MEDIUM' | 'HIGH'  ao ProjectRowDto
2. Build:  pnpm --filter @nhb-status-report/shared build
3. Back:   apps/api compila com o tipo novo  → erro até você popular o campo
4. Front:  apps/web compila com o tipo novo → erro até você usar/exibir
5. Commit único cobrindo tudo
```

Esse é o superpoder do monorepo: **uma mudança de contrato é um commit atômico**.

---

## Estrutura completa, vista de cima

```
nhb-project-delivery/
├── apps/
│   ├── api/
│   │   ├── prisma/                  # schema + migrations
│   │   ├── src/
│   │   │   ├── modules/             # bounded contexts (DDD)
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   └── project-tracking/
│   │   │   ├── shared/              # cross-cutting
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/
│       ├── src/
│       │   ├── app/                 # shell + rotas
│       │   ├── features/            # feature-based
│       │   ├── components/ui/       # shadcn
│       │   ├── services/            # API client
│       │   └── ...
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── types/
│       │   └── index.ts
│       └── package.json
├── docs/
│   ├── specs/
│   └── training/
├── scripts/                          # setup-env, wait-for-db
├── docker-compose.yml
├── Dockerfile
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── package.json                      # scripts raiz
└── CLAUDE.md
```

---

## Erros comuns que você vai cometer

| Sintoma | Causa | Correção |
| --- | --- | --- |
| Edita tipo em `shared`, IDE não atualiza | `shared` não foi rebuildado | `pnpm --filter @nhb-status-report/shared build` ou reinicia TS server |
| Roda `npm install` em vez de `pnpm install` | Cria `package-lock.json` "fantasma" | Apague o `package-lock.json`, use `pnpm` sempre |
| Import quebrou após mover arquivo | Você usou import relativo `../../...` | Substitua por alias `@shared/...` ou `@modules/...` |
| `Cannot find module '@nhb-status-report/shared'` | Symlinks quebrados após `rm -rf node_modules` | `pnpm install` na raiz, **não** dentro do app |

---

## 🛠 Exercício

1. Abra `pnpm-workspace.yaml` e confirme que apps/* e packages/* estão listados.
2. Rode `pnpm -r exec ls package.json` (lista o `package.json` de cada workspace). Quantos pacotes aparecem?
3. Abra `packages/shared/src/types/project-tracking-contracts.ts`. Encontre o tipo `ProjectStatus`. Agora rode no terminal:
   ```bash
   grep -rn "ProjectStatus" apps/api/src apps/web/src | head -20
   ```
   Conte: em quantos arquivos esse tipo aparece importado de `@nhb-status-report/shared`?
4. Tente importar **algo do `apps/api`** dentro do **`apps/web`** (não comite!). Por exemplo, em `apps/web/src/app/App.tsx`:
   ```typescript
   import { ProjectTrackingController } from '@nhb-status-report/api/src/modules/project-tracking/presentation/controllers/project-tracking.controller';
   ```
   O que acontece? Por que isso é (ou deveria ser) impossível?
5. Desfaça o teste acima.

**Critério de pronto:** você sabe explicar a diferença entre `pnpm -r lint` e `pnpm --filter @nhb-status-report/api lint`, e por que `shared` não pode conter código executável.

➡️ Próximo: [03 — Backend: DDD em camadas](./03-backend-ddd-camadas.md)
