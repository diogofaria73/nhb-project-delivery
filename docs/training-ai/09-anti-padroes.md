# 09 — Anti-padrões

Capítulo curto, denso. Cada anti-padrão tem: **o que é**, **sintoma**, **por que dá errado**, **como corrigir**.

Coloque este capítulo no radar do time. **A maioria dos desastres com IA cai num desses.**

---

## A — Muleta cognitiva

### O que é

Usar IA pra tudo, **sem nunca pensar primeiro**. Pedido vira reflexo, leitura vira opcional, aprendizado para.

### Sintomas

- "Não consigo trabalhar sem IA aberta"
- Você não consegue explicar o código do seu PR sem reabri-lo via IA
- Habilidades fundamentais (debug, ler stack trace, raciocinar) atrofiam
- Dia em que IA cai, você fica paralisado

### Por que dá errado

- Você perde fluência. Vira **operador de IA**, não engenheiro.
- Junior nunca vira sênior — pula etapas onde aprendizado acontece.
- Senior estagna na ferramenta de hoje — não evolui modelo mental.

### Como corrigir

- **Pense primeiro, IA depois.** Antes de abrir Composer, descreva mentalmente o que vai fazer.
- **Faça pelo menos 30% das tarefas pequenas na mão.** Mantém fluência.
- **Quando IA sugere algo novo, leia até entender o porquê.** Não copie sem entender.
- **Revise mensalmente:** "habilidades que perdi nas últimas 4 semanas?"

---

## B — Prompt genérico

### O que é

"Faz isso", "melhora aqui", "dá uma olhada". Sem contexto, objetivo, restrição, critério.

### Sintomas

- Respostas vêm "típicas" — falando de boas práticas, não do seu código
- Você corrige 3-4 vezes pra chegar onde queria
- Frustração: "ela não entendeu"

### Por que dá errado

- Capítulo 01 inteiro.

### Como corrigir

- **Template:** contexto + objetivo + restrição + critério
- **Se o pedido cabe em 1 linha**, está provavelmente vago
- Quando tiver dúvida, gaste **30 segundos a mais** detalhando

---

## C — Contexto sujo

### O que é

Sessão longa, vários tópicos, arquivos irrelevantes em contexto, discussões antigas misturadas.

### Sintomas

- Cap 02 lista todos. Resumindo:
  - Respostas misturam padrões de coisas diferentes
  - "Ela esqueceu o que eu disse há pouco"
  - Sugere libs/abordagens descartadas

### Por que dá errado

- IA não consegue separar joio do trigo. Confiabilidade despenca.
- Custo e latência sobem.

### Como corrigir

- **Sessão por tarefa.** `/clear` ou novo Composer.
- **Abas limpas** antes de invocar Composer.
- **Resumo manual** ao começar.

---

## D — Accept All cego

### O que é

Aceitar todas as sugestões / diffs sem revisar.

### Sintomas

- Você não consegue listar as mudanças do seu próprio PR
- Bugs aparecem em código que você "não lembra ter escrito"
- Mudanças fora do escopo aparecem em diff

### Por que dá errado

- Cap 07 inteiro. Resumindo: IA tem viés de "parecer útil"; aceitar tudo é renunciar à última camada de defesa.

### Como corrigir

- **Sempre revise diff arquivo a arquivo.** Inteiro.
- Em PR pequeno (< 100 linhas): leia 100%
- Em PR médio (100-500): leia hunks, abra arquivos de mudança maior inteiros
- Em PR grande (> 500): considere quebrar o PR. Se não, force-se a fazer 100% mesmo lento.
- **Disabilite atalhos** que aceitam silenciosamente, se possível

---

## E — Maratona de sessão

### O que é

Trabalhar 6-8h na mesma sessão / mesmo chat / mesmo Composer.

### Sintomas

- Você troca de feature na mesma sessão "pra reaproveitar contexto"
- Respostas começam a se contradizer
- Lentidão notável

### Por que dá errado

- Contexto fica gigante e sujo
- Compactações sucessivas perdem detalhes
- Erros se acumulam

### Como corrigir

- **Limite sessão a 1-2h** ou a uma tarefa específica
- **`/clear` entre tarefas**
- Mesmo dentro de tarefa longa, se sentir "perdendo o fio", reinicie com resumo manual

---

## F — IA pra decisão de produto

### O que é

Perguntar à IA o que construir, qual feature priorizar, se vale fazer X.

### Sintomas

- "Vamos perguntar pra Claude se essa feature faz sentido"
- Spec ficou definido por IA, sem stakeholder real
- Decisões oscilam de PR a PR

### Por que dá errado

- IA não conhece seu usuário, mercado, estratégia, política do time
- Opina genericamente — você acha que está informado, está sendo guiado por viés de training

### Como corrigir

- **Decisões de produto: humano, com humano**
- IA pode **listar trade-offs**, **resumir opções**, **rascunhar spec** — mas a escolha é sua
- "O que devo construir?" é pergunta errada pra IA. "Quais os 3 trade-offs entre A e B?" é certa.

---

## G — Confiar em afirmação sem verificação

### O que é

IA diz "fiz, está rodando, tests passam" e você acredita sem checar.

### Sintomas

- PR mergeado quebra em produção
- "Mas a IA disse que estava ok"
- Tests fictícios que sempre passam

### Como corrigir

