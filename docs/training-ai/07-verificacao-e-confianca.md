# 07 — Verificação e confiança

> **A diferença entre dev que usa IA bem e dev que cria bug com IA não é o prompt. É a verificação.**

Este capítulo é sobre **não confiar cegamente**. Tudo que vem antes neste material te ajuda a tirar respostas boas. Este capítulo te ajuda a **detectar a resposta plausível-mas-errada** antes que ela vire commit.

---

## A natureza do problema

IA generativa tem dois traços que se combinam mal:

1. **Sempre responde com confiança.** Nunca diz "não sei" espontaneamente.
2. **Otimiza por "parecer útil"**, não por "ser correto". As duas convergem na maioria das vezes — mas não sempre.

Resultado: respostas erradas vêm **com a mesma firmeza** das certas. Você não tem como saber pela embalagem.

---

## Categorias de "erro com cara de certo"

### 1. Alucinação de API

"Use o método `Prisma.useTransactionScope`" — não existe. Foi inventado. Confiante.

### 2. Padrão errado do projeto

Sugere usar React Query, Redux, ou outra lib que **vocês não usam**. Porque é o padrão global. Não é o seu.

### 3. Mistura de versões

Sintaxe de Prisma 4 num projeto Prisma 6 — funcionou em tutoriais antigos no training dela.

### 4. Verdade superficial, mentira no detalhe

"O `findActiveByYear` retorna `ProjectImportRecord | null`" — verdade. "E inclui os snapshots automaticamente" — mentira (precisa de `include: { snapshots: true }`).

### 5. "Done" sem ter feito

Em agentes, IA pode marcar tarefa como completa **antes** de rodar o teste. Você precisa cobrar evidência.

### 6. Mudança fora do escopo

Você pediu pra renomear uma variável. Ela renomeou **e** "limpou" o vizinho. Quebrou uma coisa que ela acha que tava ruim mas era intencional.

### 7. Falsa atribuição

"Esse comportamento vem do arquivo X linha Y" — Y na verdade está a 30 linhas de distância. Ou é noutro arquivo. Você foi pra Y, não tinha nada lá, ficou confuso.

---

## Princípios da verificação

### Princípio 1 — "Não aceito o que não consigo explicar"

Antes de aceitar diff: você consegue **explicar oralmente** por que cada mudança está ali? Se não, não aceite ainda. Pergunte, leia, entenda.

### Princípio 2 — "Confio em teste, não em afirmação"

"Fiz a função, testei mentalmente, funciona." → Roda o teste de verdade.
"Todos os tests passam." → Rode você mesmo no terminal.

### Princípio 3 — "Adversário > defensor"

A IA que escreveu o código tem viés de defendê-lo. Lance outra (ou outro agent) com instrução de **criticar**, **refutar**, **encontrar problema**. Adversário pega o que defensor encobre.

### Princípio 4 — "Quanto maior o blast radius, mais cético"

Mudança em DTO compartilhado, schema do banco, contrato público → ceticismo nível 10. Refator local de função privada → nível 3.

### Princípio 5 — "Verificação é parte do trabalho — não é overhead"

Se você acha que "não tem tempo pra verificar", então **você não tem tempo pra usar IA**. Pull o freio.

---

## Técnicas de verificação

### Técnica 1 — Leia o diff você mesmo

Sempre. **Inteiro.** Sem pular "as partes chatas".

Onde isso desliza:

- Quando o diff é grande (> 200 linhas) — você fica tentado a confiar no resumo
- Quando você está cansado
- Quando a IA fala "essa mudança é trivial"

> 💡 **Truque:** abra o diff no GitHub (mesmo PR ainda não criado — em um pre-PR). A perspectiva diferente do editor te ajuda a ver com olhos novos.

### Técnica 2 — Rode os tests

```bash
pnpm --filter @nhb-status-report/api test
pnpm --filter @nhb-status-report/web test    # se houver
pnpm lint
```

Não confie na IA dizer "passei os tests". **Você** rode.

### Técnica 3 — Use `/verify`

```
/verify
```

Sobe o app de verdade e exercita o golden path + edge cases que você descreve. Detecta regressão silenciosa em fluxos que tests unitários não cobrem.

### Técnica 4 — `/code-review` como segunda opinião

```
/code-review medium
```

Roda um review **separado** do trabalho original. Pega:

- Bugs sutis
- Anti-padrões
- Inconsistências com o resto do código
- Vazamentos de segurança óbvios
- Type-safety quebrada

Em PRs críticos: `/code-review high` ou `/code-review ultra`.

### Técnica 5 — Adversarial check

Peça à IA para **derrubar** o próprio trabalho:

```
Você acabou de implementar X. Agora finja que é um revisor cético.
Liste 3-5 jeitos pelos quais essa implementação pode estar errada
ou problemática. Seja agressivo. Default to "is wrong" se em dúvida.
```

Surpreendentemente eficaz. Como o framing mudou, ela ataca em vez de defender.

### Técnica 6 — Diff comentado

Para PRs onde você quer **garantir** atenção:

```
Para cada hunk do diff, escreva uma frase no PR explicando
**por que** ele está ali. Não copie o código — só a intenção.
```

Você acaba revisando 3x: ao escrever, ao ler antes de submit, ao receber review.

### Técnica 7 — Cross-check de fato

