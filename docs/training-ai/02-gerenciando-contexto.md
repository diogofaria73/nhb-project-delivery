# 02 — Gerenciando contexto: o segredo invisível

Este é o capítulo que **mais separa quem tira proveito de IA de quem não tira**. Habilidade de prompting é metade da história. A outra metade — invisível — é **gerenciar o que a IA enxerga**.

---

## A regra de ouro

> **IA só sabe o que está no contexto.** Nada mais.

Se não está no contexto, ela vai (a) responder genericamente, (b) inventar, ou (c) pedir info que você já tinha mas não compartilhou. As três opções queimam seu tempo.

---

## O que é "contexto" exatamente

É **toda informação visível à IA naquele momento**. Em ferramentas modernas:

| Item | Sempre lá? | Você controla? |
| --- | --- | --- |
| Instruções do sistema (papel, regras gerais) | Sim | Não diretamente |
| Mensagens da conversa atual | Sim | Sim (escrevendo) |
| Arquivos abertos no editor (Cursor) | Sim | Sim (abrindo/fechando) |
| `CLAUDE.md` / `.cursorrules` | Sim | Sim (editando o arquivo) |
| Conteúdo de arquivos que ela leu via tool | Sim | Indireto (você pede a leitura) |
| Output de comandos que ela rodou | Sim | Indireto |
| **Resto do seu repo** | **NÃO** | Você precisa trazer |
| **Conversas anteriores** | **NÃO** | Você precisa resumir / persistir |
| **Internet em tempo real** | Depende | Via tool específica |
| **Mudanças que você fez fora do editor** | Pode ou não | Releitura/refresh |

---

## A janela de contexto tem **limite**

Cada modelo tem um limite (tokens). Quando enche, ferramentas **cortam** ou **comprimem** — e isso é invisível pra você.

Sintomas de contexto cheio:

- IA "esqueceu" algo que você disse 50 mensagens atrás
- Respostas começam genéricas porque informações específicas foram cortadas
- Mais lentidão e mais custo
- Mais "alucinação" — ela preenche lacunas com palpites

### Cuidado com a falsa segurança

"Tem 200k de janela, eu nunca vou encher" — pensar assim leva a **contexto sujo**, que é pior que contexto cheio. Contexto cheio é lento e caro. Contexto sujo é **errado** (vou explicar abaixo).

---

## Contexto sujo: o inimigo silencioso

> **Contexto sujo** = informação **desatualizada, irrelevante ou contraditória** misturada com a útil.

Como ele se forma:

- Você carregou 10 arquivos pra a IA "ter contexto" — mas só 2 importavam
- A sessão durou 4 horas e mudou de tópico 3 vezes
- Você refatorou um arquivo, mas ela ainda vê a versão antiga na conversa
- Discussão sobre uma abordagem que foi descartada continua ocupando espaço
- 200 linhas de output de teste passado misturadas com a tarefa atual

Resultado: a IA começa a misturar coisas. Sugere refator baseado em código que já mudou. Propõe abordagem que vocês já descartaram. Mistura padrões de dois módulos.

> 💡 **Heurística:** se você não consegue resumir em 2-3 frases **o que está sendo trabalhado agora**, o contexto está sujo. Comece nova sessão.

---

## Quando começar nova sessão

Sintomas de "hora de zerar":

- ✅ Tarefa anterior terminou (e você quer começar outra)
- ✅ Respostas começaram a sair fora do tom / fora do padrão
- ✅ Ela está se referindo a arquivos / discussões que não existem mais
- ✅ Você está corrigindo a mesma coisa 3 vezes (ela esqueceu)
- ✅ Mudou de feature / módulo
- ✅ Mudou de modo (debug → refator → planning)

> Em Claude Code, `/clear` zera a conversa mantendo só o sistema + memória.
> Em Cursor, abra um **novo chat** ou **novo composer**. Não continue o antigo.

---

## Compactação: salvador ou armadilha?

Algumas ferramentas (Claude Code) oferecem **compactar** o histórico — resumir mensagens antigas pra liberar espaço.

Quando é bom:

- Trabalho longo, focado num único objetivo, e você quer continuar
- A síntese vai preservar decisões-chave

Quando é ruim:

- O compactador resume **errado** o que era importante
- Você esquece de verificar e segue confiando

Recomendação: prefira **começar nova sessão com resumo seu** ("Continuando o trabalho de ontem: já fizemos X, Y. Agora precisamos de Z. Arquivos relevantes: A, B."). É mais trabalhoso mas é controlável.

---

## Como **trazer** contexto pra dentro

Cinco mecanismos por importância:

### 1. @-mentions e referências explícitas

**Cursor:** `@file`, `@folder`, `@code`, `@docs`, `@web`, `@git`

```
@apps/api/src/modules/project-tracking/application/use-cases/delete-import.use-case.ts
crie um análogo para "archive"
```

**Claude Code:** referencie por path ou peça pra ler explicitamente. Ou use o agent Explore que vai navegar.