- Cap 07 inteiro. **Verifique. Sempre.**
- **Peça evidência**: "mostre o comando que rodou e a saída"
- **Rode você mesmo** os tests críticos

---

## H — Skills/CLAUDE.md desatualizados

### O que é

Arquivos de instrução do projeto refletem realidade antiga. IA segue regras obsoletas.

### Sintomas

- IA insiste em padrão que o time mudou meses atrás
- CLAUDE.md menciona módulo `companies` que foi removido
- `.cursorrules` proíbe lib que agora vocês usam

### Como corrigir

- **Revisão trimestral** dos arquivos de instrução
- **Ao remover/alterar convenção**, edite CLAUDE.md no mesmo PR
- **Skill `/claude-md-improver`** (se disponível) ajuda a auditar

---

## I — Memória semântica que envelhece

### O que é

Auto-memory acumula fatos que viraram falsos.

### Sintomas

- IA "sabe" que X funciona de tal jeito, mas X mudou
- Recomenda código baseado em arquivo que foi renomeado

### Como corrigir

- **Confira memórias periodicamente** (`~/.claude/projects/<projeto>/memory/`)
- Remova/atualize as obsoletas
- Quando IA recomenda algo "baseado em memória", **verifique no código atual**

---

## J — Migration sem revisar SQL

### O que é

`prisma:migrate` gerou SQL. Você só viu o erro / sucesso, não o SQL.

### Sintomas

- Coluna dropada com dados ainda úteis
- `UPDATE` em massa que travou produção
- Index criado em momento errado

### Como corrigir

- **Sempre abra `prisma/migrations/<ts>/migration.sql` e leia antes de comitar**
- Em produção: revise o SQL **com colega** se for não-trivial
- Operações destrutivas (DROP, UPDATE em massa): exija justificativa explícita

---

## K — Tests tautológicos

### O que é

IA gerou test cujo mock faz exatamente o que código retorna. Test passa, não verifica nada.

### Sintomas

- Cobertura alta, bugs continuam passando
- Test não falha quando você quebra o código

### Como corrigir

- **Quebre o código de propósito** ao receber tests. Se o test não falha, é tautológico.
- **Tests reais** verificam **comportamento** (input X → output Y), não chamadas internas

---

## L — Push direto na main

### O que é

Skip do fluxo de PR porque "IA já revisou".

### Sintomas

- Commits direto em `main`
- "Era só uma mudança simples"
- Não tem registro do "por quê"

### Por que dá errado

- Pular review humano em produção = falha óbvia
- Bypassa CI / regras do repo
- Histórico do `main` polui

### Como corrigir

- **Sempre PR.** Mesmo que pequeno.
- **Sempre revisor humano.**
- Se PR é trivial, mereça-o trivial — mas exista.

---

## M — Pedir IA pra escrever spec sem stakeholder

### O que é

"IA, escreve a US-15 sobre feature X". Stakeholder nem viu.

### Sintomas

- Specs cheios de assumptions
- Critérios de aceitação inventados
- Stakeholder diz "não era isso" depois do código pronto

### Como corrigir

- IA **rascunha** spec — vocês alinham com stakeholder antes de codar
- Stakeholder revisa, aprova, **valida**
- IA não é stakeholder

---

## N — Comparar produtividade superficialmente

### O que é

"Joana faz 3x mais PRs que antes". Métrica de PRs/semana vira meta.

### Sintomas

- Time fecha mais tickets, qualidade cai
- PRs ficam menores e mais frequentes mesmo quando deveriam ser maiores e coesos
- Métrica vira o objetivo, não o sintoma

### Como corrigir

- **PRs/semana é métrica suja** — depende de tamanho, complexidade
- Métricas melhores: tempo de review, bugs reabertos, NPS do produto
- **Cuidado com cargo cult.** Ganho real de IA é qualitativo, difícil de medir.

---

## O — Falta de pareamento com humano

### O que é

Dev solitário com IA o dia inteiro. Sem interação com time.

### Sintomas

- Decisões esquisitas que ninguém validou
- Padrões divergentes entre devs
- Conhecimento do projeto **fragmentado** — cada um sabe um pedaço

### Como corrigir

- IA não substitui pareamento entre humanos
- **Daily / standup** com discussão real
- **Code review humano** é obrigatório, não opcional
- **Sessões de pair programming** entre devs (com IA como ferramenta, não como par)

---

## Resumo: os 5 que mais matam projeto

Se sua equipe tem **um** deles, atenção urgente:

1. **D — Accept All cego** (encherá produção de bug)
2. **G — Confiar em afirmação sem verificação** (idem)
3. **C — Contexto sujo crônico** (drena qualidade silenciosamente)
4. **F — IA pra decisão de produto** (estraga produto inteiro)
5. **A — Muleta cognitiva** (estraga time inteiro a longo prazo)

---

## 🎯 Tente agora

Faça uma **auto-avaliação honesta**:

1. Para cada anti-padrão deste capítulo, marque: nunca / às vezes / frequente
2. Os 3 que você marcou "frequente" são suas prioridades
3. Para cada um, defina **uma regra prática** para os próximos 14 dias

Exemplo:
- Marquei "Accept All" como frequente
- Regra 14 dias: "antes de aceitar diff, fechar terminal e contar até 5; se não consigo ler antes do 5, não aceito"

Compartilhe sua auto-avaliação com seu lead. Vergonha vale tempo perdido.

---

➡️ Próximo: [10 — Laboratório](./10-laboratorio.md)
