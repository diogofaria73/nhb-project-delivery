# 08 — Técnicas avançadas

Capítulo para devs **plenos e seniores** que já dominaram os 7 anteriores. Se você está nos primeiros capítulos, deixe este pra depois — não dá benefício até a base estar sólida.

Cobre:

1. Subagentes paralelos
2. Plan mode formal
3. Workflows (multi-agent orchestration)
4. MCPs (Model Context Protocol)
5. Skills custom
6. CLAUDE.md compartilhado e memória persistente

---

## 1. Subagentes paralelos

Claude Code (e Cursor em algumas configurações) podem lançar **subagentes** — Claudes adicionais com escopo isolado. Em vez de ela mesma fazer 5 tarefas sequencialmente, ela delega para 5 subagentes em paralelo.

### Quando vale

✅ Tarefas **independentes** (sem dependência sequencial)
✅ Cada tarefa é **grande o suficiente** pra justificar overhead de inicialização
✅ Você ganha **tempo de relógio** real, não só "mais lego de IA"

### Quando não vale

❌ Tarefas pequenas (1-2 min cada) — overhead supera ganho
❌ Sequenciais (B precisa do output de A)
❌ Quando você não vai conseguir revisar 5 outputs em paralelo

### Exemplo prático

```
Tarefa: revisar PR adicionando coluna BU. Tem 12 arquivos modificados,
4 áreas diferentes (schema, parser, frontend, tests).

Em vez de revisar tudo de uma vez:

Lance 4 subagents em paralelo, cada um com escopo:
1. Subagent "schema-review": só prisma + migration
2. Subagent "parser-review": só parsers + row-mapper
3. Subagent "frontend-review": só apps/web/.../components
4. Subagent "test-review": só specs novos

Cada um reporta 3 findings em até 200 palavras.
Eu sintetizo depois.
```

Tempo total: o do agente mais lento, não a soma.

### Tipos de subagente no projeto

| Tipo | Quando usar |
| --- | --- |
| **Explore** | Read-only, busca/mapeamento de código |
| **general-purpose** | Qualquer coisa que valha isolar contexto |
| **Plan** | Desenhar plano de implementação |
| **code-reviewer** | Revisar PR / branch (também via /code-review) |
| **Custom** | Definidos em `.claude/agents/` |

---

## 2. Plan mode formal

Já tocamos no cap 03. Aqui aprofundamos.

Plan mode = Claude Code entra em modo **read-only**, lê o código, propõe plano, **espera aprovação** antes de executar.

### Quando vale

- Tarefa com >5 arquivos a modificar
- Mudança arriscada (migração de dados, refator transversal)
- Quando você quer alinhar **abordagem** antes de codar

### Workflow

1. Sua mensagem inicial descreve a tarefa
2. Claude propõe entrar em plan mode (ou você usa o atalho)
3. Em plan mode, ela só usa tools **read** (Read, Grep, Explore)
4. Propõe plano detalhado: arquivos, ordem, riscos
5. Você revisa, ajusta, aprova
6. `ExitPlanMode` — agora ela executa

### Bom plano vs plano ruim

Bom plano tem:

- ✅ Lista numerada de mudanças por arquivo
- ✅ Ordem clara (B depende de A, então A primeiro)
- ✅ Check-points intermediários ("aqui, rodar test antes de seguir")
- ✅ Identificação de riscos
- ✅ Alternativas consideradas e descartadas (com razão)

Plano ruim:

- ❌ "Vou implementar a feature seguindo o padrão"
- ❌ Sem mencionar arquivos específicos
- ❌ Sem ordem clara
- ❌ Sem reconhecimento de risco

Se o plano vier ruim, **rejeite**. Refine o pedido inicial e tente de novo.

---

## 3. Workflows — multi-agent orchestration

Claude Code suporta **workflows** (scripts JS que orquestram agentes determinísticamente). Não é raramente usado, mas vale conhecer.

