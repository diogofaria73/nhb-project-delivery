# 05 — Padrões de tarefas: receitas por tipo de trabalho

Capítulo mais prático até agora. Cada tipo de tarefa tem uma **receita** de prompt + ferramenta + verificação. Memorize esses padrões e 80% do seu trabalho diário fica mais fluido.

---

## Os 5 padrões

```
1. EXPLORE       entender código existente
2. GENERATE      criar código novo
3. REFACTOR      reorganizar código que funciona
4. DEBUG         investigar comportamento errado
5. TEST          gerar / completar suíte
```

---

## 1. EXPLORE — entender código existente

### Quando usar IA

- Codebase grande, você é novo no time / módulo
- Vai mudar algo e precisa entender o entorno antes
- Quer mapear "onde tudo que faz X acontece"

### Quando NÃO usar IA

- O arquivo é único e tem 30 linhas. Leia.
- Você só precisa de **uma** definição (use LSP / "Go to definition")

### Receita

**Ferramenta:** Claude Code com **Explore** subagent / Cursor com Chat + `@folder`

**Pedido:**

```
EXPLORE PROMPT
---------------
Objetivo: entender [pergunta clara — "como funciona X", "onde está Y", "quando Z é chamado"]
Escopo: [pasta / módulo]
Reporte: [mapa de arquivos com 1 linha cada / fluxo passo-a-passo / lista de pontos]
Máx N palavras: <200 / 400>
Não modifique nada — só investigue.
```

### Exemplo real (repo NHB)

```
Explore o módulo project-tracking e me responda:
- Como o bi-sanity-checker é integrado ao parser?
- Onde os warnings dele aparecem no parse report?
- Qual estrutura tem o BiSanityDiff no shared?
Cite os arquivos com linha. Máx 200 palavras. Não modifique nada.
```

### Pitfall típico

Pedir "me explique o módulo project-tracking" — escopo gigante, resposta genérica. Use perguntas **específicas**.

### Sinal de explore bem-feita

Você sai sabendo **abrir o arquivo certo direto** — não precisa procurar mais.

---

## 2. GENERATE — criar código novo

### Quando usar IA

- Código segue **template existente** no repo (use case, controller, hook…)
- Boilerplate (DTO, migration, schema)
- Testes a partir de código existente
- Estrutura padronizada (módulo NestJS, componente shadcn, hook custom)

### Quando NÃO usar IA

- Decisão arquitetural significativa (escolher abordagem A vs B) — discuta com humano antes
- Código que mexe em segurança crítica sem revisão dedicada

### Receita

**Ferramenta:** Composer (Cursor) ou Claude Code

**Pedido:** template completo do cap 01 — todos os 4 ingredientes.

### Exemplo real

```
CONTEXTO
Módulo project-tracking, DDD em camadas.
Já existe DeleteImportUseCase e o controller correspondente.

OBJETIVO
Criar ArchiveImportUseCase + endpoint POST /imports/:id/archive.
- Adicionar ARCHIVED ao enum ProjectImportStatus
- Use case: muda status para ARCHIVED apenas se status atual for SUPERSEDED
- Controller: ADMIN-only, retorna 204

RESTRIÇÕES
- Padrão: mirror delete-import.use-case.ts
- Sem any, sem console.log
- Migration gerada (não edite arquivo de migration anterior)

PRONTO QUANDO
- pnpm --filter @nhb-status-report/api test passa
- swagger mostra POST /imports/:id/archive sob ADMIN
- prisma:migrate sem erro
```

### Pitfall típico

Pedir "crie um endpoint pra arquivar import" sem mencionar o template. Resultado: padrão "genérico" da IA, não o **seu**.

### Sinal de generate bem-feita

O código parece ter sido escrito por alguém do time — mesmo padrão de nomes, mesma estrutura, mesmas convenções.

---

## 3. REFACTOR — reorganizar código que funciona

### Quando usar IA

- Extrair função / hook / componente
- Renomear sistemicamente (quando LSP não pega tudo)
- Mover arquivos com atualização de imports
- Converter estilo (callback → async/await, classe → função, …)
- Reduzir duplicação visível

### Quando NÃO usar IA

