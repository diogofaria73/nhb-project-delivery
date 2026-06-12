# 00 — Mental model: como pensar em IA pra dev

Antes de qualquer técnica, você precisa de uma imagem mental correta do que IA **é** e do que **não é**. A maioria das frustrações vem de modelos mentais errados — não de problemas técnicos.

---

## A analogia que funciona

> IA não é um **oráculo**. É um **par júnior brilhante e amnésico**.

Vamos abrir cada parte:

### "Par"

Você programa **com** ela, não **para** ela. Você ainda decide:

- O que vai ser feito
- Como vai ser dividido
- Quando parar
- Se o resultado serve

Quando você delega 100% e só lê o output final, o resultado é ruim ou perigoso. Quando você usa como par — discute, refina, valida — fica muito bom.

### "Júnior"

Apesar de ler muito, IA tem **limites de júnior**:

- Pode confiar demais em padrões que viu (e aplicá-los onde não deveria)
- Tende a fazer **o pedido literal**, não a **intenção** por trás
- Repete o que viu em outros projetos, ignorando convenções do seu
- Precisa de orientação clara sobre escopo (senão expande)

A diferença é que esse júnior **lê 50 arquivos em 3 segundos** e **digita rápido**. Mas julgamento é seu.

### "Brilhante"

Ela é boa em:

- **Síntese de muito código** ("explique o que esse módulo faz")
- **Padrões repetitivos** ("crie esse use case seguindo o template do outro")
- **Tradução entre formatos** (TS → JSON Schema, SQL → Prisma, JS → TS)
- **Refator mecânico** (renomear, extrair função, mover arquivo)
- **Rascunho inicial** de qualquer coisa estruturada
- **Debugging com pistas claras** (você cola erro + stack trace e ela aponta hipóteses)

### "Amnésica"

Cada conversa começa do zero. Ela **não lembra**:

- O que você fez ontem
- Que padrão o seu time prefere (se você não disser)
- Que aquele arquivo já foi refatorado
- Discussões anteriores sobre o mesmo problema

Tudo que ela "sabe" sobre o seu mundo precisa ser **trazido pra dentro do contexto** — manualmente ou por mecanismos persistentes (CLAUDE.md, regras do Cursor, memória). Vamos falar disso no capítulo 02.

---

## O que IA faz bem (categoria de tarefas)

| Categoria | Exemplo concreto | Por que funciona |
| --- | --- | --- |
| **Exploração** | "Onde no repo está definida a regra de lockout de login?" | Lê arquivos rápido, padrões fáceis de detectar |
| **Boilerplate seguindo template** | "Crie um novo use case `ArchiveImport` análogo a `DeleteImport`" | Copia padrão existente — único trabalho é encaixar |
| **Testes para código existente** | "Escreva specs cobrindo edge cases de `IsoWeekService.getIsoWeek`" | Tem código pra olhar, gera cenários por enumeração |
| **Refatoração mecânica** | "Extraia esse bloco em hook `useDashboardFilters`" | Operação cirúrgica, escopo claro |
| **Tradução de formato** | "Converta esse schema Prisma em Zod" | Mapeamento determinístico |
| **Explicação** | "O que `bi-sanity-checker.ts` faz?" | Síntese de código que já está lá |
| **Rascunho de spec ou doc** | "Rascunhe a US para a feature X com seções padrão" | Estrutura padronizada, você revisa o conteúdo |
| **Debug com erro completo** | "Stack trace: TypeError... | Aqui está o código: …" | Pistas claras → hipóteses focadas |

---

## O que IA faz mal

| Categoria | Exemplo | Por que falha |
| --- | --- | --- |
| **Decisões arquiteturais grandes** | "Devo usar event sourcing aqui?" | Sem contexto de produto, time, escala — IA opina genericamente |
| **"Adivinhar" requisitos vagos** | "Faz um dashboard bonito" | Vai inventar algo que não é o que você quer |
| **Garantir corretude** | "Esse código está livre de bugs?" | Sempre vai responder algo plausível — não substitui tests |
| **Estimar esforço** | "Quanto tempo isso leva?" | Não tem ideia da sua velocidade nem complicações ocultas |
| **Julgamento de produto** | "Vale a pena fazer essa feature?" | Não conhece seu cliente, suas prioridades, sua história |
| **Tarefas com contexto vivo** | "Continue de onde paramos ontem" | Não lembra. Cada sessão começa do zero. |
| **Modificações enormes em paralelo** | "Refatore o monorepo inteiro de uma vez" | Quebra coisas em silêncio. Você não vai conseguir revisar 80 arquivos. |

