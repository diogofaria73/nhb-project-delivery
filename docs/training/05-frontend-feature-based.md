# 05 — Frontend: feature-based

O backend é DDD. O frontend é **feature-based** — mesmo espírito de organização vertical, vocabulário diferente.

---

## A ideia em uma frase

> Cada **feature do produto** (auth, dashboard, users, …) é uma pasta auto-contida com **tudo** que ela precisa: páginas, componentes, hooks, tipos.

Não temos uma pasta gigante `components/` com 200 arquivos. Componentes do dashboard ficam dentro de `features/project-tracking/components/`. Componentes da listagem de usuários ficam em `features/users/components/`. Cada feature é um mini-app.

---

## A estrutura de `apps/web/src/`

```
src/
├── app/                    Shell global: layout, rotas, providers
│   ├── App.tsx
│   ├── layout/
│   │   ├── admin-layout.tsx
│   │   └── role-guard.tsx
│   └── providers/
├── components/ui/          Componentes shadcn (botão, dialog, table, …)
├── features/               Features do produto
│   ├── auth/
│   ├── first-login/
│   ├── account/
│   ├── users/
│   └── project-tracking/   (dashboard + import history)
├── hooks/                  Hooks GLOBAIS (useCurrentUser, etc.)
├── i18n/                   Traduções pt-BR / en
├── lib/                    Utilidades (cn(), formatadores, máscaras)
├── services/               Cliente HTTP + service por recurso
├── styles/                 Tailwind + CSS global
└── types/                  Tipos globais (re-exports do shared)
```

---

## Anatomia de uma feature

Vejamos `features/project-tracking/` como template:

```
features/project-tracking/
├── components/
│   ├── hydro/                        Visualizações com tema Hydro
│   │   ├── bullet-kpi.tsx
│   │   ├── status-donut.tsx
│   │   ├── manager-bars.tsx
│   │   ├── weekly-bars.tsx
│   │   └── ...
│   ├── import-dialog.tsx             Dialog de upload + preview
│   ├── project-table.tsx
│   ├── project-detail-drawer.tsx
│   ├── kpi-cards.tsx
│   └── ...
├── hooks/
│   ├── use-dashboard.ts              fetch + estado do dashboard
│   ├── use-dashboard-filters.ts      ano / status / mês / semana
│   ├── use-import-history.ts         listar / confirmar / restaurar / deletar
│   └── use-animated-number.ts
├── lib/
│   ├── compute.ts                    cálculos puros (KPIs derivados)
│   └── iso-week.ts
├── pages/
│   ├── dashboard-page.tsx
│   └── import-history-page.tsx
├── types/
│   └── index.ts                      re-exports do @nhb-status-report/shared
└── index.ts                          PUBLIC API da feature
```

A pasta `index.ts` (`features/project-tracking/index.ts`) é a **fachada**: tudo que outras features e o app shell consomem sai daqui.

```typescript
// features/project-tracking/index.ts (exemplo)
export { DashboardPage } from './pages/dashboard-page';
export { ImportHistoryPage } from './pages/import-history-page';
```

> ⛔ **Não importe `features/project-tracking/components/kpi-cards` de fora da feature.** Use só o que está em `index.ts`. Se você precisa de algo de outra feature, **promova-o**: ou exporta no `index.ts` ou move para um lugar compartilhado.

---

## O padrão `Page → Component → Hook → Service → API`

Esta é a hierarquia mais importante de memorizar:

```
┌──────────────────────────────────────────────────────────────┐
│ Page          recebe params da rota, monta layout            │
│  ▼                                                            │
│ Component     UI pura, recebe props, dispara handlers        │
│  ▼                                                            │
│ Hook          estado + chamadas async + side effects         │
│  ▼                                                            │
│ Service       chamada HTTP (axios), retorna tipo do shared   │
│  ▼                                                            │
│ API           backend                                         │
└──────────────────────────────────────────────────────────────┘
```

Por quê:

