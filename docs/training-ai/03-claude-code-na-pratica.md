# 03 — Claude Code na prática

Capítulo prático sobre **a ferramenta Claude Code** — CLI agente, executa comandos, edita arquivos, navega no repo.

> Se você usa só Cursor, pode pular para o cap 04. Vale ler depois mesmo assim — alguns padrões valem para qualquer ferramenta agente.

---

## O modelo mental do Claude Code

```
┌─────────────────────────────────────────────────────────┐
│  Você                                                    │
│   ↓                                                      │
│  Claude (modelo)                                         │
│   ↓                                                      │
│  Tools (Read, Edit, Bash, Grep, Agent, …)                │
│   ↓                                                      │
│  Seu filesystem / repo / processos                       │
└─────────────────────────────────────────────────────────┘
```

Diferente de um chat puro, Claude Code **age** no seu mundo. Ele lê arquivos, edita, roda comandos. Isso muda como você pensa:

- **Não cole código pra ele ver** — peça pra ler
- **Não copie a saída do seu terminal** — peça pra ela rodar
- **Não tente substituir o filesystem com texto** — confie nas tools

---

## Os comandos que você usa todo dia

### `/clear`

Zera a conversa. Use:

- Ao começar tarefa nova
- Quando sessão ficou longa
- Quando respostas começaram a "bagunçar"

### `/compact`

Comprime o histórico mantendo só o essencial. Use **com cuidado**:

- Quando você quer continuar a mesma tarefa mas está enchendo o contexto
- Releia o resumo gerado pra ter certeza que preservou o que importa

### Plan mode

`/plan` (ou shortcut do seu setup) entra em **plan mode**. Nesse modo, Claude não executa mudanças — só **propõe um plano**.

Use quando:

- A tarefa é grande / arriscada
- Você quer alinhar abordagem antes de codar
- Tem várias formas de fazer e você quer ver as opções

Fluxo típico:

1. Você descreve a tarefa
2. Entra em plan mode (Claude pode propor a entrada se sentir necessário)
3. Claude lê os arquivos relevantes e propõe um plano
4. Você ajusta (`isso não vai funcionar porque X`)
5. `ExitPlanMode` quando aprovado — aí ele executa

### Slash commands de skills do projeto

Este repo tem skills configurados. Os úteis:

| Comando | O que faz |
| --- | --- |
| `/code-review` | Review do diff atual no padrão `low/medium/high/ultra` |
| `/code-review high` | Mais cobertura, pode incluir achados incertos |
| `/code-review ultra` | Review multi-agent em nuvem (caro mas profundo) |
| `/simplify` | `/code-review` + aplica os fixes na working tree |
| `/verify` | Sobe o app e verifica que mudança funciona end-to-end |
| `/run` | Sobe e dirige a app pra você ver mudança rodando |
| `/commit` | Gera mensagem conventional e comita |
| `/clean_gone` | Limpa branches locais cujo remoto sumiu |
| `/loop 5m <task>` | Roda algo recorrente (ex.: `/loop 5m /code-review`) |
| `/init` | Cria CLAUDE.md inicial num repo |

---

## Tools sob o capô (entender pra saber o que esperar)

Quando você pede algo, Claude usa tools. Vale saber quais:

### Read

Lê arquivo do disco. Você verá `Reading <path>`. Para arquivos enormes, ela pode usar `limit/offset` ou pedir paginação.

### Edit / Write

`Edit` faz substituição cirúrgica em arquivo existente. `Write` cria/sobrescreve arquivo inteiro. Edit é preferido (mais seguro). Você verá um diff na UI.

### Bash

Roda comandos no seu shell. Permissão é configurável — comandos perigosos pedem confirmação.

### Grep / find

Busca rápido no repo. Claude pode chamar diretamente ou delegar pro Explore.

### Agent (subagentes)

Lança outro Claude com escopo isolado. Tipos:

- **Explore** — só leitura, ótimo pra mapear código sem sujar o contexto principal
- **general-purpose** — qualquer coisa que valha isolar
- Outros específicos (Plan, code-reviewer, etc.)

Quando vale subagente:

- Você quer fazer uma **investigação ampla** que vai puxar muitos arquivos. Faça via Explore — o resumo dele entra no seu contexto, não as 50 leituras dele.
- Você tem **trabalho paralelo independente**. Dois agents podem trabalhar enquanto você faz outra coisa.

### TaskCreate / TaskUpdate

Gerenciam uma TODO interna da sessão. Quando a tarefa tem 4-5 passos, Claude cria a lista e marca como `in_progress` / `completed`. Você vê o progresso.

---

## Padrões de trabalho que funcionam

### Padrão 1 — "Mapeie antes de mudar"

```
Antes de eu te pedir a refatoração, lance um agente Explore para
mapear: onde está usado o hook useDashboardFilters, quais
componentes consomem o resultado, e que tipos saem dele. Reporte
em até 200 palavras.
```

