# 06 — Do spec ao PR: fluxo integrado

Aqui você vê IA aplicada **no ciclo completo** — da leitura do spec até o merge. Cada estação tem uma técnica certa. Algumas estações são humanas (decisões), outras são alavancáveis por IA (mecânica).

Usaremos como exemplo uma feature hipotética: **adicionar coluna "BU" (Business Unit) ao dashboard**.

---

## O fluxo todo

```
1. SPEC          ler / interpretar
2. PLAN          desenhar abordagem
3. SETUP         branch + ambiente
4. IMPLEMENT     codar (cap 05 — padrões)
5. TEST          unitário + manual
6. SELF-REVIEW   /code-review antes de pedir review humano
7. COMMIT + PR   mensagem + descrição
8. REVIEW HUMANO endereçar feedback
9. MERGE         deletar branch
```

Para cada estação: **a quem pertence (humano vs IA), o que fazer, qual o sinal de "feito"**.

---

## Estação 1 — SPEC

> **Quem manda: humano.** Decisões de produto não são IA.

### O que fazer

- Leia a US/spec / ticket completo
- Anote: quem pede, por quê, regras de negócio (BR-XX), critérios de aceitação
- **Marque ambiguidades** — perguntas que **só humano** pode responder

### Onde IA ajuda

✅ **Sintetizar spec longo:**

```
@docs/specs/US-08-project-tracking-import.md

Resuma em 1 parágrafo + lista de 5 regras-chave. Não tire conclusões,
não sugira implementação ainda — só estrutura o que está escrito.
```

✅ **Encontrar ambiguidades:**

```
Mesmo arquivo acima. Liste pontos onde o spec é ambíguo,
contraditório, ou silente sobre cenários óbvios. Não invente
respostas — só liste perguntas.
```

✅ **Cross-referência:** "Esse spec referencia US-02. Resuma o que de US-02 importa pro 08."

### Onde IA NÃO ajuda

❌ Decidir se a feature vale a pena
❌ Negociar com produto
❌ Estimar esforço sem dado

### Sinal de "feito"

Você consegue **explicar oralmente** a feature em 2 minutos sem olhar o spec. Tem lista clara das ambiguidades a resolver com produto.

---

## Estação 2 — PLAN

> **Quem manda: humano, com IA como rascunhador.**

### O que fazer

- Decida abordagem (arquitetura, ordem de implementação)
- Identifique riscos (migração de dados? mudança de contrato shared?)
- Quebre em passos verificáveis

### Receita IA

**Ferramenta:** Claude Code (Plan mode).

```
Quero adicionar coluna "BU" (Business Unit, string opcional) ao
dashboard. Fonte é uma nova coluna "BU" na planilha StatusReportBI.

Estudei a spec. Antes de codar, entre em plan mode. Leia:
- apps/api/src/modules/project-tracking/infrastructure/parsers/row-mapper.ts
- packages/shared/src/types/project-tracking-contracts.ts
- apps/web/src/features/project-tracking/components/project-table.tsx

Proponha:
- Mudanças no schema Prisma + migration
- Onde adicionar ao parser
- Tipo no shared
- Mudança no repositório do dashboard
- UI: coluna nova na tabela

Em **ordem de implementação** com check-points entre passos.
```

Você revisa o plano. Discute. Aprova **só quando faz sentido**. Aí sai do plan mode.

### Sinal de "feito"

Plano com **5-10 passos** verificáveis. Cada um termina com algo testável (test passa, swagger mostra X, UI mostra Y).

---

## Estação 3 — SETUP

> **Quem manda: humano.** IA não substitui git literacy.

### Comandos mecânicos

```bash
git fetch origin
git switch main && git pull --rebase
git switch -c feature/project-tracking-bu-column

pnpm install
pnpm --filter @nhb-status-report/api prisma:migrate    # se houve migrations na main
pnpm --filter @nhb-status-report/shared build
```

> Não delegue isso à IA. É 30 segundos. Você precisa lembrar do hábito.

### Onde IA ajuda

✅ Nome de branch: "Sugira nomes de branch para essa feature seguindo o padrão `feature/...`"

---

## Estação 4 — IMPLEMENT

> **Quem manda: humano dirigindo IA.**

Use os padrões do **cap 05**, na ordem do plano:

1. Schema Prisma → Generate (com migração)
2. Shared contract → Generate (campo opcional)
3. Backend repository → Generate (mapeamento)
4. Parser → Generate (ler coluna opcional)
5. Frontend table → Generate (mostrar coluna)

Entre passos, **rode test / lint** pra garantir que continua verde.

### Padrão de check-in

A cada 2-3 passos:

```
Status check: já fizemos passos 1-3 do plano. Antes de seguir,
confirme que `pnpm --filter @nhb-status-report/api test` passa
e mostre o que você fez nesta sessão.
```

### Cuidados

- **Não maratona** — fazer 8 passos seguidos sem revisar = bug invisível enterrado
- **Não mude de feature no meio** — abra nova sessão pra outra coisa
- **Revise cada diff** — especialmente Composer (Cursor) ou Edits do Claude Code

### Sinal de "feito"

Todos os passos do plano executados. Branch tem N commits coesos. Tests verdes.

---

## Estação 5 — TEST

### Unitários

```
Para cada arquivo novo / modificado significativamente, gere
specs unitários seguindo o padrão de status-mapper.spec.ts.
Cenários:
- [listar manualmente]

Pronto quando pnpm --filter @nhb-status-report/api test passa.
```

### Verificação manual (skill `/verify`)

```
/verify

(Sobe app, segue um plano de teste, reporta findings)
```

Ou manualmente:

- Logue como admin, exercite o caminho feliz
- Logue como usuário comum, confirme defesa de permissão
- Casos de borda óbvios

### Sinal de "feito"

- Tests verdes
- App rodando, feature visível, comportamento conforme spec

---

## Estação 6 — SELF-REVIEW

> Aqui é onde o time **mais ganha**.

### Por que self-review com IA é valioso

Quando **você** revisa seu PR, tem viés (acabou de escrever, defende). Quando **outra Claude** revisa, é par sem investimento emocional — pega coisas que escapam.

### Receita

```
/code-review medium

(roda code-review no diff atual, reporta achados sem aplicar)
```

Ou versões maiores:

- `/code-review high` — mais cobertura
- `/code-review ultra` — review profundo multi-agente (caro, vale em PRs grandes)

### O que fazer com os achados

- **Concorda?** Corrige.
- **Discorda?** Anote por quê — esses comentários podem virar discussão de review humano.
- **Falso positivo?** Sinal de que tem regra/contexto faltando no CLAUDE.md.

### Sinal de "feito"

Você endereçou (ou tem resposta para) **cada achado** de severidade média ou alta.

---

## Estação 7 — COMMIT + PR

### Commit

```
/commit

(Gera mensagem conventional, baseada no diff atual)
```

> Sempre **revise** a mensagem. Às vezes ela esquece o "porquê" — adicione manualmente.

### PR

```
/commit-push-pr

(Cria branch remota se preciso, abre PR com título + descrição)
```

A descrição que ele gera segue:

```markdown
## Summary
- ...

## Why
- ...

## Test plan
- [ ] ...
```

> ⚠️ **Revise antes de submeter.** A descrição é o que humano vai ler — vale 30 segundos de polimento.

---

## Estação 8 — REVIEW HUMANO

> **Quem manda: humano.**

### Antes de pedir review

- [ ] CI verde
- [ ] Self-review (`/code-review`) sem pendência
- [ ] Você abriu o PR no GitHub e leu o diff lá (não só no editor)
- [ ] Mencionou foco no comentário ("foca a transação no confirm")

### Durante o review

Quando o revisor comenta:

- Não delegue à IA cegamente. Você precisa **entender** o feedback.
- Para correção mecânica simples: peça à IA aplicar
- Para discussão de arquitetura: responda você, com sua opinião

### Anti-padrão

❌ "Aceitar todas as sugestões do revisor via IA sem ler" — você está reaprendendo a programar errado.

---

## Estação 9 — MERGE

```bash
# Após merge:
git switch main
git pull --rebase
git branch -d feature/project-tracking-bu-column

# Periódico:
/clean_gone   # apaga branches locais cujo remoto sumiu
```

---

## A planilha mental por estação

| Estação | Humano | IA |
| --- | --- | --- |
| Spec | Decide o que importa | Sintetiza, levanta ambiguidades |
| Plan | Aprova abordagem | Rascunha plano |
| Setup | Branch + migrate | (nada) |
| Implement | Dirige, revisa cada diff | Codar, seguindo padrões |
| Test | Define cenários | Escreve specs, roda |
| Self-review | Decide o que fazer com achados | `/code-review` |
| Commit + PR | Revisa mensagem | `/commit` ou `/commit-push-pr` |
| Review humano | Discute, decide | Aplica correções mecânicas |
| Merge | Squash & delete | (nada) |

---

## Onde dev sem IA gasta tempo (e onde dev com IA libera tempo)

| Atividade | Tempo dev sem IA | Tempo dev com IA |
| --- | --- | --- |
| Ler spec longo e resumir | 30 min | 5 min + 5 min de revisão |
| Mapear área desconhecida do código | 1-2h | 10 min com Explore |
| Escrever boilerplate seguindo template | 30-60 min | 5-15 min de codar + revisar |
| Refator mecânico | 15-45 min | 5-15 min |
| Escrever bateria de testes | 1-2h | 20-40 min |
| Self-review | 15-30 min (e ainda perde coisas) | 5 min com `/code-review` |
| Escrever mensagem de commit + PR | 5-15 min | 1-2 min + polimento |

**O tempo que sobra vai pra:** discussão arquitetural, melhoria do produto, mentoring, focar em casos complicados.

> ⚠️ **Não vá "do dev sem IA" pra "dev maquinal". O ganho de tempo só compensa se você usa para tarefas mais difíceis — não pra fechar mais tickets de baixo valor.**

---

## Sinais de fluxo saudável com IA

✅ PRs continuam pequenos e focados (não inchados porque "é fácil agora")
✅ Você ainda escreve descrições e revisa CRs com seu próprio cérebro
✅ Você consegue explicar **toda mudança** do seu PR sem consultar IA
✅ Bugs que escapam são raros e quando escapam **você** identifica a causa
✅ Time discute mais decisões de produto e menos sintaxe

## Sinais de fluxo doente

❌ Você abriu um PR sem ter lido o diff inteiro
❌ Quando perguntam "por que X?", você precisa relogar e perguntar à IA
❌ Tickets fechados aumentaram mas qualidade caiu
❌ Time não discute mais arquitetura — só "como prompt vai"
❌ Mesma decisão fica oscilando entre PRs (sinal de contexto não persistido)

---

## 🎯 Tente agora

Pegue um ticket pequeno (1-3 horas de trabalho). Execute **todas as estações** documentando:

1. Que comando / pedido você usou em cada estação
2. Quanto tempo levou
3. Em que estação a IA mais ajudou
4. Em que estação ela **atrapalhou** (sim, vai acontecer)

Traga ao próximo standup. Esse exercício, multiplicado por todos do time, é o ouro real.

---

➡️ Próximo: [07 — Verificação e confiança](./07-verificacao-e-confianca.md)
