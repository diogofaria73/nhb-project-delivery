# Auditoria de Segurança — NHB Status Report

**Data da auditoria:** 2026-06-10
**Escopo:** apps/api, apps/web, packages/shared, config raiz
**Postura geral:** **MÉDIO-ALTO** — base sólida (cookie httpOnly + SameSite strict, lockout, ValidationPipe), mas 3 falhas críticas de autorização e lacunas de hardening pendentes.

> Este documento é o plano de remediação. Cada item tem severidade, arquivo, fix e esforço. Use os checkboxes para acompanhar progresso. Resolva por sprint na ordem sugerida no final.

---

## Como usar este documento

- `[ ]` = pendente
- `[x]` = implementado (preencher data + commit/PR no rodapé do item)
- Cada item lista: **arquivo:linha**, **problema**, **impacto**, **fix sugerido**, **esforço** (S/M/L)
- Esforço: S = até 1h · M = meio dia · L = 1+ dias

---

## Críticos

Devem ser resolvidos antes de qualquer deploy em produção.

### [x] C1 — IDOR no download de anexos *(fechado em 2026-06-10)*

- **Arquivo:** `apps/api/src/modules/status-reports/presentation/controllers/status-reports.controller.ts:168`
- **Problema:** `@Get(':id/attachments/:attachmentId')` não tinha `@Roles` decorator. Qualquer usuário autenticado conseguia baixar qualquer anexo conhecendo os IDs.
- **Fix aplicado:** Adicionado `@Roles('ADMINISTRATOR')` no endpoint. Médio prazo (ownership check no use case) pendente quando role USER for liberada pra ler entregas próprias.
- **Esforço:** S

### [x] C2 — Listagem e leitura de usuários sem role guard *(fechado em 2026-06-10)*

- **Arquivo:** `apps/api/src/modules/users/presentation/controllers/users.controller.ts:74, 88`
- **Problema:** `GET /users` e `GET /users/:id` sem `@Roles`. Qualquer usuário autenticado enumerava usuários (nome, email, role).
- **Fix aplicado:**
  - `GET /users` → `@Roles('ADMINISTRATOR')` (Admin-only)
  - `GET /users/:id` → handler verifica `currentUser.role === 'ADMINISTRATOR' || currentUser.userId === id`; senão `ForbiddenException`
- **Esforço:** S

### [x] C3 — Login retorna JWT no body da resposta *(fechado em 2026-06-10)*

- **Arquivo:** `apps/api/src/modules/auth/presentation/controllers/auth.controller.ts:53`
- **Problema:** `return { ...result.user, token: result.token }` — o token ia no cookie httpOnly E no JSON.
- **Fix aplicado:**
  - API: agora retorna `result.user` (sem `token`)
  - Frontend: `auth.service.ts` removeu `token` do `AuthResponse`; `login-form.tsx` desestrutura `const { redirectTo, ...user } = await authService.login(data)`
- **Esforço:** S

---

## Altos

Devem ser resolvidos antes do primeiro release em produção (~1 sprint).

### [ ] A1 — Logout não invalida o token

- **Arquivo:** `apps/api/src/modules/auth/presentation/controllers/auth.controller.ts:61`
- **Problema:** `logout` só limpa cookie. Se o cookie foi roubado, o JWT continua válido até `JWT_EXPIRATION` (8h). Sem blacklist nem rotação.
- **Impacto:** Replay de sessão pós-logout.
- **Fix:**
  - Opção A (simples): denylist em memória (LRU com TTL = `exp - now`)
  - Opção B (robusta): Redis com mesma estratégia
  - Opção C (recomendada): encurtar `JWT_EXPIRATION` para 15–30min + implementar refresh token rotativo
- **Esforço:** M (A/B) · L (C)
- **Relacionado:** L1

### [ ] A2 — Sem rate limiting / throttling

- **Arquivo:** `apps/api/src/main.ts`
- **Problema:** Nenhum endpoint tem throttling. Lockout por usuário (5 tentativas) é contornável distribuindo tentativas por email.
- **Impacto:** Brute force, DoS leve, abuse de endpoints públicos.
- **Fix:**
  - Instalar `@nestjs/throttler`
  - Global: 100 req/min por IP
  - `/auth/login`: 5/min por IP
  - `/status-reports/:id/attachments/:attachmentId`: 30/min
- **Esforço:** M

### [x] A3 — CORS aceita default inseguro em produção *(fechado em 2026-06-10)*

- **Arquivo:** `apps/api/src/main.ts:24` — `origin: process.env.CORS_ORIGIN || 'http://localhost:5173'`
- **Problema:** Se `CORS_ORIGIN` não estiver setado em prod, cai num fallback inútil mas indica config fail-open. Pior se alguém colocar `*` como atalho.
- **Fix:**
  ```ts
  if (NODE_ENV === 'production' && !CORS_ORIGIN) {
    throw new Error('CORS_ORIGIN required in production');
  }
  ```
  Aceitar whitelist explícita (array de origins) em vez de string única.