- Refator que muda **semântica** (não é refator, é mudança)
- Mudança em centenas de arquivos (peça em **lotes pequenos**)
- Sem testes pra validar comportamento antes/depois

### Receita

**Ferramenta:**

- 1 arquivo, escopo cirúrgico → Cmd+K (Cursor)
- N arquivos com padrão claro → Composer / Claude Code

**Pedido:** ênfase em **preservar comportamento**.

```
REFACTOR PROMPT
---------------
CONTEXTO: [arquivo / função / padrão existente]
OBJETIVO: [transformação concreta — "extrair X para Y"]
RESTRIÇÕES:
- Comportamento idêntico
- API pública inalterada
- Tests existentes continuam passando
PRONTO QUANDO:
- Diff revela só a transformação intencional
- pnpm test passa
```

### Exemplo real

```
Em apps/web/src/features/project-tracking/pages/dashboard-page.tsx,
a lógica de filtros (5 useState entre as linhas 30-70) deve ser
extraída para um hook custom em
apps/web/src/features/project-tracking/hooks/use-dashboard-filters.ts.

Restrições:
- Comportamento idêntico
- A página continua se comportando igual visualmente
- Hook retorna { filters, setFilters, resetFilters }
- Sem React Query (padrão do projeto)

Pronto quando:
- Hook criado
- Página consumindo o hook
- Antiga lógica removida
- App roda sem erro: pnpm dev:web
```

### Pitfall típico

IA aproveita pra refatorar **mais** que você pediu ("aproveitei pra deixar essa função mais limpa também"). Sempre revise.

### Sinal de refactor bem-feito

Diff revela **só** a transformação que você pediu. Nada mais.

---

## 4. DEBUG — investigar comportamento errado

### Quando usar IA

- Você tem **erro completo** (stack trace, mensagem, output)
- Bug reproduzível
- Logs disponíveis
- Familiaridade média com o código

### Quando NÃO usar IA

- "Tá estranho" sem reprodução clara → você ainda precisa **isolar** o bug primeiro
- Bug intermitente / race condition complexo → IA chuta mais que ajuda
- Bug em sistema que ela não consegue ver (DB, infra remota)

### Receita

**Ferramenta:** Claude Code (pode rodar comandos pra confirmar hipóteses)

**Pedido em 2 etapas:**

```
ETAPA 1 — DIAGNÓSTICO
CONTEXTO:
- Ação que dispara: [passo a passo]
- Esperado: [comportamento]
- Real: [comportamento]
- Erro completo: [stack trace ou output]
- Arquivos suspeitos: [paths]
- Já testei: [hipóteses descartadas]

OBJETIVO: Diagnosticar causa raiz. Liste 2-3 hipóteses ordenadas
por probabilidade. NÃO corrija nada ainda.

ETAPA 2 — CORREÇÃO (depois de você concordar)
Aplicar correção da hipótese N, mínima, sem efeitos colaterais.
Adicionar teste regressivo se possível.
```

### Exemplo real

```
ETAPA 1
Estou rodando `pnpm dev:api` e qualquer chamada a
/api/project-tracking/imports/:id/file dá HTTP 500.

Erro completo no terminal:
TypeError: Cannot read property 'pipe' of undefined
  at ProjectTrackingController.download
  (apps/api/.../project-tracking.controller.ts:134)

Já confirmei:
- O ID existe no banco (verifiquei no Prisma Studio)
- O arquivo existe em /app/storage (li com `docker exec`)
- O endpoint funcionava ontem antes de eu mudar o storage provider

Arquivos que toquei ontem:
- shared/infrastructure/storage/local-disk.storage.ts
- shared/infrastructure/storage/storage.module.ts

Diagnostique. Não corrija ainda.
```

### Pitfall típico

Pedir "pq tá quebrando?" sem trazer erro nem stack. IA chuta. Você fica brigando com chutes.

### Sinal de debug bem-feito

Você sai com **2-3 hipóteses concretas**, ordenadas, com **onde verificar** cada uma.

---

## 5. TEST — gerar / completar suíte

### Quando usar IA

- Cobrir código existente com tests novos
- Adicionar casos pra cobertura faltante
- Converter estilo de tests (xUnit → Jest, etc.)
- Gerar fixtures / mocks consistentes