Se a IA disse "esse método já existe no repo", você **abre o arquivo** e confirma. Quando ela cita linha:número, **vá lá**. Vai pegar o pé de alucinação cedo.

### Técnica 8 — Rode na máquina

Especialmente em mudanças de frontend / fluxo de UI. Tests passam ≠ feature funciona como usuário espera. Use a feature. Veja o pixel.

---

## "Trust but verify" em agentes

Quando você está usando um agente (Claude Code, Composer), ele relata o que **achou** que fez. Não o que **fez de verdade**.

Frases que devem disparar verificação:

- "Done" / "Concluído" / "Pronto"
- "Tests are passing"
- "I refactored X without changing behavior"
- "This is a minimal change"
- "I followed the pattern of <X>"

Pra cada uma: **confira**.

> 💡 **Truque do "evidence"**: "Mostre evidência. Mostre o comando que você rodou e a saída. Mostre o diff." Em vez de "fez?", peça "prove".

---

## Pegadinhas comuns que pegam até experiente

### Pegadinha 1 — Refator que introduz mudança semântica

Você pediu "refator". IA fez uma "melhoria" de quebra. Tests ainda passam (cobertura tem buraco). Bug em produção semanas depois.

**Defesa:** revise se o `git diff` é só transformação ou se há lógica nova.

### Pegadinha 2 — Função "auxiliar" que duplica algo existente

IA cria `formatDate` no seu módulo, sem ver que tem `formatDate` em `lib/utils`. Drift silencioso.

**Defesa:** `grep` ou pergunta direta "isso já existe em outro lugar?"

### Pegadinha 3 — `console.log` esquecido

IA adicionou logs pra debug, esqueceu de remover.

**Defesa:** lint do projeto deveria pegar. Mas grep no diff por `console.` também.

### Pegadinha 4 — `any` ou type assertion sneaky

`as unknown as SomeType` — bandeira vermelha. Quase sempre escondendo erro real.

**Defesa:** lint + busca por `as ` no diff.

### Pegadinha 5 — Migration que reescreve dados sem flag

Schema mudou, IA criou migration. Mas a migration faz `UPDATE` em milhões de linhas sem você notar.

**Defesa:** revise o SQL gerado em `prisma/migrations/<ts>/migration.sql` antes de comitar.

### Pegadinha 6 — Tests que testam a si próprios

IA gerou mock que faz exatamente o que o código espera. Test passa, mas não verifica nada.

**Defesa:** quebre o código de propósito; o test tem que falhar. Se passar, é tautológico.

### Pegadinha 7 — Secrets ou env vars hardcoded

IA "ajuda" preenchendo um secret ou URL real porque viu uma vez. Não devia.

**Defesa:** revise variáveis. `git diff` por `secret`, `password`, `key`, `token`.

---

## Quando confiar mais (sim, existe)

Nem tudo precisa de paranoia. Você pode confiar mais quando:

- ✅ Mudança é **dentro de função** sem efeitos colaterais
- ✅ Cobertura de teste é alta e os tests pegam regressão
- ✅ É refator mecânico (rename, extract function via LSP)
- ✅ Você acompanhou o trabalho passo a passo
- ✅ O blast radius é mínimo (componente isolado, função pura)

Você ainda **revisa o diff**. Mas pode pular `/code-review` extra.

---

## Quando ser paranoico

- ⚠️ Schema do banco
- ⚠️ Contratos em `packages/shared`
- ⚠️ Migrations (especialmente com `UPDATE` ou `DROP`)
- ⚠️ Mudanças em código de auth / permissão
- ⚠️ Mudanças em código de pagamento (não temos, mas vale o princípio)
- ⚠️ Refator atravessando muitos arquivos
- ⚠️ Mudança em config de prod
- ⚠️ Qualquer coisa em master/main direto

---

## A defesa em profundidade

Como ninguém pega tudo, empilhe camadas:

```
1. Lint                     pega: console.log, any, default exports
2. TypeScript               pega: tipos, contratos
3. Tests unitários          pega: lógica em peças puras
4. /code-review             pega: bugs sutis, anti-padrões
5. /verify                  pega: regressão de feature
6. Self-review do diff      pega: intenção desalinhada
7. Review humano            pega: contexto que IA não vê
8. CI                       pega: tudo acima automaticamente
9. Verificação em staging   pega: integração real
```

Quanto mais camadas, mais robusto. Não pule **nenhuma das primeiras 5** quando estiver com IA.

---

## Anti-padrão final: "Accept All"

Em Cursor: o botão "Accept All" do Composer. Em Claude Code: aprovar batches de Edits sem ler.

Este é **o** anti-padrão. Vale repetir: **se você não leu, não aceitou — só achou que aceitou.**

---

## 🎯 Tente agora

Pegue o último PR que **você abriu com auxílio de IA**.

1. Releia o diff inteiro **agora**, devagar, com olhos críticos.
2. Para cada mudança, marque mentalmente: **eu sabia que essa estava ali?**
3. Conte: quantas você "não tinha visto"?
4. Para cada uma "não vista", classifique: inofensiva / ok mas escopo errado / potencial bug / definitivamente bug.
5. Reflita: **como você poderia ter pegado isso antes de submeter?**

Esse exercício, se feito honestamente, é mais valioso que 5 capítulos de teoria.

---

➡️ Próximo: [08 — Técnicas avançadas](./08-tecnicas-avancadas.md)
