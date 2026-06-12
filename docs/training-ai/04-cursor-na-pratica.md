# 04 — Cursor na prática

Cursor é um editor (fork do VS Code) com IA integrada em vários níveis. Diferente do Claude Code (agente que **executa**), Cursor é uma **mistura**: autocomplete, edição cirúrgica e agente — você escolhe qual modo cabe.

> Se você usa só Claude Code, vale ler — alguns padrões aqui (especialmente o uso de **Tab**) não têm equivalente.

---

## Os 3 modos do Cursor

```
┌──────────────────────────────────────────────────────────┐
│  Tab            sugestão inline (autocomplete)            │
│  Cmd+K          edit cirúrgico em seleção                 │
│  Cmd+I          Composer (multi-arquivo, agente)          │
└──────────────────────────────────────────────────────────┘
```

E mais um:

```
│  Cmd+L          Chat (perguntar sem mexer no código)      │
```

A regra é: **escolha o modo pela natureza da tarefa**. Usar Composer pra trocar um nome de variável é overkill; usar Tab pra refatorar 5 arquivos é vão.

---

## Tab — autocomplete inteligente

Apertar Tab aceita a sugestão fantasma. Muito além do snippet "loop for":

- Sabe seus padrões locais (sugere próxima linha plausível)
- Olha o cursor + arquivos abertos pra contexto
- Sugere **diffs** (deletar uma linha, mover outra) — não só inserts

### Quando aceitar

✅ Sugestão completa **exatamente** o que você ia digitar
✅ Sugestão segue padrão claro do arquivo atual
✅ Você consegue ler e validar em 1-2 segundos

### Quando ignorar

❌ Sugestão diverge minimamente do que você quer — **não aceite e depois conserte**
❌ Você não tem certeza do que está fazendo

> ⚠️ **Anti-padrão "Tab burnout":** aceitar Tab sem ler, sair confiando, e depois descobrir bugs sutis. Tab é rápido demais — é fácil pegar o vício. Se você se pegar aceitando 5 Tabs seguidos sem ler, **pare** e leia o que entrou.

### Padrão útil

Quando você **sabe exatamente** o que quer escrever, comece a digitar. Tab vai sugerir o resto. Cole o esqueleto na sua cabeça **antes** de olhar a sugestão.

Quando você **não sabe**, NÃO digite chute. Vá direto pra Cmd+K ou Composer com pedido escrito.

---

## Cmd+K — edit cirúrgico

Selecione um bloco de código. Aperte Cmd+K. Aparece um campo: descreva a edição. Cursor reescreve **só aquele bloco**.

### Quando usar

- Refatorar uma função pontual
- Renomear coisa que o LSP não consegue
- Adicionar tipos a parâmetros sem tipo
- Reescrever um bloco em outro estilo (ex.: callback → async/await)
- Adicionar comentário JSDoc/explicativo a um bloco

### Quando NÃO usar

- Quando a mudança atravessa **múltiplos arquivos** (use Composer)
- Quando você precisa de exploração antes (use Chat ou Composer)
- Quando a mudança é trivial (use Tab ou digite na mão)

### Padrão do pedido

Vale tudo do cap 01, mas adaptado ao escopo pequeno:

```
extraia o cálculo de cumulativePct para uma função pura
fora desta função, com nome computeCumulativePct, mantendo
mesma assinatura de input/output
```

Não precisa de "contexto completo" porque Cursor está vendo o bloco e o arquivo. O **objetivo** e a **restrição** ainda precisam vir explícitos.

---

## Composer (Cmd+I) — o agente

Cmd+I abre o **Composer**: um pedido que pode tocar **vários arquivos** e usar **tools** (ler, grep, criar). É o modo "agente" do Cursor — mais próximo do Claude Code.

### Quando usar

- Implementar feature que cruza N arquivos
- Adicionar campo schema → migration → repository → DTO → frontend
- Refatorar padrão em vários lugares
- Investigar e modificar simultaneamente
- Criar feature seguindo template existente

