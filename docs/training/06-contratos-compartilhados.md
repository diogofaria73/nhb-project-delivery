# 06 — Contratos compartilhados

`packages/shared` é o **traço de união** entre backend e frontend. Capítulo curto, mas conceito importante.

---

## O problema sem `shared`

Imagine que o backend define:

```typescript
// apps/api/src/.../project-tracking-response.dto.ts
export class ProjectImportResponseDto {
  id: string;
  status: 'PENDING' | 'ACTIVE' | 'SUPERSEDED' | 'FAILED';
  rowsAccepted: number;
}
```

E o frontend, manualmente, redefine:

```typescript
// apps/web/src/types/project-import.ts
export interface ProjectImport {
  id: string;
  status: 'PENDING' | 'ACTIVE' | 'SUPERSEDED';   // ← esqueceu o FAILED!
  rowsAccepted: number;
}
```

O TypeScript do frontend está feliz. Em produção, quando vier `status: 'FAILED'`, o frontend nem trata — bug silencioso.

**Solução:** definir o tipo **uma vez** em um pacote consumido pelos dois.

---

## Onde está

```
packages/shared/
├── src/
│   ├── types/
│   │   ├── api-response.ts                ApiResponse<T>, ApiError
│   │   └── project-tracking-contracts.ts  Tudo do dashboard + imports
│   └── index.ts                            re-exporta tudo
├── package.json
└── tsconfig.json
```

A entrada pública é `index.ts`:

```typescript
// packages/shared/src/index.ts
export * from './types/api-response';
export * from './types/project-tracking-contracts';
```

E **tanto back quanto front** importam assim:

```typescript
import { DashboardResponseDto, ProjectStatus } from '@nhb-status-report/shared';
```

---

## O que vai em `shared` e o que NÃO vai

### ✅ Vai em `shared`

- **Interfaces de DTO** — `ProjectImportResponseDto`, `DashboardResponseDto`
- **Enums e tipos literais** — `ProjectStatus`, `ProjectImportStatus`
- **Tipos derivados de contratos** — `ParseRowError`, `BiSanityDiff`, `DashboardHeaderDto`, `KpiDto`
- **Envelope genérico de resposta** — `ApiResponse<T>`, `ApiError`

### ❌ Não vai em `shared`

- **Decorators do `class-validator`** — vivem na DTO do backend
- **Schemas Zod / Yup** — viveriam na feature do frontend
- **Funções utilitárias com `fetch`/`axios`** — frontend
- **Acesso ao Prisma** — backend
- **Lógica de negócio** — pertence a `domain/` do backend
- **Componentes React** — frontend

Regra simples: **se for `interface`, `type` ou `enum`, pode vir. Se for `class` ou `function` executável, não.**

---

## Por que `shared` só tem tipos

Tipos do TypeScript **somem em runtime**. Eles são apagados no build, restando só os JS. Isso significa:

- `shared` não tem custo de bundle no frontend
- `shared` não precisa rodar em Node antes do backend
- `shared` não pode quebrar nada porque não executa nada

Se você botar uma `class` lá, ela vira código real, e aí surgem perguntas embaraçosas:

- Essa classe foi instanciada com `new` no browser ou no Node? (Comportam diferente.)
- Ela depende de `crypto`, `Buffer`, ou alguma API só do Node? (Quebra no browser.)
- Quando rebuildar? (`shared` precisa rebuildar antes de back/front.)

Manter `shared` 100% declarativo (tipos puros) evita tudo isso.

---

## Exemplo: o ciclo de uma mudança de contrato

Cenário: o PMO quer ver, no dashboard, **a sigla do BU** (Business Unit) de cada projeto.

### Passo 1 — Edite o contrato

`packages/shared/src/types/project-tracking-contracts.ts`:

```typescript
export interface ProjectRowDto {
  snapshotId: string;
  projectId: string;
  projectName: string;
  projectStatus: ProjectStatus;
  pm?: string;
  buShort?: string;       // ← novo campo
  // ...
}
```

### Passo 2 — Build do `shared`

```bash
pnpm --filter @nhb-status-report/shared build
```

