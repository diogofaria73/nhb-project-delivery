# 03 — Backend: DDD em camadas

Este capítulo é o mais conceitual do tutorial. Leia com calma. Os capítulos 04 e 10 vão **aplicar** o que está aqui — sem entender este, eles parecem mágica.

---

## O problema que DDD resolve

Sem disciplina, um backend cresce assim:

```
src/
├── controllers/
├── services/
├── repositories/
└── models/
```

No começo funciona. Após 6 meses:

- `UserService` chama `CompanyService` que chama `EmailService` que chama `UserService` (loops)
- A regra "usuário admin pode redefinir senha de qualquer um" está em **3 lugares diferentes**, com **3 redações ligeiramente diferentes**
- Trocar Postgres por Mongo exige tocar em 80 arquivos
- Testar uma regra de negócio exige instanciar 12 dependências

**DDD (Domain-Driven Design)** resolve organizando o código por **bounded context** (domínio) e separando em **camadas com regras de dependência claras**.

---

## Bounded context = módulo

No nosso projeto, cada **módulo** é um bounded context. Hoje temos três:

```
apps/api/src/modules/
├── auth/                  ← autenticação
├── users/                 ← gestão de usuários
└── project-tracking/      ← importação e dashboard
```

**Regra de ouro:** um módulo **nunca importa arquivos internos** de outro módulo. Se `project-tracking` precisa de algo de `users`, ele importa só do `users.module.ts` exportado, não de uma classe interna.

Por que? Porque módulos diferentes representam **idiomas diferentes**. "User" no contexto de `auth` é "alguém que faz login com email/senha". "User" no contexto de `project-tracking` é "quem importou esta planilha". Cada módulo deveria poder evoluir seus modelos internos sem quebrar os outros.

---

## As 4 camadas

Dentro de cada módulo, você sempre verá esta estrutura (template no `project-tracking`):

```
modules/<domain>/
├── domain/              ← 1. Regras puras de negócio
├── application/         ← 2. Orquestração (casos de uso)
├── infrastructure/      ← 3. Detalhes técnicos (banco, parser, storage)
└── presentation/        ← 4. Adaptadores HTTP (controllers)
```

Cada camada tem um papel **único**. Confundir os papéis é o erro mais comum de quem está começando.

---

### 1. `domain/` — o coração

**Contém:**

- `entities/` — objetos com identidade e ciclo de vida (`User`, hipoteticamente `Project`)
- `repositories/` — **interfaces** (`IProjectImportRepository`) — só o contrato, sem implementação
- `services/` — lógica de domínio pura que não cabe numa única entity (ex.: `IsoWeekService` que calcula semana ISO de uma data)
- `errors/` — exceções do domínio (`InvalidImportStatusError`)

**Regras:**

- **Zero dependências de framework.** Nada de `@nestjs/...`, nada de `@prisma/...`. Só TypeScript puro.
- Se você apagar o NestJS amanhã, esta pasta **deveria continuar funcionando**.
- Funções e classes aqui são **testáveis em microssegundos** — sem mocks complicados.

**Exemplo real** (`apps/api/src/modules/project-tracking/domain/services/iso-week.service.ts`):

```typescript
@Injectable()
export class IsoWeekService {
  /** Returns the ISO 8601 week number (1-53) for the given date. */
  getIsoWeek(date: Date): number {
    // pure math on date — no DB, no HTTP, no nothing
    ...
  }
}
```

> 🤔 "Mas tem `@Injectable()`, isso não é framework?" Sim, é um leve vazamento. Para o tamanho deste projeto vale a pena (DI é util). O importante é que essa classe **não puxa rede, banco, ou estado** — então testá-la é trivial.

---

### 2. `application/` — os casos de uso

**Contém:**

- `use-cases/` — **uma classe por caso de uso** (`ConfirmImportUseCase`, `GetDashboardUseCase`)
- `dtos/` — Data Transfer Objects (`ConfirmImportDto`) com validações `class-validator`

**Um use case faz isto:**

1. Recebe um input (validado pelo DTO)
2. Coordena chamadas para `domain/` (regras) e `infrastructure/` (repositórios, parsers)
3. Devolve um output (outra DTO ou um id)

**Exemplo conceitual:**

```typescript
@Injectable()
export class ConfirmImportUseCase {
  constructor(
    @Inject(PROJECT_IMPORT_REPOSITORY)
    private readonly repo: IProjectImportRepository,    // ← interface, não implementação
    private readonly parser: SpreadsheetParser,
    @Inject(STORAGE_PROVIDER)
    private readonly storage: IStorageProvider,
  ) {}

  async execute(input: ConfirmImportInput): Promise<ProjectImportResponseDto> {
    // 1. valida regras de negócio
    // 2. parse + sanity check
    // 3. salva arquivo no storage
    // 4. cria ProjectImport ACTIVE em transação, marcando anterior como SUPERSEDED
    // 5. devolve DTO
  }
}
```