### Antes de começar — prepare o contexto

A qualidade da resposta vem de **o que está no contexto do Composer**. Mecanismos:

- **Abas abertas** — arquivos relevantes ficam visíveis
- **@-mentions** — referência explícita:
  - `@file:apps/api/.../delete-import.use-case.ts`
  - `@folder:apps/api/src/modules/project-tracking/`
  - `@code` — selecionar trecho específico
  - `@docs` — documentação carregada
  - `@web` — search
  - `@git` — diff atual

Mais @-mentions = mais foco = melhor resposta.

### Padrão recomendado

```
@folder:apps/api/src/modules/project-tracking/
@file:CLAUDE.md
@file:docs/specs/US-08-project-tracking-import.md

Quero adicionar um novo endpoint POST /imports/:id/archive.
Padrão: igual ao delete-import.use-case.ts e seu controller.
Adiciona o estado ARCHIVED ao enum.

Mantenha:
- Sem any
- DDD por camadas
- Migration gerada via prisma migrate

Pronto quando:
- 1 use case novo
- 1 método novo no controller
- enum atualizado no schema
- migration gerada
```

### Aceitar / rejeitar mudanças

Cursor mostra um diff por arquivo. **Sempre revise**, especialmente em arquivos que não foram o foco principal (Cursor adora "limpar" coisas vizinhas sem te avisar).

> ⚠️ **Anti-padrão "Accept All":** clicar em "Accept All" sem ler. Cap 09 cobre.

---

## Chat (Cmd+L) — perguntar sem mexer

Quando você só quer **entender**, **discutir** ou **decidir** — sem que código seja escrito. Útil pra:

- Investigar bug sem aceitar nada ainda
- Discutir trade-offs de implementação
- Pedir explicação de código alheio
- Tirar dúvida de sintaxe

> Em Cursor moderno, o Chat e o Composer cresceram pra se sobrepor — confira na sua versão como cada modo se chama. O princípio (perguntar vs modificar) vale.

---

## `.cursorrules` e `.cursor/rules/`

Equivalente do `CLAUDE.md`: arquivos que Cursor sempre carrega em contexto.

### `.cursorrules` (arquivo único na raiz)

Texto livre, lido em toda interação. Bom pra:

- Convenções de código
- Padrões arquiteturais
- Tecnologias usadas
- Restrições gerais

### `.cursor/rules/` (Cursor mais recente, rules estruturadas)

Diretório com vários arquivos `.mdc`, cada um com escopo (path glob) e regras. Mais sofisticado:

- Regra que só se aplica a arquivos `*.tsx`
- Regra específica para `apps/api/src/modules/*/domain/`

Conforme o tamanho do projeto cresce, **modularize**. Repo NHB ainda usa CLAUDE.md como fonte primária — quem usa Cursor pode espelhar trechos para `.cursorrules` ou `.cursor/rules/` (mantendo um único source of truth).

---

## Comparando Cursor e Claude Code

| Tarefa | Cursor (Tab) | Cursor (Composer) | Claude Code |
| --- | --- | --- | --- |
| Aceitar próxima linha óbvia | ✅ | ❌ | ❌ |
| Refatorar 1 função local | ✅ via Cmd+K | ✅ | ✅ |
| Implementar feature em 5 arquivos | ❌ | ✅ | ✅ |
| Rodar comando + reagir ao output | ❌ | ⚠️ limitado | ✅ |
| Subagentes paralelos | ❌ | ❌ | ✅ |
| Plan mode com aprovação humana | ❌ | ⚠️ informal | ✅ formal |
| Skills custom do projeto (`/verify`, `/code-review`) | ❌ | ❌ | ✅ |

> 💡 **Coexistência:** muitos no time usam **os dois**. Cursor pra coding session (Tab durante o dia) + Claude Code pra tarefas grandes (plan, multi-arquivo, verify, code-review).

