# 04 — Walkthrough: project-tracking

Vamos seguir o caminho exato de uma requisição **`POST /api/project-tracking/imports/preview`** — do HTTP até o último byte que o parser lê da planilha — passando por todas as camadas que aprendemos no capítulo 03.

> Mantenha o repo aberto no editor. Abra cada arquivo citado conforme o tutorial avança. Não tente memorizar — entenda o fluxo.

---

## A request

O administrador clica em "Upload" no frontend, escolhe `StatusReportBI_2026.xlsx`, e o web envia:

```http
POST /api/project-tracking/imports/preview
Content-Type: multipart/form-data; boundary=...
Authorization: Bearer <jwt-do-admin>

referenceYear=2026
file=<bytes do xlsx>
```

Nada acontece no banco. É um **dry-run**: vamos parsear, validar e devolver um relatório, sem persistir.

---

## Estação 1 — Entrada HTTP: o controller

**Arquivo:** `apps/api/src/modules/project-tracking/presentation/controllers/project-tracking.controller.ts`

Olhe a definição da rota (linhas 64–81):

```typescript
@Post('imports/preview')
@Roles('ADMINISTRATOR')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Parse the spreadsheet and return a dry-run report' })
@UseInterceptors(
  FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
)
async preview(
  @UploadedFile() file: Express.Multer.File | undefined,
  @Body() dto: PreviewImportDto,
) {
  this.assertXlsx(file);
  return this.parseAndPreview.execute({
    buffer: file!.buffer,
    originalFilename: file!.originalname,
    referenceYear: dto.referenceYear,
  });
}
```

O que cada decorator/parte faz:

| Linha | O quê | Por quê |
| --- | --- | --- |
| `@Post('imports/preview')` | Mapeia método+rota | Junto com `@Controller('project-tracking')` (linha 50) → `POST /project-tracking/imports/preview`. O prefixo global `/api` (em `main.ts`) faz o caminho final ser `/api/project-tracking/imports/preview`. |
| `@Roles('ADMINISTRATOR')` | Apenas admin | Consumido pelo `RolesGuard` (registrado no controller via `@UseGuards(RolesGuard)` na linha 49). Sem isso, qualquer usuário autenticado poderia chamar. |
| `@HttpCode(HttpStatus.OK)` | Força 200 | Default do POST seria 201, mas semanticamente preview não cria nada. |
| `@UseInterceptors(FileInterceptor(...))` | Habilita upload | Multer parseia `multipart/form-data` e popula `req.file`. Limite de 10MB previne DoS. |
| `@UploadedFile()` | Injeta o arquivo | O `?` é importante: pode chegar `undefined` (sem arquivo). Validamos com `assertXlsx`. |
| `@Body() dto: PreviewImportDto` | Lê o resto do form | O `ValidationPipe` global (config em `main.ts`) valida o DTO com `class-validator`. |
| `this.assertXlsx(file)` | Validação custom | Confere MIME type e tamanho. Lança `BadRequestException` (→ 400) se inválido. |
| `this.parseAndPreview.execute(...)` | **Chama o use case** | A única lógica do controller. |

> Note o que **não está aqui**: nenhuma chamada a Prisma, nenhum cálculo, nenhum `if` de regra de negócio. **Controller é só adapter.**

---

## Estação 2 — A DTO de entrada

**Arquivo:** `apps/api/src/modules/project-tracking/application/dtos/preview-import.dto.ts`

```typescript
export class PreviewImportDto {
  @IsInt()
  @Min(2020)
  @Max(2099)
  @Type(() => Number)   // ← form-data manda string; transform para number
  referenceYear: number;
}
```

`class-validator` + `class-transformer` validam **antes** do controller rodar. Se `referenceYear` for `"abc"`, o cliente recebe um 400 com mensagem detalhada — você não precisou escrever nenhum `if`.

> 💡 Sempre que um endpoint receber input do mundo, **defina uma DTO**. Validações ficam declarativas, documentação Swagger sai de graça.

---

## Estação 3 — O use case

**Arquivo:** `apps/api/src/modules/project-tracking/application/use-cases/parse-and-preview-import.use-case.ts`

A responsabilidade dele:

1. Calcular o `sha256` do buffer (idempotência: se for o **mesmo arquivo** já confirmado, podemos avisar)
2. Chamar o **parser** (camada `infrastructure`)
3. Buscar o import `ACTIVE` anterior do mesmo ano (camada `infrastructure` via repositório) para calcular o **delta**
4. Rodar o **bi-sanity-checker**
5. Retornar um **`ParseReportDto`** sem persistir nada