**Regras:**

- **Um arquivo = um use case.** Não junte `ListImports` e `GetImport` na mesma classe. Casos de uso mudam por razões diferentes.
- **Injete interfaces, não implementações.** O construtor recebe `IProjectImportRepository`, não `PrismaProjectImportRepository`. Isso permite trocar Prisma por outra coisa sem tocar no use case.

---

### 3. `infrastructure/` — os detalhes técnicos

**Contém:**

- `repositories/` — implementações dos repos (`PrismaProjectImportRepository`, que usa `PrismaService`)
- `parsers/`, `storage/`, `email/`, … — qualquer adaptador para mundo externo

**Regras:**

- Esta camada **conhece** Prisma, ExcelJS, S3, e tudo o que for "tecnologia".
- Implementa interfaces definidas em `domain/`.
- Use cases dependem da **interface**, não do arquivo desta camada.

**Exemplo conceitual:**

```typescript
// domain/repositories/project-import.repository.ts
export const PROJECT_IMPORT_REPOSITORY = 'IProjectImportRepository';

export interface IProjectImportRepository {
  findActiveByYear(year: number): Promise<ProjectImportRecord | null>;
  createAsActiveTransactional(...): Promise<ProjectImportRecord>;
}

// infrastructure/repositories/prisma-project-import.repository.ts
@Injectable()
export class PrismaProjectImportRepository implements IProjectImportRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveByYear(year: number) { ... }
  createAsActiveTransactional(...) { ... }
}
```

---

### 4. `presentation/` — o adaptador HTTP

**Contém:**

- `controllers/` — endpoints HTTP
- `filters/` — mapeiam erros de domínio para status HTTP

**Regras:**

- **Controllers não contêm lógica.** Só:
  1. Recebem o request (com guards/decorators do NestJS)
  2. Chamam o use case
  3. Devolvem o resultado
- Se você se pegar escrevendo `if (...) { ... }` num controller além de validação de input, **pare** — isso vai pra um use case ou pra `domain/`.

**Exemplo real** (`project-tracking.controller.ts:107`):

```typescript
@Get('imports')
@Roles('ADMINISTRATOR')
@ApiOperation({ summary: 'List imports with optional filters' })
list(@Query() query: ListImportsDto) {
  return this.listImports.execute(query);
}
```

O controller só faz um **adapter** entre HTTP e use case. Trocar HTTP por GraphQL amanhã significa criar outro controller, sem tocar no use case.

---

## A regra de dependência (a mais importante)

Camadas internas **nunca importam de camadas externas**. Setas só apontam pra dentro:

```
presentation  →  application  →  domain
                        ↓
                infrastructure  →  domain
```

Leia: **`domain` não importa de ninguém. `application` importa de `domain`. `infrastructure` implementa interfaces de `domain`. `presentation` importa de `application` (chama use cases).**

> ⛔ Se um controller importa direto de `infrastructure/`, **isso é um bug arquitetural**. Você está pulando o use case e adicionando lógica no controller, ou está acoplando o controller à tecnologia escolhida no banco.

---

## Injeção de dependência: o cimento que une tudo

NestJS resolve dependências por **construtor**. Quando você escreve:

```typescript
constructor(private readonly repo: IProjectImportRepository) {}
```

o Nest precisa saber **qual classe instanciar** para esse parâmetro. Como `IProjectImportRepository` é uma interface (não existe em runtime no JS), a gente usa um **token string**:

```typescript
// domain/repositories/project-import.repository.ts
export const PROJECT_IMPORT_REPOSITORY = 'IProjectImportRepository';
```

E no módulo, registramos a ligação:

```typescript
// project-tracking.module.ts:28
{ provide: PROJECT_IMPORT_REPOSITORY, useClass: PrismaProjectImportRepository },
```

E o use case decora o parâmetro com `@Inject`:

```typescript
constructor(
  @Inject(PROJECT_IMPORT_REPOSITORY)
  private readonly repo: IProjectImportRepository,
) {}
```

Resultado: o use case **nunca sabe** que é Prisma. Para trocar por outro ORM, você muda **uma linha** no módulo.

---

## Wiring: o `*.module.ts`

Cada módulo tem um arquivo `<domain>.module.ts` que registra:

- **`imports`** — outros módulos NestJS que este precisa (ex.: `StorageModule`)
- **`controllers`** — controllers do módulo (presentation)
- **`providers`** — tudo que é injetável: use cases, repositórios (com `provide` + `useClass`), services de domínio, filters