Você ganha um mapa específico **sem** poluir seu contexto com 8 leituras.

### Padrão 2 — "Plan first em tarefas grandes"

```
Quero implementar US-08 (project-tracking-import). Antes de codar,
entre em plan mode: leia a spec em docs/specs/US-08-..., olhe o
project-tracking.module.ts atual, e proponha quais arquivos
adicionar/modificar e em que ordem.
```

Você revisa o plano. Se algo não fizer sentido, ajusta antes de gastar 1h codificando.

### Padrão 3 — "Mudança + verify"

```
Adicione o campo pmEmail conforme cap 01 deste material. Depois
de codar, rode `pnpm --filter @nhb-status-report/api test` e
reporte o resultado. Se falhar, corrija e tente de novo (no máx 3x).
```

A IA segue um ciclo verificável. Sem isso, ela pode dizer "done" sem nunca ter rodado.

### Padrão 4 — "Code-review como segunda opinião"

```
Acabei minha branch. Rode /code-review medium e me apresente os
achados sem corrigir nada — quero decidir.
```

Útil porque a Claude que **codificou** tem viés de defender a obra. Lançar um `/code-review` é um agente novo, com instruções de **questionar**.

### Padrão 5 — "Verify antes de pedir review humano"

```
/verify

(Skill que sobe o app, simula o fluxo de upload de planilha,
confirma que o dashboard atualiza, e reporta findings)
```

Vale ouro antes de "pedir review". Você descobre regressões silenciosas.

---

## Como pedir bem no Claude Code (recapitulando o cap 01 + específicos da ferramenta)

✅ Boas práticas:

- **Aponte arquivos por path completo** ("`apps/api/src/...`") em vez de descrever
- **Use plan mode pra tarefas com >5 arquivos**
- **Delegue exploração** ao subagente Explore
- **Peça pra ela rodar comandos** em vez de descrever a saída
- **Use `/clear` entre tarefas** — não maratona

❌ Ruim:

- "Olha esse arquivo" e cola 200 linhas (a IA tem Read — peça pra ler)
- Tentar substituir Plan Mode digitando "siga este plano" num parágrafo gigante
- Deixar a sessão rodando 8h com 6 tópicos diferentes
- Não revisar diff antes de aceitar

---

## Hooks: customizando o comportamento

Hooks rodam **automaticamente** em eventos: antes de uma Bash tool, depois de cada Edit, no fim da resposta…

Casos comuns no projeto:

- **Allowlist de bash** (`settings.json`) — comandos comuns não pedem permissão
- **Hooks de pré-commit** — roda lint antes do commit
- **Status line** — mostra info do projeto na CLI

Para o time:

- O time-lead configura uma allowlist comum
- Você não precisa mexer nisso
- Se um comando que você usa toda hora pede permissão, peça pro lead adicionar

> Skill útil: `/fewer-permission-prompts` analisa seu histórico e propõe permissões pra adicionar à allowlist do projeto.

---

## Memória persistente — o que ela vê automaticamente

Claude Code lê automaticamente:

- `CLAUDE.md` da raiz do repo (e sub-CLAUDE.md em diretórios filhos, se existirem)
- Memórias em `~/.claude/projects/<projeto>/memory/` (auto-memory)

> Memória **mais quente** = `MEMORY.md`. Carregado sempre. Mantenha enxuto.

Quando alguém do time descobre uma convenção importante, peça à Claude pra **lembrar** ("salva como memória que neste projeto sempre usamos kebab-case em arquivos"). Vai ficar disponível em sessões futuras.

---

## Limites práticos da ferramenta

- **Não tem memória entre sessões a menos que escrita** — `/clear` zera mesmo
- **Tools podem falhar** — comando sem permissão, arquivo bloqueado, etc.
- **Edits grandes** podem falhar silenciosamente — sempre revise o diff
- **Comandos com prompts interativos** (`vim`, `gcloud auth login`) precisam ser rodados por você diretamente

---

## Quando NÃO usar Claude Code

- **Edit de uma única linha óbvia** — você digita mais rápido
- **Aprender uma sintaxe nova do zero** — abra a doc oficial (ela pode estar desatualizada)
- **Decidir trade-off de produto** — discuta com humanos
- **Conectado a sistema com prompts interativos** — mande pro seu terminal

---

## 🎯 Tente agora

Faça este exercício de **15 minutos**:

1. Abra o repo NHB no seu editor + Claude Code
2. `/clear`
3. Peça: "Use um agente Explore para responder: o que faz exatamente o `BiSanityChecker`? Cite os arquivos. Máx 150 palavras."
4. Compare o resumo dela com você abrir os arquivos manualmente.
5. **Mensure**: quanto tempo demoraria pra você fazer essa investigação na mão?

Esse exercício é um sintoma da diferença real — não o teórico.

---

➡️ Próximo: [04 — Cursor na prática](./04-cursor-na-pratica.md)
