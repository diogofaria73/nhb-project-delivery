# 01 — Anatomia de um bom pedido

Um bom pedido pra IA tem 4 ingredientes. Falta qualquer um deles e a resposta degrada — mas não de forma óbvia: vem **plausível**, só não é o que você queria.

---

## Os 4 ingredientes

```
┌─────────────────────────────────────────────────────────┐
│  1. CONTEXTO       o que ela precisa saber pra começar  │
│  2. OBJETIVO       o que você quer ao final             │
│  3. RESTRIÇÃO      o que ela NÃO pode fazer             │
│  4. CRITÉRIO       como saber que terminou              │
└─────────────────────────────────────────────────────────┘
```

Vamos ver cada um, com **antes/depois** real usando o repo NHB.

---

## Ingrediente 1 — Contexto

**Pergunta-guia:** "Um colega novo no time, sem ter visto este projeto, conseguiria fazer essa tarefa com o que estou dizendo?"

### Tipos de contexto

| Tipo | Exemplos |
| --- | --- |
| **Domínio** | "Estamos num módulo de tracking de projetos onde uma planilha é importada semanalmente…" |
| **Arquitetura** | "Seguimos DDD em camadas. Use cases ficam em `application/use-cases/`…" |
| **Convenções** | "Named exports, kebab-case, sem `any`…" |
| **Estado atual** | "O `IProjectImportRepository` já tem `findActiveByYear`. Quero adicionar…" |
| **Restrições do projeto** | "Não usamos React Query. Padrão é useState + useEffect." |

### Como entregar contexto (rápido)

- **Mencionar arquivos exatos** ("igual ao `project-tracking.module.ts`")
- **Apontar pra documentos** ("siga as regras do `CLAUDE.md`")
- **Mostrar exemplo** ("igual a esse trecho aqui: [cola código]")
- **Dar links de referência** ("a US em `docs/specs/US-08-…`")

### Antes/depois

**❌ Antes:**

```
crie um endpoint para arquivar um import
```

**✅ Depois:**

```
Estamos no módulo `project-tracking` (arquitetura DDD, ver CLAUDE.md).
Quero adicionar um endpoint para "arquivar" um ProjectImport — é um
estado novo `ARCHIVED` que adiciono ao enum `ProjectImportStatus` no
schema Prisma.

Siga o padrão do `delete-import.use-case.ts` para a estrutura: um use
case por verbo, controller fino, repositório com método novo. O
endpoint é POST /imports/:id/archive, ADMIN-only.
```

A segunda versão mostra: domínio (`project-tracking`), padrão (`delete-import.use-case.ts`), arquitetura (DDD), e até o método HTTP. IA praticamente não precisa adivinhar.

---

## Ingrediente 2 — Objetivo

**Pergunta-guia:** "O que muda no mundo quando isso terminar?"

Não é "refatore", "melhore", "otimize". É **a transformação concreta**.

### Antes/depois

**❌ Antes:**

```
refatore o dashboard-page.tsx
```

(Refatorar o quê? Quebrar em pedaços? Mover lógica? Tirar duplicação?)

**✅ Depois:**

```
No dashboard-page.tsx, a lógica de filtros está embutida com 4
useState. Extraia para um hook custom `useDashboardFilters` em
hooks/use-dashboard-filters.ts, retornando { filters, setFilters,
reset }. A página deve consumir o hook e ficar mais limpa visualmente.
```

Agora a IA sabe **o que** precisa estar verdadeiro ao final: um arquivo novo, um hook com forma específica, a página consumindo. Verificável.

### Variações úteis

| Tipo de objetivo | Frase-modelo |
| --- | --- |
| Criar algo | "Crie X de modo que faça Y, com forma Z" |
| Modificar algo | "Mude A para que B mude / fique Y" |
| Investigar algo | "Diga-me onde / como / por que X acontece" |
| Decidir algo | "Liste 2-3 abordagens para X com prós/contras" |
| Explicar algo | "Explique X para alguém que sabe Y mas não Z" |

---

## Ingrediente 3 — Restrição

**Pergunta-guia:** "O que **não** pode ser tocado / quebrado / introduzido?"

Restrições explícitas economizam **muito** retrabalho.

### Restrições que valem declarar

- **APIs públicas que não mudam** — "mantenha a assinatura do método `findActiveByYear`"
- **Libs proibidas** — "não use React Query, padrão é useState"
- **Estilo de código** — "não introduza `any`, classes ou default exports"
- **Performance** — "não pode rodar mais que 1 query no banco"
- **Compatibilidade** — "este DTO está no `packages/shared`, mudar quebra o frontend"
- **Escopo** — "só toque no arquivo X, não refatore os vizinhos"

### Antes/depois

**❌ Antes:**

```
escreva um teste para parse-and-preview-import.use-case.ts
```

**✅ Depois:**

```
Escreva spec unitário para parse-and-preview-import.use-case.ts.

Restrições:
- Use Jest (já está no projeto, não importe nada novo)
- Mocke o IProjectImportRepository — não use Prisma real
- Não mocke o parser nem o IsoWeekService (queremos testar a integração)
- Use o template do existente status-mapper.spec.ts pra estilo de "describe / it"
- Cubra 3 cenários: planilha válida sem import anterior, planilha
  com erros de linha, planilha idêntica a um import já confirmado
```

Resultado: ela não inventa setup, não importa libs desnecessárias, não cobre 17 cenários inúteis.

---

## Ingrediente 4 — Critério de pronto