Exemplo do `project-tracking.module.ts:23-42`:

```typescript
@Module({
  imports: [StorageModule],
  controllers: [ProjectTrackingController],
  providers: [
    IsoWeekService,
    { provide: PROJECT_IMPORT_REPOSITORY, useClass: PrismaProjectImportRepository },
    { provide: DASHBOARD_REPOSITORY, useClass: PrismaDashboardRepository },
    ParseAndPreviewImportUseCase,
    ConfirmImportUseCase,
    // ... outros use cases
    { provide: APP_FILTER, useClass: ProjectTrackingExceptionFilter },
  ],
})
export class ProjectTrackingModule {}
```

E o `app.module.ts` da raiz importa esse módulo:

```typescript
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectTrackingModule,   // ← aqui
  ],
})
export class AppModule {}
```

---

## `shared/` — concerns transversais

Algumas coisas não pertencem a um módulo específico — pertencem a todos. Elas vivem em `apps/api/src/shared/`:

```
shared/
├── domain/
│   ├── base.entity.ts                 # classe base para entities (id, timestamps)
│   └── pagination.interface.ts
└── infrastructure/
    ├── database/                       # PrismaModule + PrismaService (global)
    ├── decorators/                     # @CurrentUser, @Public, @Roles
    ├── filters/                        # HttpExceptionFilter global
    ├── guards/                         # JwtAuthGuard, RolesGuard
    └── storage/                        # IStorageProvider (interface) + impls
```

**Regra:** se algo é usado por **mais de um módulo** **e** não tem regra de negócio específica de domínio, é candidato a entrar em `shared/`. Caso contrário, fica no módulo.

---

## Convenções de nomenclatura (memorize)

Arquivos sempre em **kebab-case**:

| Tipo | Padrão | Exemplo |
| --- | --- | --- |
| Arquivos | `<nome>.<tipo>.ts` | `confirm-import.use-case.ts` |
| Classes | `PascalCase` + sufixo | `ConfirmImportUseCase`, `ProjectTrackingController` |
| Interfaces | `I` + `PascalCase` | `IProjectImportRepository` |
| Tokens DI | `SCREAMING_SNAKE` | `PROJECT_IMPORT_REPOSITORY` |
| DTOs de entrada | `[Verb][Entity]Dto` | `ConfirmImportDto`, `ListImportsDto` |
| DTOs de saída | `[Entity]ResponseDto` | `ProjectImportResponseDto` |
| Use cases | `[Verb][Entity]UseCase` | `ConfirmImportUseCase` |
| Repos (interface) | `I[Entity]Repository` | `IProjectImportRepository` |
| Repos (impl) | `Prisma[Entity]Repository` | `PrismaProjectImportRepository` |

---

## Forbidden patterns (rejeitamos em code review)

- `any` em TypeScript — use `unknown` e estreite, ou defina o tipo correto
- `console.log` — use o `Logger` do NestJS
- **Import relativo cruzando camadas** — `../../domain/...` num controller é um cheiro forte
- **Lógica em controller** — controllers só adaptam HTTP, nunca decidem nada
- **Acesso direto ao banco fora de repositório** — Prisma só dentro de `infrastructure/repositories/`
- **Default exports** — sempre named exports
- **Barrel `index.ts` em pasta com 1 arquivo** — só faça barrel quando tiver vários itens

---

## 🛠 Exercício

1. Abra os três módulos (`auth`, `users`, `project-tracking`) e responda:
   - Qual deles tem `domain/entities/`? (provavelmente só `users`)
   - Por que `project-tracking` **não tem** entities próprias e usa direto os tipos do Prisma? (Dica: olhe o `domain/repositories/project-import.repository.ts` e veja o `ProjectImportRecord`.)
2. Abra `apps/api/src/modules/users/users.module.ts`. Liste:
   - Quantos use cases ele registra?
   - Qual é a ligação de interface→implementação do repositório de usuários?
3. Em `apps/api/src/modules/project-tracking/application/use-cases/confirm-import.use-case.ts`, conte:
   - Quantas dependências o construtor recebe?
   - Quantas delas são **interfaces** vs **classes concretas**?
4. (Hipotético) Se você quisesse trocar Prisma por TypeORM, **quantos arquivos você teria que editar** no módulo `project-tracking`?
   - Dica: a resposta é "muito poucos". Tente listar quais.

**Critério de pronto:** dado um arquivo qualquer do backend, você consegue dizer **em qual camada ele está** e **por quê**.

➡️ Próximo: [04 — Walkthrough: project-tracking](./04-walkthrough-project-tracking.md)