---

## Por que prompts falham (4 causas)

Quando você manda algo e a resposta vem genérica/errada, sempre é uma das quatro:

### Causa 1 — Contexto faltando

Você pediu "refatore esse hook" mas IA não tem como saber:

- Onde o hook é usado
- Qual API ela precisa preservar
- Que padrão o resto do código segue

**Sintoma:** resposta "típica" do tipo dos exemplos que ela viu em training, sem se adequar ao seu projeto.

### Causa 2 — Objetivo vago

"Melhora isso" — melhorar o quê? Performance? Legibilidade? Quebrar em funções menores?

**Sintoma:** ela escolhe um eixo arbitrário (geralmente "legibilidade") e refatora por refatorar.

### Causa 3 — Restrição implícita não declarada

Você sabe que **não pode** usar uma lib específica, ou **precisa manter** uma API pública, mas não disse.

**Sintoma:** solução que viola a regra. Você fica nervoso pensando "ela está sabotando". Não está — ela só não sabia.

### Causa 4 — Critério de pronto ausente

"Faz isso aqui" sem dizer quando parar. Ela escolhe.

**Sintoma:** ou ela faz de menos ("ok, terminei o primeiro arquivo, posso continuar?") ou de mais (refatora tudo).

> 💡 Esses quatro defeitos são os ingredientes do capítulo 01: **contexto + objetivo + restrição + critério de pronto**.

---

## A trap mais perigosa: "responde sempre confiante"

IA quase nunca diz "não sei". Ela vai inventar uma resposta plausível antes de admitir limite. Isso significa:

> Resposta confiante ≠ resposta correta.

Especialmente em:

- **Pacotes/APIs específicos** — ela pode inventar uma função que não existe naquela versão
- **Sintaxe de DSL nichada** — Prisma tem features que ela "acha que tem", mas não tem
- **Histórico do seu repo** — ela não sabe que aquele arquivo foi removido mês passado
- **Fatos sobre o mundo posteriores ao training** — bibliotecas mudaram

Defesa: cap 07 (verificação). Por enquanto, internalize: **respondeu rápido e confiante? Pode estar mentindo.**

---

## IA não substitui você

Este é o tópico onde resistência costuma vir. Vou ser direto:

- **IA não decide por você o que vale construir.**
- **IA não assume responsabilidade pelo PR que você comita.**
- **IA não defende sua tecnologia em reunião de arquitetura.**
- **IA não pareou com o time durante 2 anos pra saber por que aquela decisão foi tomada.**
- **IA não vai ao café com o produto pra entender a frustração real do usuário.**

Tudo isso continua sendo você. O que IA faz é **acelerar o trabalho mecânico** entre essas decisões. O dev que sabe usar IA tem **mais tempo** para a parte interessante — não menos.

---

## Uma nota sobre senioridade

- **Júnior** que usa IA sem critério vira muleta: deixa de aprender fundamentos porque "a IA fez". Resultado: júnior médio que estagnou.
- **Júnior** que usa IA com critério aprende **mais rápido** que sem: pergunta "por quê", lê o código gerado, refaz à mão pra entender, valida hipóteses.
- **Sênior** que rejeita IA por princípio gasta tempo em tarefas que outros do mercado fazem em 10% do tempo. Não é só ineficiência — é estagnação.
- **Sênior** que abraça IA com critério ganha tempo pra arquitetura, mentoring, decisões duras.

Em ambos casos, a palavra-chave é **critério**. Esse material existe pra ensinar isso.

---

## 🎯 Tente agora

Pegue **uma tarefa simples** que você fez essa semana (qualquer uma — uma função, um teste, uma busca no repo). Pense:

1. Como você pediria para a IA fazer isso?
2. Marque mentalmente: você passou contexto? objetivo claro? restrição? critério de pronto?
3. Tente agora **na sua ferramenta** (Claude Code ou Cursor). Não corrija depois — só observe o que veio.
4. Anote em 1 frase: **o que faltou** no seu pedido pra resposta ter sido melhor.

Essa anotação é o material vivo dos próximos capítulos.

---

➡️ Próximo: [01 — Anatomia de um bom pedido](./01-anatomia-do-pedido.md)
