# 07 — Prisma & migrations

Quem manda no schema do banco neste projeto é o **Prisma**. Aqui você aprende como ele funciona, como criar mudanças com segurança e como evitar os pés-de-orelha mais comuns.

---

## O que é Prisma

Três coisas:

1. **`schema.prisma`** — descrição declarativa do banco (modelos, relações, índices). Linguagem própria.
2. **CLI `prisma`** — gera código, gera migrations, aplica migrations, abre o Studio.
3. **Prisma Client** — biblioteca TypeScript que dá acesso tipado ao banco. Gerada a partir do schema.

Por que escolhemos Prisma:

- **Tipos 100% gerados** — se você acrescenta um campo `buShort` ao `ProjectSnapshot`, o `prisma.projectSnapshot.findMany()` já entende. Sem `any`, sem `Record<string, unknown>`.
- **Migrations versionadas** — cada mudança no schema vira um arquivo SQL versionado em `prisma/migrations/`.
- **Studio embutido** — `pnpm prisma:studio` abre uma UI pra inspecionar/editar dados.

---

## Onde tudo vive

```
apps/api/
├── prisma/
│   ├── schema.prisma                     ← schema declarativo
│   ├── seed.ts                           ← script que cria o admin inicial
│   └── migrations/
│       ├── 20260609135949_init/
│       │   └── migration.sql
│       ├── 20260609144102_must_change_password/
│       │   └── migration.sql
│       └── ... (uma pasta por migration, com SQL puro)
└── src/
    └── shared/infrastructure/database/
        ├── prisma.module.ts              ← módulo global
        └── prisma.service.ts             ← extends PrismaClient
```

---

## O `schema.prisma` resumido

Linhas reais (de `apps/api/prisma/schema.prisma`):

```prisma
enum Role {
  ADMINISTRATOR
  USER
}

enum ProjectStatus {
  ACTIVE
  ON_HOLD
  COMPLETED
  CANCELLED
  NOT_STARTED
}

enum ProjectImportStatus {
  PENDING
  PROCESSING
  ACTIVE
  SUPERSEDED
  FAILED
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  role      Role     @default(USER)
  // ...
  imports   ProjectImport[]
  @@map("users")
}

model ProjectImport {
  id               String              @id @default(uuid())
  referenceYear    Int                 @map("reference_year")
  status           ProjectImportStatus @default(PENDING)
  // ...
  importedBy User              @relation(fields: [importedById], references: [id])
  snapshots  ProjectSnapshot[]
  @@index([referenceYear, status])
  @@index([importedAt])
  @@map("project_imports")
}

model ProjectSnapshot {
  id          String        @id @default(uuid())
  importId    String        @map("import_id")
  projectId   String        @map("project_id")
  // ...
  import ProjectImport @relation(fields: [importId], references: [id], onDelete: Cascade)
  @@index([importId])
  @@index([importId, projectStatus])
  @@map("project_snapshots")
}
```

### Coisas a notar

| Diretiva | O que faz |
| --- | --- |
| `@id @default(uuid())` | PK gerada como UUID |
| `@unique` | Índice único |
| `@map("column_name")` | Mapeia o campo TS (camelCase) para a coluna SQL (snake_case) |
| `@@map("table_name")` | Mapeia o model TS para a tabela SQL |
| `@@index([...])` | Cria índice composto |
| `@relation(..., onDelete: Cascade)` | Se o `ProjectImport` for deletado, seus `ProjectSnapshot` somem junto |

### Convenções neste projeto

- Tabelas em **snake_case plural**: `users`, `project_imports`, `project_snapshots`
- Campos em **snake_case** no SQL (via `@map`) e **camelCase** no código TS
- PKs sempre UUID (não `int autoincrement`) — facilita merge entre ambientes
- **Sempre `onDelete: Cascade`** quando há ownership clara (snapshot é dono de import? não — import é dono de snapshot)

---

## Fluxo de mudança no schema

Cenário: adicionar `criticality` ao `ProjectSnapshot`.

### Passo 1 — Edite `schema.prisma`

```prisma
model ProjectSnapshot {
  // ...
  criticality String?   @map("criticality")   // opcional, então nullable
  // ...
}
```

### Passo 2 — Crie a migration

```bash
pnpm --filter @nhb-status-report/api prisma:migrate
```

Prisma vai:

1. Comparar o schema atual com o estado do banco
2. Pedir um **nome** para a migration (use kebab-case descritivo: `add-criticality-to-snapshot`)
3. Gerar o SQL em `prisma/migrations/<timestamp>_<name>/migration.sql`
4. Aplicar no banco local
5. Regenerar o Prisma Client

### Passo 3 — Use o campo no código

O Prisma Client agora reconhece `criticality`. Você pode:

```typescript
await this.prisma.projectSnapshot.findMany({
  where: { criticality: 'HIGH' },
});
```

### Passo 4 — Commit

Commit **junto**:

- `prisma/schema.prisma` editado
- `prisma/migrations/<timestamp>_add-criticality-to-snapshot/migration.sql` novo
- Qualquer código que usa o campo

**Nunca** comite o schema editado sem a migration correspondente.

---

## Migrations em produção

Em **dev** usamos `prisma migrate dev`, que gera + aplica. Em **produção** usamos `prisma migrate deploy`, que **só aplica** migrations existentes (não gera novas, não pergunta nada).

