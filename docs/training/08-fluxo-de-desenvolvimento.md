# 08 — Fluxo de desenvolvimento

Capítulo prático: como uma tarefa **sai do spec** e **vira PR mergeado**. Sem disciplina aqui, o time perde tempo em retrabalho.

---

## O ciclo completo

```
1. Spec       →  docs/specs/US-XX.md
2. Branch     →  feature/<área>-<curta-descrição>
3. Setup      →  rebase main, sync deps, migrate
4. Implementa →  seguindo cap 02-07
5. Testa      →  unitários + verificação manual
6. Commits    →  conventional, escopo pequeno
7. PR         →  título curto, descrição com "por quê"
8. Review     →  /code-review + revisor humano
9. Merge      →  squash, deleta branch
```

---

## 1. Comece pelo spec

Antes de tocar em código, **leia o spec inteiro** em `docs/specs/US-XX.md` (ou a issue/ticket). Anote:

- **Quem** pede (PMO? Diretor? Usuário comum?)
- **Por quê** (qual dor resolve, qual decisão habilita)
- **Regras de negócio** (BR-XX) — copie as relevantes pra um bloco de notas
- **Acceptance criteria** — esses viram a sua checklist de "pronto"
- **Edge cases mencionados** — caminho infeliz é tão importante quanto o feliz

> 🔍 Se o spec é vago em algo crítico, **pare e pergunte**. Sair codando para "depois acertar" custa 10× mais.

---

## 2. Crie a branch

Padrão de nome:

```
<tipo>/<área>-<curta-descrição-kebab>
```

Tipos comuns:

- `feature/` — funcionalidade nova
- `fix/` — bug
- `chore/` — manutenção (deps, configs)
- `refactor/` — sem mudança de comportamento
- `docs/` — só documentação

Exemplos bons:

```
feature/project-tracking-bu-column
fix/auth-login-lockout-counter
chore/upgrade-prisma-6.6
refactor/dashboard-extract-kpi-hook
```

Sempre da `main`:

```bash
git fetch origin
git switch main
git pull --rebase
git switch -c feature/project-tracking-bu-column
```

---

## 3. Sincronize ambiente

Antes de codar:

```bash
pnpm install               # deps podem ter mudado
pnpm --filter @nhb-status-report/api prisma:migrate   # migrations novas no main
pnpm --filter @nhb-status-report/shared build         # caso shared tenha mudado
```

Sintoma comum quando você esquece: tipos não batem, intellisense quebra, ou backend explode ao subir.

---

## 4. Implemente

Os capítulos 02–07 já te disseram **onde** o código vai. Resumo prático em ordem:

| Camada / Pasta | Quando editar |
| --- | --- |
| `packages/shared` | Quando muda contrato API |
| `prisma/schema.prisma` + migration | Quando muda estrutura do banco |
| `apps/api/src/modules/<domain>/domain/` | Quando muda regra pura de negócio |
| `apps/api/src/modules/<domain>/application/` | Quando muda um caso de uso ou DTO |
| `apps/api/src/modules/<domain>/infrastructure/` | Quando muda persistência / parser / storage |
| `apps/api/src/modules/<domain>/presentation/` | Quando muda HTTP (rota, header, status) |
| `apps/web/src/services/<feature>.service.ts` | Quando muda chamada HTTP |
| `apps/web/src/features/<feature>/hooks/` | Quando muda estado / orquestração |
| `apps/web/src/features/<feature>/components/` | Quando muda UI |
| `apps/web/src/features/<feature>/pages/` | Quando muda layout da página |
| `apps/web/src/app/App.tsx` | Quando adiciona/remove rota |
| `apps/web/src/i18n/locales/{pt-BR,en}.ts` | Quando adiciona string visível |

> 💡 **Faça vertical slice antes de horizontal slice.** Implemente uma feature ponta a ponta (mesmo que feia) e depois polimento. Não passe 3 dias só no backend para descobrir no front que o contrato não serve.