### Quando NÃO usar IA

- TDD puro (teste antes do código): IA não vai inventar comportamento certo sem ele estar codado
- Testes E2E complexos com infra externa que ela não enxerga
- Quando você não sabe o que precisa ser testado (problema é seu, não dela)

### Receita

**Ferramenta:** Composer / Claude Code

**Pedido:** especifique **estilo** e **cenários**.

```
TEST PROMPT
-----------
CONTEXTO: [arquivo a testar] + [arquivo de spec parecido como referência de estilo]
OBJETIVO: [N specs cobrindo cenários X, Y, Z]
RESTRIÇÕES:
- Mocke [dependências de I/O]
- NÃO mocke [dependências internas que queremos testar de verdade]
- Estilo: igual a [arquivo referência]
PRONTO QUANDO:
- pnpm test --filter <file> passa
- Cada spec tem describe/it claros
```

### Exemplo real

```
Escrever spec para apps/api/src/modules/project-tracking/infrastructure/
parsers/delta-calculator.ts.

Use status-mapper.spec.ts como referência de estilo.

Cenários a cobrir:
- Sem import anterior → tudo é "added"
- Import anterior idêntico → vazio
- Projeto mudou de status → entra em statusChanged
- Projeto novo no atual → entra em added
- Projeto sumiu → entra em removed

Mocke nada (delta-calculator é puro).
PRONTO QUANDO pnpm --filter @nhb-status-report/api test passa.
```

### Pitfall típico

Pedir "escreva testes" sem cenários — IA gera 8 testes redundantes ou cobre só caminho feliz.

### Sinal de test bem-feito

Cada teste cobre um cenário **distinto e claro**. Falham por motivos diferentes.

---

## Padrões combinados

A vida real mistura. Padrões comuns:

### Explore → Generate

Mapear como X funciona → criar X análogo

```
1. Explore: "Como o module users registra suas dependências?"
2. Generate: "Crie um notifications.module.ts seguindo o mesmo padrão"
```

### Generate → Test

Criar feature → cobrir com tests

```
1. Generate: novo use case
2. Test: spec para o use case com cenários X,Y,Z
```

### Debug → Refactor

Achar bug → refatorar pra prevenir recidiva

```
1. Debug: diagnosticar
2. Corrigir mínimo
3. Refactor: extrair lógica frágil pra função testável
```

### Explore → Debug

Bug em código desconhecido → mapear antes

```
1. Explore: "Qual o fluxo do endpoint que está falhando?"
2. Debug: com mapa em mão, isolar o bug
```

---

## Como saber qual padrão estou fazendo?

Pergunta-guia: **o que precisa ser verdadeiro ao final?**

| Resultado esperado | Padrão |
| --- | --- |
| Você entende algo que não entendia | Explore |
| Arquivo / função / módulo novo existe | Generate |
| Mesmo comportamento, estrutura diferente | Refactor |
| Você sabe a causa de um erro | Debug |
| Teste novo passa, cobre cenário X | Test |

Se sua tarefa **não cabe em uma dessas**, ela provavelmente é **uma sequência delas** (combinada). Quebre.

---

## Anti-padrão geral: tudo é "generate"

Iniciantes tendem a pedir tudo como **generate** — "faz isso aí". Resultado: pedem código novo quando o problema era entender o existente (deveriam ter feito explore primeiro).

> 💡 **Hábito:** antes de pedir código, pergunte a si mesmo se precisa **entender** algo primeiro. 30 segundos de explore economizam 30 minutos de generate errado.

---

## 🎯 Tente agora

Escolha **3 tarefas reais** que estão no seu backlog (ou invente baseado no repo NHB). Para cada uma:

1. Classifique: Explore / Generate / Refactor / Debug / Test
2. Escreva o pedido completo seguindo o template do padrão
3. Execute
4. Avalie: qual padrão entregou melhor? Qual saiu meia-boca? Por quê?

Traga essas 3 experiências para o standup. Discutir prompt em grupo aumenta a habilidade do time mais rápido que ler material.

---

➡️ Próximo: [06 — Do spec ao PR](./06-do-spec-ao-PR.md)