```bash
# Em dev — gera + aplica
pnpm --filter @nhb-status-report/api prisma:migrate

# Em produção — só aplica (o que o entrypoint.sh do Docker chama)
pnpm --filter @nhb-status-report/api prisma:migrate:prod
```

> Veja `apps/api/entrypoint.sh` — em prod, o container roda `prisma migrate deploy` ao iniciar, depois o seed (idempotente), depois sobe o NestJS.

---

## Escape hatches — quando `prisma migrate dev` falha

Às vezes o estado do banco local diverge das migrations (você fez um experimento manual, ou mexeu direto no banco). O Prisma reclama:

```
Drift detected: Your database schema is not in sync with your migration history.
```

Você tem 3 opções:

### Opção 1 — Reset (apaga tudo, recria)

```bash
pnpm --filter @nhb-status-report/api prisma migrate reset
```

Apaga TODOS os dados. **Roda o seed no fim** — você fica com o admin de volta.

> Use **só em dev**. Nunca em staging/prod.

### Opção 2 — Criar a migration manualmente

Se você sabe SQL e quer controlar o que vai acontecer:

```bash
mkdir -p apps/api/prisma/migrations/$(date +%Y%m%d%H%M%S)_descrição/
# escreva o SQL no arquivo migration.sql
pnpm --filter @nhb-status-report/api prisma migrate deploy
```

Útil quando o `migrate dev` quer fazer algo destrutivo (ex.: dropar coluna com dados) que você quer evitar com um `ALTER` mais cuidadoso.

### Opção 3 — `db push` (sem migration, só pra prototipar)

```bash
pnpm --filter @nhb-status-report/api prisma db push
```

Sincroniza schema → banco **sem** gerar arquivo de migration. **Nunca comite** sem depois rodar `migrate dev` para gerar a migration de verdade.

---

## `PrismaService` — como o resto do código usa

Em `apps/api/src/shared/infrastructure/database/prisma.service.ts`:

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

E o `PrismaModule` é **global** (`@Global()`), então qualquer repositório pode injetar `PrismaService` sem precisar importar o módulo:

```typescript
@Injectable()
export class PrismaProjectImportRepository implements IProjectImportRepository {
  constructor(private readonly prisma: PrismaService) {}
  // ...
}
```

---

## Transações

Para operações que **devem suceder/falhar juntas** (ex.: marcar import anterior como `SUPERSEDED` **e** criar o novo como `ACTIVE`), use `$transaction`:

```typescript
await this.prisma.$transaction(async (tx) => {
  await tx.projectImport.updateMany({
    where: { referenceYear, status: 'ACTIVE' },
    data: { status: 'SUPERSEDED' },
  });
  const created = await tx.projectImport.create({
    data: { /* ... */ status: 'ACTIVE' },
  });
  await tx.projectSnapshot.createMany({
    data: snapshots.map((s) => ({ importId: created.id, ...s })),
  });
  return created;
});
```

Se qualquer linha jogar exceção, **tudo é revertido**.

> ⚠️ **Não use o `prisma` global dentro de uma `$transaction`** — só o `tx` recebido. Senão você está fora da transação.

---

## Prisma Studio

UI gráfica para inspecionar dados:

```bash
pnpm --filter @nhb-status-report/api prisma:studio
# abre http://localhost:5555
```

Você pode:

- Filtrar e ordenar linhas
- Editar valores (cuidado)
- Ver relações com 1 clique

Útil para debugar testes manuais. **Não use em produção** (nenhum controle de acesso).

---

## Anti-padrões que rejeitamos

| Anti-padrão | Por que ruim | O correto |
| --- | --- | --- |
| `prisma.user.findMany()` num controller | Pula a camada de repositório | Crie método na interface + impl |
| Editar migration antiga | Outros ambientes já aplicaram o SQL antigo | Crie nova migration que corrige |
| `prisma db push` antes do `migrate dev` | Schema fica em estado inconsistente | Sempre `migrate dev` para gerar arquivo |
| Comitar `schema.prisma` sem migration | Próximo dev não consegue reproduzir o banco | Sempre commit conjunto |
| Usar Prisma fora de `infrastructure/repositories/` | Acopla domínio à tecnologia | Adicione método ao repositório |

---

## 🛠 Exercício

1. Abra `apps/api/prisma/schema.prisma`. Encontre todos os `@@index`. Por que `project_imports` precisa de índice em `(referenceYear, status)` mas `users` não precisa de índice algum?
2. Olhe a pasta `apps/api/prisma/migrations/`. Quantas migrations existem? Abra o `migration.sql` da mais recente — você consegue inferir o que ela mudou?
3. (Não comite!) Adicione um campo `notes: String?` ao model `User`. Rode `pnpm --filter @nhb-status-report/api prisma:migrate`. Veja o SQL gerado. Reverta tudo (apague a migration e o campo, rode `prisma migrate reset`).
4. Em `prisma-project-import.repository.ts`, encontre uma transação. Liste tudo o que acontece dentro dela. Se a 3ª operação falhar, o que volta atrás?
5. Pergunta de revisão de PR: um colega manda um PR que edita `schema.prisma` mas **não tem nenhuma migration nova**. O que você comenta?

**Critério de pronto:** dado um schema atual e uma mudança pedida, você sabe **gerar a migration corretamente** e **explicar a diferença entre `migrate dev` e `migrate deploy`**.

➡️ Próximo: [08 — Fluxo de desenvolvimento](./08-fluxo-de-desenvolvimento.md)