```typescript
@Injectable()
export class ParseAndPreviewImportUseCase {
  constructor(
    private readonly parser: SpreadsheetParser,
    @Inject(PROJECT_IMPORT_REPOSITORY)
    private readonly importRepo: IProjectImportRepository,
    private readonly isoWeek: IsoWeekService,
  ) {}

  async execute(input: ParseInput): Promise<ParseReportDto> {
    const sha256 = computeSha256(input.buffer);
    const parsed = await this.parser.parse(input.buffer, input.referenceYear);
    const previousActive = await this.importRepo.findActiveByYear(input.referenceYear);
    const delta = computeDelta(parsed.snapshots, previousActive?.snapshots ?? []);
    return buildPreviewReport({ parsed, delta, sha256, /* ... */ });
  }
}
```

**Observe a injeção de dependência:**

- `SpreadsheetParser` é classe concreta, mas é parte do **mesmo módulo** e é puro (sem rede / sem banco) — ok injetar direto.
- `IProjectImportRepository` é **interface** — injetada via token `PROJECT_IMPORT_REPOSITORY`. O use case nunca sabe que existe Prisma.
- `IsoWeekService` é serviço de domínio puro.

> 🧪 **Por que isso é testável:** num teste unitário, você passa um `mockedImportRepo: IProjectImportRepository` e o parser real (que opera em memória sobre um Buffer). Sem subir banco, sem subir HTTP, sem rede. Centenas de cenários em segundos.

---

## Estação 4 — O parser

**Pasta:** `apps/api/src/modules/project-tracking/infrastructure/parsers/`

A pasta tem várias peças que se compõem:

```
parsers/
├── spreadsheet.parser.ts        ← orquestrador (recebe Buffer → ParsedSpreadsheet)
├── header-normalizer.ts         ← "Semana 1" → índice 0
├── row-mapper.ts                ← converte linha bruta em ProjectSnapshot
├── status-mapper.ts             ← "Em Andamento" → ProjectStatus.ACTIVE
├── delta-calculator.ts          ← compara com import anterior
├── bi-sanity-checker.ts         ← valida totais contra a aba BI
└── types.ts                     ← ParsedSpreadsheet, ParseError, ...
```

Pontos importantes desta camada:

### 4.1 Tudo é **função pura** ou classe sem estado externo

O parser recebe `Buffer` e devolve `ParsedSpreadsheet`. Não há cache, não há banco, não há `Date.now()` espalhado. Por isso esta camada tem **specs unitários** ricos (`status-mapper.spec.ts`, `header-normalizer.spec.ts`, etc.).

### 4.2 Erros são **dados**, não exceções

Quando uma linha está malformada, o parser **não lança** — ele empurra um `ParseRowError` para um array. No final, o `ParseReport` tem:

```typescript
{
  rowsAccepted: 47,
  rowsRejected: 3,
  rowErrors: [
    { row: 12, column: 'Manager', message: 'Required' },
    { row: 18, column: 'Semana 1', message: 'Invalid value: "X"' },
    { row: 23, column: 'Project', message: 'Duplicate id' },
  ],
}
```

Por quê? Porque rejeitar a planilha **inteira** por uma célula esquecida seria horrível para o PMO. Reporta as ruins, processa as boas.

### 4.3 BI sanity check é **observação, não bloqueio**

A aba `BI` da planilha tem totais consolidados (ex.: "Total de projetos por status"). Nosso parser **recalcula** esses totais a partir das linhas e compara. Divergências viram **warnings** no parse report, mas **não impedem** confirm. (Detalhes em `BR-` na spec US-08.)

---

## Estação 5 — O repositório (busca do import anterior)

O use case chama `importRepo.findActiveByYear(2026)`. A interface está em:

**`apps/api/src/modules/project-tracking/domain/repositories/project-import.repository.ts`**

```typescript
export const PROJECT_IMPORT_REPOSITORY = 'IProjectImportRepository';

export interface IProjectImportRepository {
  findActiveByYear(year: number): Promise<ProjectImportRecord | null>;
  // ... outros métodos
}
```

E a implementação em:

**`apps/api/src/modules/project-tracking/infrastructure/repositories/prisma-project-import.repository.ts`**

```typescript
@Injectable()
export class PrismaProjectImportRepository implements IProjectImportRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveByYear(year: number): Promise<ProjectImportRecord | null> {
    return this.prisma.projectImport.findFirst({
      where: { referenceYear: year, status: 'ACTIVE' },
      include: { snapshots: true },
    });
  }
  // ...
}
```

**O que isso revela:**

- A interface fala em **domínio** (`ProjectImportRecord`) — um tipo do nosso código
- A implementação traduz entre o domínio e o **Prisma** (`projectImport.findFirst`)
- Se mudarmos para Mongo, criamos `MongoProjectImportRepository` que implementa a **mesma interface** e trocamos uma linha no módulo

---

## Estação 6 — Volta pelo controller

O use case retorna um `ParseReportDto` plain object. O controller devolve direto. NestJS serializa em JSON. Cliente recebe:

