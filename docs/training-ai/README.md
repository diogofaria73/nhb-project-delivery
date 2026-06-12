# Programa de Capacitação — IA aplicada ao desenvolvimento

Material para o time desenvolver **habilidade prática real** em trabalhar com IA durante o ciclo completo de desenvolvimento — não palestra motivacional, não promessa de produtividade, **técnica**.

---

## Por que este material existe

Quase todo dev hoje já abriu uma janela de chat com IA, pediu algo, recebeu uma resposta meia-boca e fechou pensando "isso não serve". O problema raramente é a IA — é que **ninguém ensina a pedir bem, gerenciar contexto e verificar resposta**.

Este programa cobre essas três coisas com exemplos concretos do nosso próprio repositório (`nhb-project-delivery`). O resultado esperado: cada dev sai sabendo **quando** usar IA, **como** pedir, **como** verificar e **quando deixar pra lá**.

> Importante: o objetivo **não é** transformar IA em muleta. É transformá-la em **alavanca controlada**. Você continua no comando.

---

## Para quem é

- Devs juniores, plenos e seniores do time NHB
- Tendo (a) o repositório rodando localmente e (b) **uma das duas ferramentas** instaladas:
  - **Claude Code** (CLI ou IDE)
  - **Cursor** (editor)
- Disposição para passar por **antes/depois** crus — alguns exemplos vão envergonhar prompts que você já mandou. Isso é o ponto.

---

## A trilha em 4 camadas

### 🧠 Trilha 1 — Fundamentos (toda a equipe)

| # | Capítulo |
| --- | --- |
| 00 | [Mental model — como pensar em IA pra dev](./00-mental-model.md) |
| 01 | [Anatomia de um bom pedido](./01-anatomia-do-pedido.md) |
| 02 | [Gerenciando contexto — o segredo invisível](./02-gerenciando-contexto.md) |

### 🛠 Trilha 2 — As ferramentas (escolha a sua)

| # | Capítulo |
| --- | --- |
| 03 | [Claude Code na prática](./03-claude-code-na-pratica.md) |
| 04 | [Cursor na prática](./04-cursor-na-pratica.md) |

> Não precisa ler os dois. Foque na que você usa no dia a dia. O outro fica como referência para conversas com colegas do "outro time".

### 🔄 Trilha 3 — Aplicado ao dia-a-dia (toda a equipe)

| # | Capítulo |
| --- | --- |
| 05 | [Padrões de tarefas — receitas por tipo de trabalho](./05-padroes-de-tarefas.md) |
| 06 | [Do spec ao PR — fluxo integrado](./06-do-spec-ao-PR.md) |
| 07 | [Verificação e confiança](./07-verificacao-e-confianca.md) |

### 🚀 Trilha 4 — Avançado (seniores e curiosos)

| # | Capítulo |
| --- | --- |
| 08 | [Técnicas avançadas: subagentes, workflows, MCPs, skills](./08-tecnicas-avancadas.md) |

### Comum a todos

| # | Capítulo |
| --- | --- |
| 09 | [Anti-padrões — o que NÃO fazer](./09-anti-padroes.md) |
| 10 | [Laboratório — 6 exercícios no repo NHB](./10-laboratorio.md) |

---

## Como usar

**Não em maratona.** Distribua. Sugestão:

- **1 capítulo por dia** durante 2 semanas (≈30 min de leitura + 30 min de prática)
- O **laboratório** (cap 10) fica para uma sessão dedicada com a equipe junta — 2-3 horas, pareando

Ao final de cada capítulo há um bloco `## 🎯 Tente agora` com algo concreto pra fazer no seu próprio editor antes do próximo capítulo. **Não pule.**

---

## Sobre resistência

Se a sua equipe tem resistência a IA, este material **não vai dissolvê-la com discursos**. Vai dissolvê-la com **resultado tangível**: o dev que tentar fazer o capítulo 06 com o repo NHB vai sentir o ganho real.

Quem implementar 2-3 capítulos e ainda assim achar que "não vale a pena": ouça com seriedade. Pode ser que o trabalho específico daquela pessoa não se beneficie tanto, e isso é informação útil — não uma falha dela.

> 🤝 **Princípio:** ninguém é obrigado a usar IA. Mas todos do time precisam saber **avaliar com critério** PRs gerados com auxílio de IA — porque vão revisar uns dos outros.

---

## Honestidade sobre o estado da arte (em 2026)

IA hoje:

- ✅ É excelente para **explorar codebase**, **gerar boilerplate seguindo padrão existente**, **escrever testes**, **rascunhar refactor**, **explicar código alheio**, **debugar com pistas claras**
- ⚠️ É **medíocre** para: decisões arquiteturais grandes, lidar com requisitos vagos, fazer trade-offs de produto, "ler a mente" de um usuário
- ❌ É **péssima** para: garantir corretude sem testes, julgar contexto político/humano, decidir o que **não** fazer

Quem aceita esses limites tira muito proveito. Quem espera mágica frustra e desiste. Este material te ajuda a ficar do primeiro lado.

---

## O que você vai conseguir fazer no final

- Escrever pedidos que tiram respostas úteis na primeira ou segunda tentativa
- Saber **em qual ferramenta** colocar qual tipo de trabalho (Tab? Composer? Plan mode? Subagente?)
- Integrar IA ao fluxo `spec → branch → impl → review → PR` sem perder controle
- Detectar resposta plausível-mas-errada antes de aceitar
- Revisar PR de colega que usou IA — saber **o que cobrar**
- (Avançado) Orquestrar subagentes em paralelo pra tarefas que valem o custo

---

## Conexão com o tutorial técnico do projeto

Este programa **complementa** (não substitui) o tutorial técnico em `docs/training/` — aquele explica **como** o projeto NHB está organizado; este explica **como usar IA pra trabalhar nele**. Vale o time fazer os dois — começando pelo técnico se ainda não conhece o repo.

---

➡️ Comece em [00 — Mental model](./00-mental-model.md)