### O que é

Você escreve um script:

```javascript
phase('Find findings')
const findings = await parallel(dimensions.map(d => () =>
  agent(`Find issues in ${d.area}`, { schema: FINDINGS_SCHEMA })
))

phase('Verify findings')
const verified = await parallel(findings.flat().map(f => () =>
  agent(`Adversarially verify: ${f.title}`, { schema: VERDICT_SCHEMA })
))
```

E Claude executa **N agentes em paralelo**, encadeando resultados.

### Quando vale

- Auditoria abrangente de codebase ("encontre todos os anti-padrões X")
- Migrações em larga escala ("converta todos arquivos Y de A pra B")
- Reviews multi-dimensional ("cheque bugs + perf + segurança" em paralelo)
- Tarefas com **escala** que um único contexto não comporta

### Quando NÃO vale

- Tarefa que cabe num único contexto
- Trabalho não-paralelizável
- Quando você não vai conseguir revisar resultado de N agentes

> ⚠️ Workflows queimam tokens fast. Use com **critério**. Em times com orçamento, peça aval antes de rodar workflow grande.

### Caso de uso real

Imagine que o time NHB queira garantir que **nenhum** módulo tem default export.

Workflow:

```
1. Lista todos arquivos .ts em apps/api/src e apps/web/src
2. Pipeline em paralelo: cada arquivo → agente verifica export default
3. Agregação: lista os que têm
```

Você teria a lista em minutos vs horas se fosse na mão.

---

## 4. MCPs — Model Context Protocol

MCPs são **conectores** entre Claude e ferramentas externas (Slack, GitHub, Linear, Google Drive, banco de dados internos, …).

### Como funciona

Você configura um MCP server (local ou hospedado). Ele expõe ferramentas via protocolo padrão. Claude descobre essas ferramentas e pode usá-las.

### Casos de uso no contexto NHB

- **MCP de banco read-only** — Claude pode consultar dados de produção pra reproduzir bug sem acesso direto
- **MCP de Linear / Jira** — ler ticket sem você colar
- **MCP de Slack** — buscar mensagem que mencionou aquele bug
- **MCP de Drive** — ler especs em Google Docs

### Cuidados

- **MCPs autenticados são poderosos** — Claude age **como você** nesses sistemas
- **Sempre revise permissões** — não dê escrita se só leitura basta
- **MCPs de produção exigem cuidado especial** — read-only por default

### O custo de manter

MCPs adicionam complexidade. Vale apenas se o uso é frequente. Time NHB hoje funciona bem sem MCPs custom — adicione só quando ROI for claro.

---

## 5. Skills custom

Skills no Claude Code são **arquivos .md** com instruções estruturadas. Já temos vários: `/code-review`, `/verify`, `/commit`, `/run`…

### Como criar um skill custom

```markdown
# .claude/skills/<skill-name>.md
---
description: O que o skill faz, em uma frase
---

# Instruções pro modelo quando esse skill for invocado

[descrição do comportamento esperado, exemplos, restrições]
```

Quando você roda `/skill-name`, Claude carrega essas instruções e age.

### Quando criar skill custom no time

- ✅ Tarefa **recorrente** que vocês fazem com a mesma estrutura toda vez
- ✅ Quer **garantir consistência** entre devs
- ✅ Vale documentar o "como fazer X bem" num lugar acionável

### Exemplos plausíveis pro time NHB

- `/new-module` — guia criar módulo seguindo template `project-tracking`
- `/spec-summary` — resume US-XX no formato padrão
- `/migration-check` — verifica que migration nova tá idempotente / segura
- `/i18n-sync` — verifica que pt-BR.ts e en.ts têm as mesmas chaves

### Cuidado

Não crie skill pra cada tarefa única. Eles têm **custo de manutenção** — se vira lixo, polui.

---

## 6. CLAUDE.md compartilhado + memória persistente