- **Esforço:** S

### [x] A4 — Helmet ausente (security headers em falta) *(fechado em 2026-06-10)*

- **Arquivo:** `apps/api/src/main.ts`
- **Problema:** Sem `X-Frame-Options`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Content-Security-Policy`. Vulnerável a clickjacking, MIME sniffing.
- **Fix:** `app.use(helmet())`. CSP requer config customizada que cubra origem da API e qualquer CDN.
- **Esforço:** S (básico) · M (com CSP completa)

### [x] A5 — Swagger exposto em produção *(fechado em 2026-06-10)*

- **Arquivo:** `apps/api/src/main.ts:36`
- **Problema:** `SwaggerModule.setup('docs', app, document)` sem checagem de ambiente. Em prod, qualquer um acessa `/api/docs` e vê toda a superfície de API.
- **Fix:** `if (NODE_ENV !== 'production') SwaggerModule.setup(...)`. Alternativa: proteger com Basic Auth via middleware.
- **Esforço:** S

---

## Médios

Devem entrar no backlog próximo (~1-2 sprints).

### [ ] M1 — Senha admin hardcoded no seed

- **Arquivo:** `apps/api/prisma/seed.ts:18`
- **Problema:** `Admin@123` no código, publicada no GitHub.
- **Impacto:** Mitigado pelo `mustChangePassword`, mas se seed rodar em ambiente sem essa flag ativa, senha conhecida.
- **Fix:**
  - Gerar senha aleatória (16+ chars) com `crypto.randomBytes(16).toString('base64url')`
  - Imprimir no console **uma vez** durante o seed
  - Garantir `mustChangePassword: true`
  - Documentar no README que seed só roda uma vez (idempotência via check de existência já está implementada)
- **Esforço:** S

### [ ] M2 — Update de role/isActive sem auditoria

- **Arquivo:** `apps/api/src/modules/users/application/use-cases/update-user.use-case.ts`
- **Problema:** Admin pode promover qualquer um a admin ou desativar usuários sem registro de quem fez nem quando.
- **Fix:**
  - Curto prazo: gravar `updatedById` + `updatedAt` no `User` (acompanhando o padrão de `StatusReportGoal`)
  - Médio prazo: tabela `audit_log` (user_id, action, target, before, after, timestamp)
- **Esforço:** M

### [ ] M3 — Anexos servidos com Content-Type original

- **Arquivo:** `apps/api/src/modules/status-reports/presentation/controllers/status-reports.controller.ts:176`
- **Problema:** `res.setHeader('Content-Type', download.mimeType)`. Se o whitelist do upload aceita SVG ou HTML, o navegador renderiza inline e executa scripts.
- **Fix:**
  - Forçar `Content-Type: application/octet-stream` no download
  - Reverificar o whitelist de MIME do upload — recomendado: PDF, DOCX, XLSX, PPTX, PNG, JPG, ZIP
  - Validar que extensão do filename bate com o MIME real (magic bytes — ex.: `file-type` package)
- **Esforço:** S (header) · M (validação completa)

### [x] M4 — JWT_SECRET fraco no .env.example sem validação em runtime *(fechado em 2026-06-10)*

- **Arquivo:** `apps/api/.env.example:6`
- **Problema:** Default `"nhb-dev-secret-change-in-production"`. Sem checagem que rejeita esse valor em prod.
- **Fix:**
  ```ts
  if (NODE_ENV === 'production' && JWT_SECRET.startsWith('nhb-dev')) {
    throw new Error('JWT_SECRET must be replaced in production');
  }
  ```
  Documentar no README: `openssl rand -base64 64` para gerar.
- **Esforço:** S

### [ ] M5 — PrismaModule @Global erode garantias de domínio

- **Arquivo:** `apps/api/src/shared/infrastructure/database/prisma.module.ts`
- **Problema:** Sendo `@Global`, qualquer serviço pode injetar `PrismaService` e bypass a camada de repositório. Não é vulnerabilidade direta, mas erode o padrão DDD.
- **Fix:**
  - Remover `@Global`
  - Importar `PrismaModule` apenas em `*.module.ts` de cada domínio
  - Adicionar linter rule que proíbe import de `PrismaService` fora de `infrastructure/repositories/`
- **Esforço:** M

---

## Baixos

Melhorias incrementais, sem urgência.

### [ ] L1 — JWT_EXPIRATION de 8h é longo

- **Arquivo:** `apps/api/.env.example:7`
- **Fix:** Reduzir para 15–30min. Implementação acoplada com A1 (refresh token).
- **Esforço:** Coberto por A1

### [ ] L2 — Sem `trust proxy` se deploy atrás de proxy

- **Local:** bootstrap
- **Problema:** Em prod atrás de Nginx/Cloudflare, `req.ip` será do proxy. Throttler (quando adicionado em A2) vai falhar de fechado.
- **Fix:** `app.set('trust proxy', 1)` ou equivalente no Express config.
- **Esforço:** S

### [ ] L3 — `console.log` no seed e em alguns pontos

- **Local:** `apps/api/prisma/seed.ts:34` e outros
- **Fix:** Trocar por `Logger` do NestJS. Padrão do projeto definido em CLAUDE.md.
- **Esforço:** S

### [ ] L4 — Cobertura de testes de auth baixa

- **Local:** Apenas `login.use-case.spec.ts` existe.
- **Faltam:** testes de `change-password`, `first-login`, `update-user` com role change, bypass de lockout, IDOR contra `users/:id`.
- **Fix:** Adicionar specs incrementalmente — 1 spec por sprint cobrindo um cenário sensível.
- **Esforço:** L (incremental)

### [ ] L5 — localStorage armazena objeto user (verificado: NÃO contém token)

- **Local:** `apps/web/src/features/auth/components/login-form.tsx:32`
- **Nota:** Achado inicial sugeriu JWT em localStorage; **falso positivo**. Token vai só no cookie httpOnly. localStorage tem só nome, email, role, mustChangePassword.
- **Risco real:** XSS pode chamar API com cookie automaticamente (`credentials: 'include'`). Foco deve ser prevenção de XSS (Helmet/CSP — ver A4), não realocar dados do localStorage.
- **Fix:** Nenhum aqui. Resolvido por A4.

---

## Plano de remediação sugerido

### Sprint 1 — Críticos + hardening rápido **(CONCLUÍDA em 2026-06-10)**

Objetivo: app pronto para deploy em ambiente staging com confiança razoável.

- [x] C1 — `@Roles` em download de anexos
- [x] C2 — `@Roles` em users
- [x] C3 — Remover token do body de `/auth/login`
- [x] A4 — `helmet()` no main.ts
- [x] A5 — Swagger só em dev
- [x] A3 — Validação de `CORS_ORIGIN`
- [x] M4 — Validação de `JWT_SECRET`

**Próximo passo:** Sprint 2.

### Sprint 2 — Altos restantes (~1 semana)

Objetivo: deploy em produção com defesa em profundidade.

- [ ] A2 — Rate limiting (4h)
- [ ] A1 — Denylist + refresh token (3 dias)
- [ ] L2 — `trust proxy` (30min, junto com A2)
- [ ] M1 — Seed com senha aleatória (1h)
- [ ] M3 — `Content-Type: application/octet-stream` no download (2h)

### Sprint 3 — Médios pendentes (~1 sprint)

- [ ] M2 — Audit log de mutações sensíveis (2 dias)
- [ ] M5 — Refactor para tirar `PrismaModule` global (1 dia)

### Backlog contínuo

- [ ] L3 — Logger no lugar de console.log (1h)
- [ ] L4 — Cobertura de testes de auth (incremental)

---

## Histórico de execução

| Item | Data | Commit/PR | Responsável | Notas |
| --- | --- | --- | --- | --- |
| A3 (CORS validation) | 2026-06-10 | deploy prep | Diogo | bootstrap exige `CORS_ORIGIN` em prod |
| A4 (helmet) | 2026-06-10 | deploy prep | Diogo | CSP desabilitado temporariamente |
| A5 (Swagger gating) | 2026-06-10 | deploy prep | Diogo | só em dev |
| M4 (JWT_SECRET validation) | 2026-06-10 | deploy prep | Diogo | bootstrap rejeita prefix `nhb-dev-` em prod |
| C1 (IDOR download) | 2026-06-10 | sprint-1 | Diogo | `@Roles('ADMINISTRATOR')` no download |
| C2 (users sem guard) | 2026-06-10 | sprint-1 | Diogo | Admin-only list; self/Admin para findOne |
| C3 (JWT no body) | 2026-06-10 | sprint-1 | Diogo | API e FE ajustados |

---

## Pontos fortes da postura atual (preservar)

- Cookie de auth com `httpOnly: true`, `secure: production`, `sameSite: 'strict'`
- Lockout de conta implementado (BR-04/BR-05) — 5 tentativas por usuário
- `ValidationPipe` global com `whitelist: true, forbidNonWhitelisted: true, transform: true`
- `GlobalExceptionFilter` evita vazamento de stack trace
- Prisma sem `$queryRaw` em campos sensíveis (auth, users) — SQL injection mitigado por padrão
- File upload já tem whitelist de MIME e tamanho máximo (revisar em M3)
- `.gitignore` cobre `.env`, `uploads/`, `node_modules/`, `.DS_Store`
- DDD facilita drasticamente a remediação — regras de autorização concentram-se nos use cases