---

## Quando usar Cursor vs Claude Code (regra prática)

| Cenário | Ferramenta |
| --- | --- |
| Escrevendo código novo, sabendo o que fazer | Cursor (Tab) |
| Refator pontual num arquivo | Cursor (Cmd+K) |
| Feature multi-arquivo, escopo claro | Composer **ou** Claude Code |
| Tarefa grande, escopo vago, quer planejar | Claude Code (Plan mode) |
| Investigação ampla no repo | Claude Code (Explore subagent) |
| Quer rodar tests, ler output, iterar | Claude Code (tem Bash) |
| Code review de diff | Claude Code (`/code-review`) |
| Verificar feature end-to-end no browser | Claude Code (`/verify`) |

---

## Anti-padrões específicos do Cursor

### 1. "Aceitar tudo do Composer sem revisar"

Composer altera vários arquivos. **Sempre passe por cada diff**. Arquivos que você não pediu pra mudar mas mudaram = bandeira vermelha.

### 2. "Tab compulsivo"

Aceitar Tab toda vez que aparece, sem ler. Você fica produzindo código que **parece** seu mas tem decisões da IA enxertadas — depois quando bug aparece, você não lembra ter escrito.

### 3. "Composer pra tudo"

Trocar nome de variável via Composer é como martelar parafuso. Use Cmd+K ou simplesmente F2 do LSP.

### 4. "Não usar @-mentions"

Sair pedindo no Composer sem mencionar arquivos específicos. Você está dependendo das abas abertas (e elas podem estar erradas) ou da intuição da IA (genericidade).

### 5. "Ignorar `.cursorrules`"

Não revisar / atualizar o `.cursorrules` quando convenções mudam. Resultado: IA continua aplicando padrões antigos.

---

## Receitas práticas

### Receita: implementar uma feature pequena

1. Abrir os arquivos esperados (template + onde vai modificar)
2. Cmd+I → Composer
3. Mencionar com `@file` + `@docs` os arquivos críticos
4. Pedido completo (cap 01)
5. Revisar diff arquivo a arquivo
6. Aceitar / corrigir / rejeitar
7. Rodar tests no terminal do Cursor
8. Se quebrou: cole o erro no mesmo Composer pedindo correção

### Receita: explorar área desconhecida do código

1. Cmd+L → Chat
2. `@folder:<área>` + "explique o fluxo de X, citando arquivos"
3. Leia, faça perguntas de follow-up
4. Quando entender → começar Composer **separado** pra mudança

### Receita: bug com erro

1. Cole o stack trace inteiro no Composer
2. `@file:` o arquivo onde o erro acontece
3. Peça: "diagnostique, **não corrija ainda** — quero entender"
4. Discuta a hipótese
5. Quando concordar → pedido novo de correção, escopo cirúrgico

---

## 🎯 Tente agora

Faça este exercício de **20 minutos**:

1. Abra o repo NHB no Cursor
2. **Tarefa 1 (Tab):** abra `apps/api/src/modules/project-tracking/application/use-cases/delete-import.use-case.ts`. Adicione uma linha de log dentro do `execute`. Use Tab. Avalie: sugestão foi útil?
3. **Tarefa 2 (Cmd+K):** abra `apps/web/src/features/project-tracking/lib/compute.ts` (se existir uma função adequada). Selecione um bloco. Cmd+K: "adicione JSDoc explicando entradas e saída". Avalie.
4. **Tarefa 3 (Composer):** abra um Composer. Use @-mentions pra pedir: "Crie um arquivo `notes.md` na raiz com a lista de todos os use cases do módulo project-tracking, agrupados por tipo (read/write)". Revise o diff. Apague depois.
5. **Anote:** qual modo se encaixou melhor em qual tarefa?

---

➡️ Próximo: [05 — Padrões de tarefas](./05-padroes-de-tarefas.md)