- **Page** não conhece axios. Só sabe "tem uma rota `/dashboard`, eu monto isso".
- **Component** não conhece HTTP. Só recebe props e dispara handlers. Testar é mockar props.
- **Hook** é onde estado vive. `useState`, `useEffect`, `useCallback`. Concentra a complexidade de async.
- **Service** é o único lugar que sabe URLs e formatos da API.
- **API** = backend.

> ⛔ **Nunca chame `fetch`/`axios` dentro de um componente.** Sempre via service, exposto por um hook.

### Exemplo concreto

```tsx
// pages/dashboard-page.tsx
export function DashboardPage() {
  const { data, isLoading, error } = useDashboard();
  const filters = useDashboardFilters();
  return (
    <PageLayout>
      <KpiCards data={data?.kpis} />
      <ProjectTable rows={data?.rows ?? []} onRowClick={...} />
    </PageLayout>
  );
}

// hooks/use-dashboard.ts
export function useDashboard() {
  const [data, setData] = useState<DashboardResponseDto>();
  // ...
  useEffect(() => {
    projectTrackingService.getDashboard(year).then(setData);
  }, [year]);
  return { data, isLoading, error };
}

// services/project-tracking.service.ts
export const projectTrackingService = {
  getDashboard: (year: number) =>
    apiClient.get<DashboardResponseDto>(`/project-tracking/dashboard?year=${year}`),
  // ...
};
```

---

## `services/` — o cliente HTTP

**Arquivo central:** `apps/web/src/services/api-client.ts`

Ele cria uma instância axios com:

- `baseURL` apontando para o backend (`http://localhost:3000/api` em dev)
- **Interceptor de request** — anexa `Authorization: Bearer <token>` lido do `localStorage`
- **Interceptor de response** — se 401, limpa token e redireciona para `/login`

**Um service por recurso:**

```
services/
├── api-client.ts              base
├── auth.service.ts            login, logout, getCurrentUser
├── user.service.ts            listUsers, createUser, …
└── project-tracking.service.ts getDashboard, listImports, confirmImport, …
```

Padrões:

- Cada função retorna **tipo do `@nhb-status-report/shared`** (sem `any`)
- Uploads multipart usam `postFormData(...)`
- Downloads binários usam `getBlob(...)`

---

## Componentes — convenções

- **Named exports** sempre: `export function DashboardPage()` (sem `default`)
- Arquivos em **kebab-case**: `kpi-cards.tsx`, `project-table.tsx`
- Componentes em **PascalCase**: `KpiCards`, `ProjectTable`
- **Sem lógica de negócio** dentro do componente — extraia para hook
- **Sem inline styles** — só classes Tailwind. Para condicional, use `cn()`:

```tsx
import { cn } from '@/lib/utils';

<div className={cn('rounded-lg p-4', isCritical && 'bg-red-100')}>
```

---

## shadcn/ui — biblioteca de componentes

`shadcn/ui` é diferente do que você espera. Em vez de instalar um pacote npm e importar componentes prontos, você **gera o código fonte** dos componentes no seu repo. Eles ficam em `apps/web/src/components/ui/`.

Para adicionar um novo:

```bash
cd apps/web
npx shadcn@latest add tooltip
# cria apps/web/src/components/ui/tooltip.tsx
```

Por que isso é bom: **você edita o componente** quando precisar de uma variante específica. Não fica preso à API do mantenedor.

Componentes shadcn já presentes no projeto: `button`, `dialog`, `dropdown-menu`, `input`, `label`, `table`, `select`, `popover`, `tabs`, `tooltip`, … (varia — verifique `components/ui/` ao trabalhar).

---

## Roteamento

**Arquivo:** `apps/web/src/app/App.tsx`

```tsx
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/first-login" element={<FirstLoginPage />} />
    <Route element={<AdminLayout />}>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route
        path="/dashboard/imports"
        element={
          <RoleGuard allowedRoles={['ADMINISTRATOR']}>
            <ImportHistoryPage />
          </RoleGuard>
        }
      />
      <Route
        path="/users"
        element={
          <RoleGuard allowedRoles={['ADMINISTRATOR']}>
            <UsersPage />
          </RoleGuard>
        }
      />
      <Route path="/account" element={<AccountPage />} />
    </Route>
  </Routes>
</BrowserRouter>
```

