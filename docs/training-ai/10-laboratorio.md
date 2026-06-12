# 10 — Laboratório: 6 exercícios no repo NHB

Capítulo final. **Tudo prática.** Sem este capítulo, os 9 anteriores são teoria solta.

Use o repo `nhb-project-delivery` como playground. Exercícios escalonam dificuldade. **Junior** começa pelos 3 primeiros. **Sênior** mira nos 3 últimos. **Pleno** faz todos.

> 💡 **Modo recomendado:** workshop com o time junto, 3-4h, pareando. Cada dev mostra o pedido que mandou e o resultado. Discussão coletiva. Vale mais que estudar sozinho.

---

## Pré-requisitos

- [ ] Capítulos 00-09 lidos (não precisa decorado)
- [ ] Repo rodando com `pnpm dev` ou `pnpm bootstrap`
- [ ] Claude Code **ou** Cursor instalado e funcionando
- [ ] Familiaridade com o módulo `project-tracking` (cap 04 do `docs/training/`)

---

## Exercício 1 (junior) — Explore um módulo

**Tempo estimado:** 20 minutos

**Padrão:** Explore (cap 05)

### Tarefa

Sem abrir os arquivos manualmente, use IA para responder:

1. Quantos use cases existem no módulo `project-tracking`?
2. Qual deles é responsável por marcar um import como `SUPERSEDED`?
3. Em qual transação Prisma isso acontece?
4. O que acontece se o método falhar no meio da transação?

### Como fazer

Em Claude Code:

```
Use um agente Explore para responder às 4 perguntas:
1. Quantos use cases em apps/api/src/modules/project-tracking/application/use-cases/?
2. Qual marca import como SUPERSEDED?
3. Em que transação Prisma?
4. Comportamento em caso de falha no meio?

Cite arquivos e linhas. Máx 250 palavras. Não modifique nada.
```

Em Cursor (Chat):

```
@folder:apps/api/src/modules/project-tracking/application/use-cases/
@folder:apps/api/src/modules/project-tracking/infrastructure/

[mesmas 4 perguntas]
```

### Critério de pronto

- [ ] Você sabe abrir os arquivos certos sem ajuda agora
- [ ] Resposta cabe em 250 palavras (não 1000)
- [ ] Você confirmou abrindo o arquivo de fato — não confiou cegamente

### Reflexão

Quanto tempo levaria pra fazer isso "manualmente"? Vale o ganho?

---

## Exercício 2 (junior) — Escreva um spec

**Tempo estimado:** 30 minutos

**Padrão:** Test (cap 05)

### Tarefa

Escreva specs unitários para o arquivo `apps/api/src/modules/project-tracking/infrastructure/parsers/status-mapper.ts` (se ainda não tem) ou para outra peça pura sem teste.

### Como fazer

```
CONTEXTO
Arquivo: apps/api/src/modules/project-tracking/infrastructure/parsers/status-mapper.ts
Padrão: igual a outros .spec.ts no mesmo diretório (ex.: header-normalizer.spec.ts).

OBJETIVO
Crie status-mapper.spec.ts cobrindo:
- "Em Andamento" → ACTIVE
- "Concluído" → COMPLETED
- "Cancelado" → CANCELLED
- "Em Espera" → ON_HOLD
- "Não Iniciado" → NOT_STARTED
- string vazia / null → erro ou default (verifique o comportamento atual)
- case-insensitive (se aplicável)

RESTRIÇÕES
- Use Jest (já no projeto)
- Sem mocks (função é pura)
- Estilo: arrow functions, describe/it

PRONTO QUANDO
pnpm --filter @nhb-status-report/api test passa
```

### Critério de pronto

- [ ] Tests passam
- [ ] Cada test cobre cenário **distinto** (sem redundância)
- [ ] Você quebrou um teste de propósito e ele falhou (não-tautológico)

---

## Exercício 3 (junior) — Resolva um bug intencional

**Tempo estimado:** 40 minutos

**Padrão:** Debug (cap 05)

### Setup

Introduza um bug intencional **antes** de chamar IA. Sugestões:

- No `parse-and-preview-import.use-case.ts`, inverta a ordem de duas chamadas
- No `prisma-project-import.repository.ts`, mude `'ACTIVE'` para `'SUPERSEDED'` num `where`
- No `dashboard-page.tsx`, comente uma linha de filtro

