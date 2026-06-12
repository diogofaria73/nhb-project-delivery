# 01 — Visão geral do produto

Antes de aprender **como** o código está organizado, você precisa entender **o que** ele faz. Sem esse contexto, a arquitetura parece complicação desnecessária.

---

## O cliente: Norsk Hydro Brasil (NHB)

A NHB é uma multinacional do setor de alumínio. O PMO (Project Management Office) da NHB acompanha dezenas de projetos rodando em paralelo. Cada projeto tem um responsável, um PM, status, e uma expectativa de **quantas semanas no ano ele deveria estar reportando andamento**.

---

## O problema antes da plataforma

Toda semana, o PMO consolidava o status de todos os projetos numa **planilha Excel anual** (`StatusReportBI_2026.xlsx`) com a aba **BI** (Business Intelligence) totalizando indicadores.

Essa planilha era enviada por e-mail. Diretores abriam, olhavam, fechavam. Não havia versionamento, histórico, comparação semana a semana, ou KPIs interativos.

---

## O que a plataforma faz

> **Uma frase:** o PMO faz upload da planilha semanalmente; a plataforma versiona, valida e expõe os KPIs num dashboard interativo.

Em mais detalhe, cada semana:

1. O administrador (PMO) faz **upload** do `StatusReportBI_YYYY.xlsx`
2. O backend faz o **parse**, valida totais contra a aba `BI`, e gera um **relatório de pré-visualização** com erros/warnings
3. Se OK, o administrador **confirma** — a versão anterior fica `SUPERSEDED` e a nova fica `ACTIVE`
4. Usuários comuns abrem o **dashboard** e veem KPIs, projetos filtrados e gráficos sempre apontando para o import `ACTIVE`
5. Se algo der errado, o administrador pode **restaurar** uma versão antiga

A planilha continua sendo a **fonte da verdade** do PMO. A plataforma é uma **camada de leitura versionada** sobre ela.

---

## Atores e papéis (RBAC)

| Papel | O que pode fazer |
| --- | --- |
| **ADMINISTRATOR** | Tudo: upload de planilha, gerenciar imports, gerenciar usuários, ver dashboard |
| **USER** | Só dashboard (read-only) e trocar a própria senha |

Esse RBAC é aplicado em **dois lugares**:

- **Backend:** `@Roles('ADMINISTRATOR')` em cada endpoint sensível (veja `project-tracking.controller.ts:65`)
- **Frontend:** `<RoleGuard allowedRoles={['ADMINISTRATOR']}>` em volta da rota (veja `apps/web/src/app/App.tsx:26`)

> ⚠️ **Defesa em profundidade:** ambos os lados validam. Nunca confie só no frontend — qualquer usuário pode forjar requisições. O backend é a única defesa real.

---

## User Stories implementadas

As regras de negócio detalhadas estão em `docs/specs/`. Resumo:

### US-01 — Authentication

- Login com email/senha → retorna **JWT** (válido por 8h)
- Após **5 tentativas** falhas, conta fica bloqueada por 15 min
- Primeiro acesso obriga troca de senha (`mustChangePassword = true`)
- Spec completa: `docs/specs/US-01-authentication.md`

### US-02 — Users

- ADMIN cria usuários com senha provisória
- ADMIN ativa/desativa, desbloqueia, redefine senha
- Usuário comum só troca a própria senha em `/account`
- Spec: `docs/specs/US-02-users.md`

### US-08 — Project Tracking Import

> **Esta é a feature principal.** Vamos dissecá-la em detalhes no capítulo 04.

- ADMIN faz upload do `.xlsx` (máx 10MB)
- Backend valida MIME type, parseia, e gera **`ParseReport`** com:
  - linhas aceitas / rejeitadas
  - **delta** com a versão anterior (projetos novos, removidos, com status diferente)
  - validação contra a aba **BI** (consistência de totais)
- Fluxo de **dois passos**: `preview` (dry-run, não persiste) → `confirm` (persiste)
- Statuses do import: `PENDING` → `PROCESSING` → `ACTIVE` | `SUPERSEDED` | `FAILED`
- Cada confirmação **transacional** marca o anterior como `SUPERSEDED` e o novo como `ACTIVE`
- ADMIN pode **restaurar** um import `SUPERSEDED` ou **deletar** qualquer import que não esteja `ACTIVE`
- Spec: `docs/specs/US-08-project-tracking-import.md`

### US-09 — Dashboard