```json
{
  "rowsAccepted": 47,
  "rowsRejected": 3,
  "rowErrors": [ ... ],
  "delta": {
    "added": ["Project Alpha"],
    "removed": [],
    "statusChanged": [{ "project": "Project Beta", "from": "ON_HOLD", "to": "ACTIVE" }]
  },
  "biSanityDiffs": [
    { "metric": "ACTIVE projects", "ourCount": 12, "biCount": 11 }
  ],
  "sha256": "abc123...",
  "alreadyImported": false
}
```

E aí o admin no frontend decide: **se a delta faz sentido e os warnings estão ok**, clica em "Confirmar". Aí roda o `ConfirmImportUseCase`, que:

1. Reparseia (idempotente, mesma função pura)
2. Salva o arquivo no `IStorageProvider` (`STORAGE_DRIVER=local` em dev → grava em `/app/storage`)
3. Em **uma transação Prisma**:
   - marca o `ACTIVE` anterior como `SUPERSEDED`
   - cria o novo como `ACTIVE`
   - insere todos os `ProjectSnapshot`
4. Atualiza `parseReport` na linha do `ProjectImport`

---

## Mapa visual completo

```
HTTP                    PRESENTATION                APPLICATION                       INFRASTRUCTURE          DOMAIN
─────                   ────────────                ───────────                       ──────────────          ──────
POST /imports/preview   ProjectTrackingController   ParseAndPreviewImportUseCase       SpreadsheetParser       IsoWeekService
multipart/form-data ──▶ ├── @Roles('ADMINISTRATOR') ├── execute(input)                 ├── parse(buffer)       ├── getIsoWeek(date)
                        ├── @UseInterceptors        │   │
                        ├── assertXlsx(file)        │   ├── parser.parse(buffer) ────▶ │                       │
                        └── parseAndPreview         │   │                              ◀── ParsedSpreadsheet   │
                            .execute(input) ──────▶ │   │                                                      │
                                                    │   ├── importRepo                                          │
                                                    │   │   .findActiveByYear() ──────▶ PrismaProjectImport   │
                                                    │   │                                Repository            │
                                                    │   │                              ◀── ProjectImportRecord │
                                                    │   │                                                      │
                                                    │   ├── computeDelta(...)                                  │
                                                    │   └── buildReport(...)                                   │
                                                    │
                              ◀──────────────────── │ ParseReportDto                                            │
                        ◀───── ParseReportDto       │
JSON 200 ◀──────────────│                            │                                                          │
                                                                                                                │
                                                                                                                │
                          ┌─── Postgres                                                                          │
                          │    (project_imports, project_snapshots)                                              │
                          │
                          │ ↑ acessado APENAS via repositórios (infrastructure)
```

---

## Por que dividir em tantos arquivos?

Sente o impacto: o use case `ParseAndPreviewImportUseCase` tem ~50 linhas. O parser tem ~150. O `status-mapper` tem ~30. Cada arquivo:

- Tem **um motivo** para mudar
- É **testável isoladamente**
- É **reutilizável** (o parser é chamado pelo preview **e** pelo confirm)
- Permite que duas pessoas trabalhem em peças diferentes **sem conflito de merge**

Se tudo isso fosse uma única função de 300 linhas com `if/else` aninhado, qualquer mudança seria assustadora.

---

## 🛠 Exercício

1. **Trace você mesmo** o caminho do `POST /api/project-tracking/imports/confirm` (não o preview). Liste:
   - O método do controller que recebe
   - O use case chamado
   - Os repositórios/serviços que o use case injeta
   - Onde a **transação Prisma** começa e termina
2. Abra `project-tracking.module.ts` e responda: **se você adicionar um novo use case `ArchiveImportUseCase`, em quais lugares precisa registrá-lo?** (Dica: 3 lugares — pasta `use-cases/`, `index.ts` da pasta, e `providers` do módulo.)
3. Procure no parser onde o `bi-sanity-checker` é chamado. Por que ele roda **depois** do `row-mapper` e não antes?
4. Abra `apps/web/src/services/project-tracking.service.ts`. Encontre a função que chama esse endpoint. **O nome dela e a URL casam exatamente com o backend?** (Devem casar.)
5. **Cenário hipotético:** o PMO pediu para que, no preview, retornemos também a **lista de PMs duplicados** (PM com 2+ projetos). Onde você adicionaria essa lógica?
   - No controller? **Não.** Por quê?
   - No use case `ParseAndPreviewImportUseCase`? **Talvez.** Discuta.
   - No parser? **Provavelmente sim.** Por quê?

**Critério de pronto:** dado um endpoint qualquer da API, você consegue dizer **em ordem** todas as estações pelas quais a request passa, e o papel de cada uma.

➡️ Próximo: [05 — Frontend: feature-based](./05-frontend-feature-based.md)