> Em dev com `pnpm dev` rodando, geralmente o TS server já pega via "live types". Mas se intellisense parecer travado, rebuild.

### Passo 3 — Backend: popular o campo

O TypeScript do backend agora exige `buShort` em algum lugar onde o `ProjectRowDto` é construído. Você abre o repositório/use case que monta a resposta do dashboard e adiciona o mapeamento:

```typescript
// apps/api/src/modules/project-tracking/infrastructure/repositories/prisma-dashboard.repository.ts
return rows.map((row) => ({
  // ...
  buShort: extractBu(row.projectName),   // ou de uma nova coluna do snapshot
}));
```

> Se o campo precisar vir da planilha, isso pode envolver atualizar o `row-mapper` e talvez o schema Prisma. Veremos migrations no cap 07.

### Passo 4 — Frontend: exibir

```tsx
// apps/web/src/features/project-tracking/components/project-table.tsx
<TableCell>
  {row.buShort ?? '—'}
</TableCell>
```

### Passo 5 — Um commit, um PR

Todas as mudanças (shared + back + front) **no mesmo commit**, **no mesmo PR**. Isso é o que torna refatorar contratos seguro no monorepo.

---

## ApiResponse — envelope padrão

`shared/types/api-response.ts` define:

```typescript
export interface ApiResponse<T> {
  data: T;
  error?: ApiError;
  pagination?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
```

> ⚠️ Note: o **backend de produção** desse projeto retorna majoritariamente o `data` direto, sem o envelope. Esse contrato existe para casos paginados e respostas com erro estruturado. Verifique como cada endpoint específico responde antes de assumir o envelope em todos os lugares.

---

## E quando o tipo é interno de um lado só?

Se um tipo é **só do backend** (ex.: representação interna do parser), ele **não vai** para `shared`. Vive em `apps/api/src/modules/project-tracking/infrastructure/parsers/types.ts`.

Se um tipo é **só do frontend** (ex.: estado interno de um wizard), vive em `apps/web/src/features/<feature>/types/`.

**`shared` é o ponto de encontro**, não o depósito de tudo.

---

## Gotchas comuns

1. **Esqueceu de exportar no `index.ts`** — você adiciona o tipo em `types/algo.ts` mas não re-exporta no `index.ts`. Import não acha. Sempre **export * from './types/algo'** no `index.ts`.
2. **Renomeou um campo só do front** — o backend continuou enviando o nome antigo. Sintoma: campo aparece `undefined` na UI. Sempre rode o backend depois de editar contrato.
3. **Tipo com `Date` puro** — `Date` serializa como string em JSON. O `shared` deve declarar como `string` (ISO 8601) e cada lado converte se precisar.
4. **Enum com valores diferentes do Prisma** — `ProjectStatus` no `shared` precisa **bater 1:1** com o enum no `schema.prisma`. Se Prisma tem 5 valores e shared tem 4, vai quebrar em runtime.

---

## 🛠 Exercício

1. Abra `packages/shared/src/types/project-tracking-contracts.ts`. Liste:
   - Quantas `interface`/`type`/`enum` existem?
   - Existe alguma `class` ou `function` executável? (Não deveria.)
2. Abra `packages/shared/src/index.ts`. Todas as exportações de `types/` estão re-exportadas? (Devem estar.)
3. Confira que `ProjectStatus` no `shared` tem **exatamente** os mesmos valores que o enum `ProjectStatus` em `apps/api/prisma/schema.prisma` (linhas 15–21).
4. **Quebre de propósito** (não comite!): rename um campo de `ProjectRowDto` em `shared`. Rebuild. Veja quantos erros TypeScript surgem no backend e no frontend. Reverta.
5. (Reflexão) Suponha que o backend precise enviar um campo experimental que **só faz sentido no debug** e **não deveria vazar para o frontend**. Onde você definiria esse tipo?

**Critério de pronto:** você sabe quando criar um tipo em `shared` vs num app específico, e por que `shared` não tem código executável.

➡️ Próximo: [07 — Prisma & migrations](./07-prisma-e-migrations.md)