### Tarefa

Subir o app, reproduzir o bug, usar IA para diagnosticar.

### Como fazer

```
ETAPA 1 — DIAGNÓSTICO
Acabei de fazer mudanças e [comportamento esperado] virou [comportamento atual].

Erro/comportamento observado:
[stack trace ou descrição]

Arquivos que toquei recentemente:
[lista]

Diagnostique. Liste 2-3 hipóteses ordenadas por probabilidade.
NÃO corrija. Quero confirmar.

ETAPA 2 — CORREÇÃO
[Depois de você confirmar a hipótese certa]
Corrija. Mínima. Sem efeitos colaterais.
```

### Critério de pronto

- [ ] Hipótese principal da IA está correta (ou você refinou rapidamente)
- [ ] Correção foi cirúrgica
- [ ] Você não disse "ah, é isso" e aceitou — confirmou no código

### Reflexão

Quanto tempo levaria pra debugar "no escuro"?

---

## Exercício 4 (pleno) — Adicione um campo end-to-end

**Tempo estimado:** 1.5h

**Padrão:** Generate combinado (cap 05) + fluxo do cap 06

### Tarefa

Adicione um campo opcional `pmEmail: string?` ao `ProjectSnapshot` que atravessa **todas as camadas**:

1. Schema Prisma + migration
2. Parser (row-mapper.ts lê coluna nova opcional "PM Email")
3. Contrato em `packages/shared`
4. Repository do dashboard popula o campo
5. Frontend: tabela / drawer mostra o `mailto:` quando preenchido

### Como fazer

Use **plan mode** primeiro:

```
Quero adicionar campo opcional pmEmail ao ProjectSnapshot, fluxo
completo. Entre em plan mode. Leia os arquivos relevantes (você
identifica). Proponha plano em 6-10 passos com checkpoints.
NÃO codifique ainda.
```

Aprove o plano com revisão crítica. Saia do plan mode. Implemente passo a passo, validando cada um.

### Critério de pronto

- [ ] `pnpm --filter @nhb-status-report/api test` passa
- [ ] Migration gerada e SQL revisado por você
- [ ] App roda e drawer mostra o `mailto:` (ou "—" quando ausente)
- [ ] `pnpm lint` sem novos warnings
- [ ] Você consegue explicar **cada mudança** do PR sem reabrir IA

### Reflexão crítica

Compare seu tempo com tempo "manual" estimado. Mas também avalie qualidade: você teria pego os mesmos detalhes?

---

## Exercício 5 (pleno) — Refator não-trivial

**Tempo estimado:** 1h

**Padrão:** Refactor (cap 05)

### Tarefa

Em `apps/web/src/features/project-tracking/pages/dashboard-page.tsx` (ou equivalente), identifique uma área com lógica embutida que mereceria ser extraída.

Use Cursor Composer (ou Claude Code) para extrair em hook custom.

### Como fazer

```
CONTEXTO
apps/web/src/features/project-tracking/pages/dashboard-page.tsx

A página tem lógica de [X] embutida nas linhas Y-Z. Quero
extrair para hook em apps/web/src/features/project-tracking/
hooks/use-[nome].ts.

OBJETIVO
- Criar o hook
- Página consume hook
- Comportamento idêntico

RESTRIÇÕES
- Sem React Query (padrão do projeto)
- Sem mudança visual
- Sem efeito colateral em outros componentes que importam dashboard-page

PRONTO QUANDO
- Diff revela só a extração
- pnpm dev:web roda sem erro
- Dashboard se comporta visualmente igual ao antes
```

### Critério de pronto

- [ ] Diff é **só** transformação (sem mudanças semânticas)
- [ ] App funciona idêntico
- [ ] Você rodou `/code-review medium` e não tem achado crítico

### Reflexão

A IA tentou refatorar **mais** do que você pediu? Você pegou? Como?

---

## Exercício 6 (sênior) — Code review profundo

**Tempo estimado:** 45 min - 1h

**Padrão:** Subagentes paralelos + verification (cap 07, 08)

### Tarefa

Pegue um PR aberto do repo (real ou simulado abrindo o que você fez no exercício 4 ou 5). Faça **um review multi-dimensional** usando IA.