Note:

- `/login` e `/first-login` ficam **fora** do `AdminLayout` (não exigem sessão)
- O `AdminLayout` é um layout pai com `<Outlet />` que valida o JWT antes de renderizar children
- **`RoleGuard`** restringe por role — frontend não decide, só esconde UI; backend é a defesa real

---

## RoleGuard — defesa em profundidade

Como dito no capítulo 01: o **backend** é a única defesa real. O `RoleGuard` no frontend serve para **não mostrar telas que o usuário não pode usar**. Se ele driblar o guard editando o JavaScript, o backend rejeita as chamadas com 403.

> ⚠️ Nunca, **jamais**, valide segurança apenas no frontend.

---

## i18n — Português + Inglês

Todas as strings de UI passam pelo `react-i18next`:

```tsx
import { useTranslation } from 'react-i18next';

export function DashboardHeader() {
  const { t } = useTranslation();
  return <h1>{t('projectTracking.dashboard.title')}</h1>;
}
```

As chaves vivem em `apps/web/src/i18n/locales/pt-BR.ts` e `en.ts` — **mantenha as duas em sincronia**. Se adicionar `projectTracking.dashboard.title`, adicione nas duas.

Namespacing por feature: prefixo é o nome da feature (`projectTracking.*`, `users.*`, `auth.*`).

---

## Estado: onde colocar?

Regra: **estado vive o mais perto possível de onde é usado**.

- Estado de um componente isolado → `useState` no componente
- Estado de uma feature inteira → hook custom dentro de `features/X/hooks/`
- Estado global (ex.: usuário logado) → hook em `apps/web/src/hooks/` (ex.: `useCurrentUser`)

Não usamos Redux nem MobX neste projeto. **Não use React Query também** — o padrão é `useState` + `useEffect` mais simples (vê os hooks da `project-tracking` como exemplo). Manter consistência > escolher a "biblioteca da moda".

---

## Checklist ao adicionar uma feature

Diga que estamos adicionando `features/audit-log/`:

1. Crie pasta `features/audit-log/` com `pages/`, `components/`, `hooks/`, `types/`, `index.ts`
2. Crie a página `pages/audit-log-page.tsx`
3. Crie hook `hooks/use-audit-log.ts` que consome um service
4. Crie service `services/audit-log.service.ts` (fora da feature, em `apps/web/src/services/`)
5. Exporte a página em `features/audit-log/index.ts`
6. Registre a rota em `apps/web/src/app/App.tsx` com `<RoleGuard>` se for admin-only
7. Adicione chaves i18n em `pt-BR.ts` e `en.ts` sob `auditLog.*`
8. Tipos compartilhados com backend → vão em `packages/shared/src/types/audit-log-contracts.ts`

---

## 🛠 Exercício

1. Abra `apps/web/src/features/project-tracking/pages/dashboard-page.tsx`. Conte:
   - Quantos hooks ele usa?
   - Quantas chamadas HTTP **diretas** (axios/fetch) ele faz? (Espera-se: zero.)
2. Abra `apps/web/src/features/project-tracking/hooks/use-dashboard.ts`. Identifique:
   - Qual service ele chama?
   - Como ele lida com erro/loading?
3. Abra `apps/web/src/services/project-tracking.service.ts`. Confira: **as funções retornam tipos do `@nhb-status-report/shared` ou `any`?** (Devem ser typados.)
4. Abra `apps/web/src/app/layout/role-guard.tsx`. Em duas frases, descreva o que ele faz e por que ele **não é suficiente** para proteger uma rota sensível.
5. Abra `apps/web/src/i18n/locales/pt-BR.ts` e procure por `projectTracking.dashboard`. Quantas sub-chaves existem?

**Critério de pronto:** dada uma nova tela hipotética, você consegue planejar todos os arquivos que precisa criar **antes** de codificar.

➡️ Próximo: [06 — Contratos compartilhados](./06-contratos-compartilhados.md)