**Pergunta-guia:** "Como você vai saber se ela terminou bem?"

Sem isso, ou ela faz de menos ("ok, primeiro passo?") ou de mais (refatora o universo).

### Formas concretas

- **Lista de itens** — "ao final tem que ter: (a) arquivo X, (b) campo Y populado, (c) teste passando"
- **Comando que precisa rodar** — "`pnpm test` deve passar"
- **UI verificável** — "ao acessar /dashboard com admin, vejo o novo botão"
- **Tipo definido** — "a função deve retornar `Promise<DashboardResponseDto>`"

### Antes/depois

**❌ Antes:**

```
adicione filtro por status na lista de imports
```

**✅ Depois:**

```
Adicione filtro por status na lista de imports.

Pronto quando:
1. ListImportsDto aceita `status?: ProjectImportStatus` opcional
2. PrismaProjectImportRepository.list() respeita o filtro quando passado
3. O frontend (import-history-page.tsx) tem um <Select> de status
4. `pnpm test` passa
5. Verificação manual: como admin em /dashboard/imports, filtrar
   por SUPERSEDED mostra só os de status SUPERSEDED
```

---

## A receita junta — exemplo real

Você quer adicionar um campo `pmEmail` ao snapshot pra mandar e-mail de cobrança quando um PM atrasa.

### Versão completa do pedido

```
CONTEXTO
Estou no módulo `project-tracking`. Vou adicionar um campo `pmEmail`
opcional ao ProjectSnapshot — fonte do dado é uma coluna "PM Email"
que o PMO vai adicionar à planilha StatusReportBI no ano que vem.

Padrões: DDD em camadas (ver CLAUDE.md), kebab-case, named exports,
class-validator nas DTOs. Migrations via `pnpm --filter ... prisma:migrate`.

OBJETIVO
Adicionar pmEmail à pipeline completa:
1. Schema Prisma: pmEmail String? em ProjectSnapshot
2. Parser: row-mapper.ts deve ler a coluna "PM Email" se existir
3. Contrato: pmEmail?: string em ProjectRowDto no packages/shared
4. Backend: PrismaDashboardRepository popula no return
5. Frontend: project-detail-drawer.tsx mostra o pmEmail (mailto:)

RESTRIÇÕES
- Coluna na planilha é OPCIONAL — se faltar, não dê erro, só deixe undefined
- NÃO valide formato de e-mail no parser — confiamos no PMO
- NÃO mude a API do método existente findActiveByYear

PRONTO QUANDO
- Migration gerada
- pnpm test passa
- packages/shared rebuilda sem erro
- Verificação manual: abrir o drawer de um projeto que tem PM mostra
  o link mailto:; um projeto sem PM mostra "—"
```

Compare mentalmente com **"adicione pmEmail no dashboard"** — quanto retrabalho a versão de cima evita.

---

## "Mas eu vou demorar mais escrevendo isso do que fazendo na mão!"

Erro comum. Vamos ser práticos:

- Pedido bem escrito: 1-2 minutos
- Pedido ruim → ida e volta corrigindo → desistir e fazer na mão: 10-30 minutos
- Pedido bom → resposta usável → você revisa e ajusta: 3-5 minutos

A matemática só fica ruim em **tarefas triviais** (1 linha, um rename). Aí, sim, escrever na mão (ou usar Tab do Cursor) ganha.

Regra prática: **se a tarefa demora mais que 5 minutos no teclado**, vale escrever um pedido completo.

---

## Templates prontos

Cole isso na sua nota de trabalho e adapte:

### Template "criar algo seguindo padrão"

```
CONTEXTO: Estou em <módulo>. Padrão do projeto: <link/arquivo>.
OBJETIVO: Crie <coisa> seguindo <arquivo-template>.
RESTRIÇÕES: <libs/estilo/escopo>.
PRONTO QUANDO: <lista verificável>.
```

### Template "refator pontual"

```
CONTEXTO: Arquivo <path>, linhas <X-Y>. <Por que estou mexendo>.
OBJETIVO: Refatore para <transformação concreta>.
RESTRIÇÕES: Mantenha <API/teste/comportamento>.
PRONTO QUANDO: Comportamento idêntico, tests passam.
```

### Template "investigar"

```
CONTEXTO: <onde estou olhando>. <O que já sei>.
OBJETIVO: Encontre onde / como / por que <X>.
RESTRIÇÕES: Reporte em <N palavras>, não modifique nada.
PRONTO QUANDO: Eu consigo navegar direto aos arquivos chave.
```

### Template "debug"

```
CONTEXTO: <comando ou ação>. Erro completo: <stack trace>.
Arquivo suspeito: <path>. Já tentei: <hipóteses descartadas>.
OBJETIVO: Diagnostique a causa raiz e proponha correção.
RESTRIÇÕES: Não corrija ainda — só explique.
PRONTO QUANDO: Tenho 2-3 hipóteses ordenadas por probabilidade.
```

---

## 🎯 Tente agora

Pegue a anotação que você fez no fim do cap 00 (o "o que faltou no meu pedido").

1. Reescreva o pedido aplicando os 4 ingredientes
2. Rode no seu editor
3. Compare a resposta com a primeira tentativa

**Critério de pronto:** a segunda resposta exige **muito menos retrabalho** que a primeira. Se não exigir, traga seu prompt pro próximo standup — vamos olhar juntos.

---

➡️ Próximo: [02 — Gerenciando contexto](./02-gerenciando-contexto.md)