### Como fazer

#### Opção A — `/code-review ultra`

```
/code-review ultra
```

Espere o resultado. Sintetize as findings em 3-5 itens prioritários.

#### Opção B — Subagentes manuais

```
Lance 4 subagentes em paralelo, cada um focando uma dimensão
do diff atual:
1. Correção (lógica, edge cases, bugs sutis)
2. Padrões (CLAUDE.md, anti-padrões do cap 09 deste material)
3. Performance (queries N+1, re-renders, payload)
4. Segurança (auth/permissão, validação de input, SQL injection)

Cada um reporta 3 achados, em até 200 palavras.
```

#### Em seguida: adversarial verify

Para cada achado:

```
Você acabou de afirmar [X]. Agora seja cético. Tente refutar:
[X] está realmente errado, ou pode ser intencional / aceitável?
Default to "is not a real issue" se em dúvida.
```

### Critério de pronto

- [ ] Você tem 3-5 achados acionáveis
- [ ] Cada um sobreviveu ao adversarial check (não foi falsa positiva)
- [ ] Você decidiu (com critério) o que vai aceitar / rejeitar
- [ ] Comparou: tempo de review com IA vs tempo de review na mão

### Reflexão sênior

- A IA encontrou algo que você **não** teria encontrado?
- A IA **errou** algo que você teria pegado?
- Em que situações você confiaria mais? Menos?

---

## Sessão em equipe — protocolo sugerido

Para o workshop em grupo:

### Antes (assíncrono, 30 min cada)

- Cada dev faz exercícios 1-3 na máquina deles

### Durante (3-4h)

| Tempo | Atividade |
| --- | --- |
| 0:00 | Round-robin: cada um compartilha **um aprendizado** dos ex. 1-3 (5 min cada) |
| 0:30 | Discussão: anti-padrões que vocês identificaram em si mesmos (cap 09) |
| 1:00 | Pareamento em duplas: exercício 4 (1h, alternando driver/navigator) |
| 2:00 | Round-robin do ex. 4: cada dupla mostra o diff (5 min cada) |
| 2:30 | Sólo: exercício 6 (1h) |
| 3:30 | Discussão final: quando a IA brilhou, quando atrapalhou, quais regras o time vai adotar |

### Output esperado do workshop

- Lista de **regras práticas do time** sobre uso de IA (consensual)
- Skills custom desejados
- Atualizações em `CLAUDE.md` / `.cursorrules`
- Cada dev sai com **3 commitments pessoais** baseados em anti-padrões identificados

---

## Critério final de "treinamento concluído"

Você consegue:

- [ ] Escolher entre Tab / Cmd+K / Composer / Plan / Subagente conforme a tarefa
- [ ] Escrever pedido completo (contexto + objetivo + restrição + critério) sem pensar muito
- [ ] Detectar contexto sujo e zerar sessão
- [ ] Revisar diff inteiro antes de aceitar
- [ ] Rodar self-review (`/code-review`) antes de pedir review humano
- [ ] Identificar pelo menos 3 anti-padrões em PRs alheios e dar feedback construtivo
- [ ] Manter habilidade de **debugar e raciocinar sem IA** quando preciso

Se você consegue todas as 7, está pronto pra usar IA no fluxo completo **e** ajudar a treinar outros.

---

## Manutenção do material

Este material **envelhece**. Modelos mudam, ferramentas mudam, padrões mudam.

- **Trimestralmente:** team-lead revisa os capítulos para alinhar com a realidade atual
- **PRs ao tutorial são bem-vindos** — quem encontrou padrão melhor / anti-padrão novo, abre PR
- **Discussões nos retros sobre uso de IA** alimentam evolução

---

🎓 **Parabéns. Você terminou o programa.**

Não é o fim — é o começo de praticar com critério. Próximo passo: usar IA de verdade na próxima feature, aplicando o que ficou. E pareando com colegas que ainda estão começando.

---

## Recursos complementares

- **Capítulo 04** do `docs/training/` (tutorial técnico do projeto) — referência prática do módulo `project-tracking`
- **`CLAUDE.md`** da raiz — convenções vivas do projeto
- **`docs/specs/`** — User Stories que servem de exercício real
- **Skills disponíveis no projeto:** rode `/help` no Claude Code pra ver lista