### CLAUDE.md como contrato vivo

`CLAUDE.md` é o contrato entre IA e o time. Já temos um excelente. Algumas práticas avançadas:

#### Hierarquia (sub-CLAUDE.md)

Você pode ter `CLAUDE.md` no root **e** em sub-diretórios:

```
nhb-project-delivery/
├── CLAUDE.md                     # regras gerais
├── apps/api/CLAUDE.md            # regras específicas do backend
└── apps/api/prisma/CLAUDE.md     # regras específicas pra migrations
```

Claude carrega o mais específico ao trabalhar naquele path.

#### Quando vale criar sub-CLAUDE.md

- Diretório tem **convenções específicas** que confundem se misturadas
- Equipe especializada cuida daquele diretório
- Regras detalhadas demais pra entrar no root sem inchar

#### Quando NÃO criar

- Convenção vale pra todo projeto → vai no root
- Regra única → escreve no root (não cria arquivo só pra ela)

### Auto-memory — política do time

Claude Code salva memórias em `~/.claude/projects/<projeto>/memory/`. Por padrão, é por dev.

Plus avançado: o time pode **versionar memórias compartilhadas** em arquivos no repo (`docs/conventions/*.md` por exemplo) e mencioná-las nos pedidos. Resultado: aprendizado coletivo.

Cuidados:

- **Memória pode ficar desatualizada** — revise periodicamente
- **Memória negativa fica perigosa** (regra que era válida virou obsoleta)
- Cap 09 cobre esse risco

---

## Padrões avançados que combinam técnicas

### Padrão "review profundo"

```
1. Plan mode: "vou auditar o módulo X. Antes, proponha plano"
2. Workflow: 4 agentes em paralelo, cada um numa dimensão
3. Synth: agente final que sintetiza, prioriza
4. Você revisa o output final
```

### Padrão "refator gigante seguro"

```
1. Plan: identifica todos os call-sites
2. Pipeline: cada call-site → refactor → test
3. Verify: rodar test inteiro após cada batch
4. Você intervém entre batches pra checkar
```

### Padrão "explore + skill custom"

```
Skill `/onboard-module <nome>`:
1. Explore subagente mapeia o módulo
2. Resume em formato padrão
3. Output: docs/modules/<nome>.md
```

Times geram doc viva à medida que módulos são onboardados.

---

## Custo, complexidade, ROI

Técnicas avançadas têm **custo**:

- Workflow lança N agentes — $$ multiplicado
- MCP exige configuração e segurança contínua
- Skills custom precisam manutenção
- Sub-CLAUDE.md exige disciplina pra não conflitar

**Use apenas quando ganho é claro.** Para 90% do dia-a-dia, os capítulos 03/04/05 cobrem.

> 💡 **Heurística:** se você gasta >2h/semana fazendo a mesma sequência manual de agentes, vale criar workflow ou skill. Senão, não.

---

## 🎯 Tente agora (exercício avançado)

Escolha **um** dos abaixo (não os três — foco):

### Opção A — Subagentes paralelos

Use o repo NHB. Lance 3 subagentes Explore em paralelo, cada um mapeando um módulo (`auth`, `users`, `project-tracking`). Peça reporte em 100 palavras cada. Sintetize você mesmo as similaridades de padrão.

### Opção B — Plan mode formal

Pegue uma feature do seu backlog que toca ≥5 arquivos. Em Claude Code, entre em Plan mode. Avalie criticamente o plano que vem. Refine 2 vezes antes de aprovar.

### Opção C — Skill custom

Identifique uma tarefa recorrente do seu trabalho (ex.: "criar nova migration", "validar i18n", "abrir PR padrão"). Escreva um skill custom em `.claude/skills/<seu-skill>.md`. Use por uma semana. Avalie se vale manter.

---

➡️ Próximo: [09 — Anti-padrões](./09-anti-padroes.md)