---

## 5. Teste

### Unitários

Mínimo esperado:

- **Domínio** — funções e serviços puros têm spec (ex.: `iso-week.service.spec.ts`)
- **Parsers** — cada peça do parser tem spec (`status-mapper.spec.ts`, `header-normalizer.spec.ts`, …)
- **Use cases** — qualquer regra de negócio nova tem teste com mocks de repositório

Rode:

```bash
pnpm --filter @nhb-status-report/api test
```

Se você está editando o frontend, hoje o foco é teste manual; quando houver tests de UI no projeto, seguir o padrão.

### Verificação manual

**Não pule esta etapa.** Subir o app e usar a feature como o usuário usaria.

Checklist mínimo:

- [ ] Logue como admin. Funciona como esperado?
- [ ] Logue como usuário comum. Está bloqueado nos endpoints/rotas certos?
- [ ] Caminho infeliz: o que acontece se o input está vazio/inválido?
- [ ] Refresh da página: estado se mantém ou perde?
- [ ] Console do browser: zero erros vermelhos?

> Para verificações sistemáticas, existe o skill `verify` que sobe o app e testa o golden path + edge cases.

---

## 6. Commits

### Estilo: Conventional Commits

```
<tipo>(<escopo>): <descrição curta no imperativo>

<corpo opcional explicando POR QUÊ, não o que>
```

Tipos:

- `feat:` — funcionalidade nova
- `fix:` — bug fix
- `refactor:` — refator sem mudar comportamento
- `chore:` — manutenção (deps, configs)
- `docs:` — só documentação
- `test:` — só testes
- `style:` — formatação (raro)

Bons exemplos (do `git log` do projeto):

```
fix(infra): pre-create /app/storage with nhb ownership
chore(infra): expose docker app on 3001 to coexist with pnpm dev
docs: prune specs to match implemented modules
```

### Boas práticas

- **Imperativo**: "add user filter" ✅, não "added" ou "adding"
- **Foco no porquê** no corpo, não no o quê (o diff mostra o o quê)
- **Commits pequenos** > commits grandes. Vários commits no mesmo PR são ok (squash no merge cuida).
- **Não inclua arquivos não relacionados** — esqueça o `.vscode/settings.json` que você mudou para si.

### Antes de comitar

```bash
pnpm lint                      # nada de erros
pnpm --filter @nhb-status-report/api test
git status                     # confirme o que está no stage
git diff --cached              # revise você mesmo
```

---

## 7. Push e abertura de PR

```bash
git push -u origin feature/project-tracking-bu-column
```

### Título do PR

- Curto, < 70 caracteres
- Mesmo estilo dos commits: `feat(project-tracking): add BU short column to dashboard`

### Descrição

Estrutura mínima:

```markdown
## Summary
- O que esta mudança faz, em 1-3 bullets de alto nível

## Why
- Qual problema ou pedido motiva (linkar US ou ticket: closes #123)

## Test plan
- [ ] Logar como admin, abrir /dashboard, ver coluna BU populada
- [ ] Importar nova planilha e validar que o preview mostra BU
- [ ] Logar como user comum — coluna deve aparecer também (read-only)
```

> O **"Why"** é o pedaço mais valioso. O código mostra o "o quê". Só você sabe a motivação no momento do PR.

---

## 8. Code review

### Auto-review primeiro

Antes de pedir review humano, **revise você mesmo o PR no GitHub** (não no editor — outra forma de ler). Você vai pegar 30% dos problemas.

### Use `/code-review`

Este projeto tem o skill `/code-review`:

```
/code-review            # padrão (med effort) — algumas findings de alta confiança
/code-review high       # mais cobertura
/code-review ultra      # review profundo multi-agente na nuvem (PR ou branch)
```

A versão `ultra` (também conhecida como `/ultrareview`) é a mais profunda — útil em PRs grandes ou de alta criticidade.

