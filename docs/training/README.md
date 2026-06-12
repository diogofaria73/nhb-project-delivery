# Tutorial Hands-on — NHB Project Delivery

Material de treinamento para desenvolvedores juniores entenderem como a plataforma **NHB Project Delivery** é organizada e como contribuir nela com segurança.

O tutorial é guiado pelo código real do repositório — não há pseudocódigo, todos os exemplos saem direto de arquivos que você pode abrir agora.

---

## Para quem é este material

Você sabe TypeScript básico, já mexeu com React e Node.js, mas:

- Nunca trabalhou com **DDD / Clean Architecture** num projeto de verdade
- Não sabe por que existem 4 pastas (`domain`, `application`, `infrastructure`, `presentation`) dentro de cada módulo
- Não tem certeza de onde colocar a próxima linha de código quando recebe uma tarefa
- Quer entender o **pipeline completo** — do spec à imagem Docker em produção

Se você já é sênior nessas tecnologias, use este material só como **referência de convenções** do projeto.

---

## Como usar

Os capítulos são **sequenciais**. Cada um depende dos anteriores. A última seção de cada capítulo é um **exercício hands-on** — não pule, é onde o conhecimento se consolida.

Tempo estimado: **8–12 horas** de estudo + exercícios. O capstone (capítulo 10) sozinho leva 2–3 horas.

---

## Trilha

| # | Capítulo | O que você aprende |
| --- | --- | --- |
| 00 | [Pré-requisitos](./00-pre-requisitos.md) | Setup do ambiente e conhecimento mínimo esperado |
| 01 | [Visão geral do produto](./01-visao-geral.md) | O domínio: PMO, Excel anual, dashboard, RBAC |
| 02 | [Arquitetura do monorepo](./02-arquitetura-monorepo.md) | `pnpm workspaces` e os 3 pacotes (`apps/api`, `apps/web`, `packages/shared`) |
| 03 | [Backend: DDD em camadas](./03-backend-ddd-camadas.md) | As 4 camadas, a regra de dependência e por que isolar |
| 04 | [Walkthrough: project-tracking](./04-walkthrough-project-tracking.md) | Trace completo de um `POST /imports/preview` do HTTP até o parser |
| 05 | [Frontend: feature-based](./05-frontend-feature-based.md) | `Page → Component → Hook → Service`, shadcn/ui e `RoleGuard` |
| 06 | [Contratos compartilhados](./06-contratos-compartilhados.md) | Como `packages/shared` sincroniza tipos entre back e front |
| 07 | [Prisma & migrations](./07-prisma-e-migrations.md) | Schema, migrations em dev vs produção, escape hatches |
| 08 | [Fluxo de desenvolvimento](./08-fluxo-de-desenvolvimento.md) | Do spec em `docs/specs/` até o PR (commits, code-review) |
| 09 | [Infra & deploy](./09-infra-docker-deploy.md) | `docker-compose`, `Dockerfile` multistage, scripts `docker:*` |
| 10 | [Capstone — novo módulo `notifications`](./10-capstone-novo-modulo.md) | Construir um módulo ponta a ponta usando tudo aprendido |

---

## Convenções deste tutorial

- **Caminhos absolutos a partir da raiz do repo** — `apps/api/src/modules/project-tracking/...` em vez de caminhos relativos.
- **Referências de código no formato `arquivo:linha`** — ex.: `project-tracking.controller.ts:64`. Você pode usar isso pra navegar direto no editor.
- **Trechos verbatim** do código no momento da escrita. Se houver divergência, **o código manda** — abra um PR atualizando o tutorial.
- **Exercícios** sempre no fim do capítulo, dentro de um bloco `## 🛠 Exercício`.
- **Texto em PT-BR, código sempre em inglês** — segue a regra do `CLAUDE.md`.

---

## Antes de começar

Garanta que você consegue:

1. Rodar `pnpm bootstrap` na raiz sem erros
2. Abrir **http://localhost:5173** e logar como `admin@platform.com` / `Admin@123`
3. Trocar a senha no `/first-login`
4. Ver o dashboard renderizado (mesmo vazio)

Se algum passo falhar, **fique no capítulo 00 até resolver**. Todos os outros assumem que o ambiente está rodando.

---

## Onde está a fonte da verdade

Quando o tutorial e a realidade divergirem:

| Fonte | Para que serve |
| --- | --- |
| **Código no repo** | Verdade absoluta sobre como o sistema funciona hoje |
| **`docs/specs/US-*.md`** | Verdade sobre o **comportamento esperado** (regras de negócio) |
| **`CLAUDE.md`** | Verdade sobre **convenções** e regras de quem contribui |
| **Este tutorial** | Caminho didático — pode estar atrás do código |

---

Bons estudos. Comece pelo [capítulo 00](./00-pre-requisitos.md).