- Tela principal lendo do import `ACTIVE` do ano selecionado
- Filtros: ano, status do projeto, mês, semana
- KPIs **bullet**: acumulado vs esperado, semana atual
- Gráfico semanal de envios
- Tabela paginada de projetos com `weekFlags` (bitmap das 52 semanas)
- Drawer de detalhe por projeto (timeline semanal completa)
- Spec: `docs/specs/US-09-dashboard-hydro-visual.md`

---

## Conceitos do domínio (vocabulário)

Memorize estes termos — eles aparecem no código todo dia.

| Termo | Significado |
| --- | --- |
| **ProjectImport** | Uma versão da planilha. Tem `status`, `referenceYear`, `parseReport`. |
| **ProjectSnapshot** | Uma linha da planilha persistida (1 projeto naquele import). |
| **weekFlags** | `Bytes` (52 bits) representando se o projeto reportou em cada semana ISO daquele ano. |
| **ISO week** | Semana segundo ISO 8601 (segunda-feira inicia a semana, semana 1 contém a primeira quinta de janeiro). |
| **parseReport** | JSON anexado ao import com: linhas aceitas/rejeitadas, erros por linha, delta vs anterior, sanity check da aba BI. |
| **BI sanity check** | Comparação entre os totais que **calculamos** das linhas com os totais que a **aba BI** da planilha apresenta. Se divergir, fica como warning no `parseReport`. |
| **delta** | Diferença entre este import e o anterior `ACTIVE`: projetos adicionados, removidos, e cujos status mudaram. |

---

## O fluxo de dados na cabeça

```
┌─────────────┐    upload    ┌─────────────┐   parse    ┌──────────────┐
│   PMO       │ ───────────▶ │   API       │ ─────────▶ │ SpreadsheetParser
│ (humano)    │   .xlsx      │   /preview  │            │ (puro)       │
└─────────────┘              └──────┬──────┘            └──────┬───────┘
                                    │                          │
                                    │ ParseReport (dry-run)    │
                                    ◀──────────────────────────┘
                                    │
              decisão humana ───────┤
                                    │
                                    ▼
                             ┌─────────────┐ transação ┌──────────────┐
                             │   /confirm  │ ────────▶ │   Postgres   │
                             │             │           │ ProjectImport│
                             │             │           │ + Snapshots  │
                             └──────┬──────┘           └──────────────┘
                                    │
                                    │ status: ACTIVE
                                    ▼
                             ┌─────────────┐  read     ┌──────────────┐
                             │  /dashboard │ ────────▶ │  Active      │
                             │  (GET)      │           │  import      │
                             └─────────────┘           └──────────────┘
```

Note: o **parser é puro** — recebe `Buffer`, devolve `ParsedSpreadsheet`. Ele não conhece banco, HTTP, ou usuário. Isso vai ficar muito claro no capítulo 4.

---

## Por que essa decisão de design?

**Por que duas etapas (`preview` + `confirm`)?**
Porque a planilha é a verdade do PMO. Se aceitarmos qualquer upload, um erro do PMO vira erro no dashboard sem ninguém perceber. O preview força um humano a olhar o **delta** e o **sanity check** antes de promover.

**Por que `SUPERSEDED` em vez de deletar o anterior?**
Permite **rollback rápido** (cap 4 mostra o use case `RestoreImportUseCase`). Em produção, a cada confirm, o anterior fica preservado.

**Por que `weekFlags` como `Bytes` (52 bits) e não 52 colunas?**
Porque 52 colunas booleanas seriam um schema horrível e a query do dashboard agrega muitas linhas. Bytes é compacto e a CPU descomprime em microssegundos.

---

## 🛠 Exercício

1. Abra `docs/specs/US-08-project-tracking-import.md`. Encontre:
   - A regra `BR-` que define **quem pode** fazer upload
   - A regra que define **o que acontece** quando o parser detecta divergência no BI sanity check
2. No Swagger (`http://localhost:3000/api/docs`), localize `POST /project-tracking/imports/preview`. Olhe o request body (`PreviewImportDto`). Responda: por que precisamos enviar `referenceYear` se a planilha tem `2026` no nome?
3. Em uma frase, escreva: **se você tivesse que explicar para um sobrinho de 12 anos o que essa plataforma faz, o que diria?**
4. (Opcional) Abra a planilha `docs/specs/StatusReportBI_2026.xlsx` no Excel/Numbers. Olhe a aba `BI` — você está vendo o que o `bi-sanity-checker.ts` compara.

**Critério de pronto:** você consegue explicar oralmente, sem olhar este documento, o ciclo `upload → preview → confirm → dashboard`.

➡️ Próximo: [02 — Arquitetura do monorepo](./02-arquitetura-monorepo.md)