### Revisor humano

Quando pedir revisão:

- Mencione no PR a área de foco ("preciso de olho na transação do confirm import")
- Se o PR tem >500 linhas, considere quebrar — review fica superficial em PRs grandes

---

## 9. Endereçando comentários

Para cada comentário:

- **Concorda?** Corrija, comite, peça novo review
- **Discorda?** Responda explicando — pode ser que você esteja certo, pode ser que o revisor esteja
- **Não entendeu?** Pergunte. Não tente adivinhar

> ⚠️ **Não esqueça** comentários por accident. Use os badges "Resolved" do GitHub para fechar quando endereçado.

---

## 10. Merge

O projeto usa **squash and merge** por padrão. Resultado: cada PR vira **um commit** no `main`.

Por que:

- Histórico do main fica limpo (1 PR = 1 commit)
- `git bisect` funciona melhor
- Reverter PR é só `git revert <hash>`

Depois do merge:

```bash
git switch main
git pull --rebase
git branch -d feature/...    # apaga branch local
# Se quiser limpar branches antigas que já sumiram do remoto:
# use o skill `/clean_gone`
```

---

## Quando algo dá errado

### "Resolvi conflito do jeito errado"

```bash
git reflog                    # acha o commit antes do merge ruim
git reset --hard <hash>       # volta. CUIDADO: descarta trabalho não comitado.
```

> ⚠️ `--hard` é destrutivo. Confira `git status` antes.

### "Comitei coisa errada"

```bash
git reset HEAD~1              # desfaz último commit, mantém mudanças no working tree
git restore --staged <arquivo>  # tira do stage
```

### "Branch desatualizou e quero o main novo"

```bash
git fetch origin
git rebase origin/main
# resolva conflitos, depois:
git push --force-with-lease   # NÃO use --force. Lease é mais seguro.
```

---

## Anti-padrões que rejeitamos no review

- **PR sem descrição** ou só com "fix"
- **PR com mais de uma coisa** (refator + fix + feature) — separe
- **Commits "wip", "asd", "fix lint"** — squash localmente antes de push
- **Edit em arquivo gerado** (Prisma Client, build output) — não edite mão
- **Migrations editadas** após mergeadas — sempre nova migration
- **Push direto na `main`** — bloqueado pelas regras do repo

---

## Skills úteis durante o fluxo

- `/code-review` — revisar diff atual antes de pedir review humano
- `/simplify` — aplicar fixes do code-review na working tree
- `/verify` — subir o app e testar como usuário
- `/commit` — gerar mensagem de commit estilo conventional
- `/commit-push-pr` — commit + push + abrir PR em um passo
- `/clean_gone` — apagar branches locais cujo remoto sumiu

---

## 🛠 Exercício

1. Sem rodar nada, escreva (em pseudo-comandos) a sequência exata de bash para:
   - Pegar a `main` mais nova
   - Criar branch `feature/users-filter-by-status`
   - Garantir que deps e migrations estão sincronizados
2. Escreva um título de commit conventional para cada cenário:
   - Adicionou campo `criticality` no `ProjectSnapshot`
   - Corrigiu bug no lockout que contava tentativas após sucesso
   - Renomeou `kpi-cards.tsx` para `bullet-kpis.tsx`
3. Olhe o `git log --oneline -n 20` do projeto. Identifique 2 commits que seguem o padrão **bem** e 2 que poderiam ser melhores.
4. Abra um PR antigo do projeto (se possível). A descrição responde **"por quê"** ou só **"o quê"**?
5. (Reflexão) Você está no meio de implementar uma feature. Sua branch tem 30 commits, 1500 linhas de diff, e abrange backend + frontend + nova migration. Vale abrir um único PR? Por quê?

**Critério de pronto:** você consegue listar todos os passos do fluxo (do spec ao merge) sem consultar este capítulo.

➡️ Próximo: [09 — Infra & deploy](./09-infra-docker-deploy.md)