> Quanto mais específico, melhor. `@apps/api/src/modules/project-tracking/` é melhor que `@apps/`.

### 2. Arquivos abertos no editor (Cursor especialmente)

Os arquivos abertos nas abas do Cursor entram automaticamente em contexto para Tab e Composer (até um limite). Isso significa:

- **Limpe abas irrelevantes** antes de invocar IA
- **Abra arquivos chave** antes de começar uma tarefa

### 3. Memória persistente do projeto

- **`CLAUDE.md`** — instruções gerais do projeto (já temos um excelente)
- **`.cursorrules`** ou `.cursor/rules/` — equivalente no Cursor
- **`docs/specs/`** — quando relevante, mencione o arquivo

Esses arquivos são **lidos automaticamente** pelas ferramentas. **Manter atualizados é responsabilidade do time**.

### 4. Memória semântica (auto-memory)

Claude Code escreve memórias em `~/.claude/projects/<projeto>/memory/` quando aprende:

- Preferências suas
- Convenções do projeto
- Decisões importantes

Memórias relevantes são puxadas em sessões futuras **sem você pedir**. Útil mas:

- Verifique periodicamente
- Pode ficar desatualizada (cap 09 — anti-padrão)

### 5. Resumo manual

A técnica mais subutilizada e poderosa:

```
Resumo do que já discutimos:
- Decidimos seguir abordagem A, descartamos B porque <X>
- O contrato do shared mudou: <forma nova>
- Próximo passo: implementar Y no backend

Agora preciso de ajuda com Y.
```

Você está **forçando síntese** e **descartando ruído** ao mesmo tempo. Funciona até em ferramenta sem memória nenhuma.

---

## CLAUDE.md / regras do Cursor — guia rápido

### O que vai

- Convenções de código (naming, exports, lint rules invisíveis)
- Padrões arquiteturais ("DDD em camadas, ver `project-tracking` como template")
- Stack e comandos (`pnpm dev`, `prisma:migrate`)
- Restrições gerais ("não usamos Redux", "nunca commit sem rodar lint")
- **Forbidden patterns** que o lint não pega (uso de `any`, default exports)

### O que NÃO vai

- Documentação de feature específica (vai em `docs/specs/`)
- Estado temporário ("estamos mexendo no módulo X agora")
- Histórico de decisões antigas
- Coisas óbvias pra qualquer dev ("use TypeScript")

> 💡 **Teste do CLAUDE.md:** abra ele e leia como se fosse novo no time. Toda regra ali precisa ser **acionável e específica do projeto**. Se é genérica, sai.

---

## Custos invisíveis

Contexto não é grátis:

- **$$ por token** — mais contexto = mais caro por mensagem
- **Latência** — janelas maiores demoram mais a processar
- **Qualidade** — mais informação irrelevante = mais "alucinação"

Em ferramentas com plano fixo (Cursor / Claude Code com plano) você não vê o $$, mas as outras duas dimensões você sente.

---

## Padrão recomendado: "sessão por tarefa"

Adote este ciclo:

```
1. Abrir tarefa nova → começar sessão limpa
2. Carregar SÓ os arquivos relevantes (abrir abas, @-mention)
3. Resumir contexto em 2-3 frases
4. Executar a tarefa
5. PR / commit
6. Fechar sessão (não tentar reusar pra próxima tarefa)
```

É como **mise en place** na cozinha: deixe os ingredientes da próxima receita prontos antes de começar.

---

## Sinais de contexto bem gerido

✅ Você consegue dizer em 2 frases o que essa sessão está tentando fazer
✅ Você sabe quais arquivos estão visíveis
✅ Respostas vêm específicas ao seu projeto, não "típicas"
✅ Não está corrigindo a mesma coisa repetidamente
✅ Sessão tem menos de 1-2h de duração

---

## Sinais de contexto mal gerido

❌ Você tem 30 arquivos abertos "por garantia"
❌ Sessão dura há 6 horas, mudou de tópico 4 vezes
❌ Respostas estão genéricas — falando de "boas práticas" em vez do seu código
❌ Ela sugere usar libs que vocês não usam (React Query, Redux…)
❌ Mistura padrões de módulos diferentes
❌ Você se pegou pensando "como ela esqueceu disso?"

---

## 🎯 Tente agora

Escolha uma tarefa pequena do seu trabalho atual (15-30 min). Execute o ciclo:

1. **Antes:** veja quantas abas estão abertas no seu editor. Anote.
2. **Limpe:** feche tudo menos as 3-4 abas necessárias para esta tarefa.
3. **Comece sessão limpa** (`/clear` no Claude Code, novo chat/composer no Cursor).
4. **Mande um resumo manual** ("vou fazer X, contexto: ..., padrão a seguir: ...").
5. **Execute** a tarefa.
6. **Anote:** as respostas vieram mais específicas que o usual?

Repita o ciclo por 1 semana e compare com seu antes. A maioria dos devs sente diferença notável até o terceiro ciclo.

---

➡️ Próximo: [03 — Claude Code na prática](./03-claude-code-na-pratica.md)
