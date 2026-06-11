# Plano de Implementação — US-09 Dashboard Status Report (visual Hydro)

> Companheiro de `US-09-dashboard-hydro-visual.md`. Este documento descreve **como** entregar a US, em fases sequenciais dentro de um único PR.

## Resumo da estratégia

- **PR único**, end-to-end, substituindo as seções de Dashboard e detalhe da US-08 (US-08.3 e US-08.4).
- Sem alterações no backend `apps/api/src/modules/project-tracking/`. A nova UI consome o endpoint existente `GET /api/project-tracking/dashboard?year=YYYY` e recalcula tudo client-side a partir dos `weekFlagsBase64` por projeto.
- Componentes de visualização escritos em **SVG puro** (sem `recharts`); fica leve, dá controle total do estilo e remove uma dependência grande do bundle.
- Tema **dark exclusivo do `/dashboard`**: aplicado via toggle de classe `theme-hydro` no `<html>` no mount da página, removido no unmount. As outras rotas (login, /users, /dashboard/imports) continuam no shadcn padrão.
- Assets (Ivar Display, logo Hydro, protótipo) chegam em **PR separado** — durante a implementação usamos `Crimson Pro`/`Georgia` como stand-in e um caption text "HYDRO" no lugar do logo. O merge final exige os arquivos definitivos commitados.

---

## Fase 1 — Tema, tokens e fontes

**Objetivo:** infraestrutura visual (CSS) sem tocar em componente.

**Criar `apps/web/src/styles/hydro-theme.css`** com:
- `@font-face` para `IvarDisplayHydro-Regular` apontando para `/brand/fonts/IvarDisplayHydro-Regular.ttf` com `local("Crimson Pro"), local("Georgia")` como fallback intermediário.
- `@font-face` para `IvarTextHydro-Regular`, `IvarTextHydro-Bold` (mesmo padrão).
- Bloco `:root.theme-hydro { --bg: #1b2027; --panel: #252b34; … }` com **todos os 13 tokens** listados em US-09 § Identidade visual.
- Override de tokens shadcn quando `.theme-hydro` está ativo: `--background`, `--foreground`, `--card`, `--border` mapeados para os tokens Hydro.
- Regra global `.theme-hydro body { background: var(--bg) radial-gradient(1200px 600px at 80% -10%, #2a323d 0%, transparent 60%); color: var(--ink); font-variant-numeric: tabular-nums; }`.

**Modificar:**
- `apps/web/src/main.tsx` — `import './styles/hydro-theme.css';` (carrega global, mas só ativa quando a classe é aplicada).
- `apps/web/public/brand/` — criar a pasta como placeholder com um `.gitkeep` para deixar o caminho válido enquanto os assets não entram.

**Risco:** se o cliente entregar a Ivar Display com outro nome de família interno, o `@font-face` não bate. **Mitigação:** comentário no CSS pedindo ao reviewer para conferir `font-family` do `.ttf` real e ajustar.

---

## Fase 2 — Utilitários puros (`lib/compute.ts`)

**Objetivo:** isolar toda a lógica matemática em funções puras testáveis.

**Criar `apps/web/src/features/project-tracking/lib/compute.ts`** exportando:
- `decodeWeekFlags(base64: string): boolean[]` (53 booleans).
- `cumulativeWeeksSent(flags: boolean[], weekN: number): number` (popcount manual nos primeiros `weekN` bits).
- `cumulativePercent(flags: boolean[], weekN: number, projectStatus: ProjectStatus): number` — aplica BR-67 e BR-68 (zero para status ≠ ACTIVE no contexto de "média de portfólio"; **mas** retorna o valor real quando consumido pela tabela). Para diferenciar, expõe duas funções: `cumulativePercentForTable(flags, weekN)` e `cumulativePercentForAverages(flags, weekN, status)`.
- `kpiAcumuladoAnual(projects, weekN): number` — média dos `cumulativePercentForAverages` dos projetos visíveis.
- `kpiSemanaCorrente(projects, weekN): number` — % de visíveis com bit `weekN` setado.
- `donutCounts(projects): Record<ProjectStatus, number>` — agregação por status do conjunto pré-filtrado.
- `weeklyPercents(projects, untilWeek: number): number[]` — array `length = untilWeek` com `% visíveis com bit w` para w em 1..untilWeek.
- `byManager(projects, weekN): Array<{ pm: string; percent: number; count: number }>` — agrupa por `pm ?? "Sem PM atribuído"`, calcula média (BR-68), filtra valores 0%, ordena desc.
- `formatPctPtBr(value: number, decimals = 1): string` — `43,8` (sem `%`; a unidade fica no JSX para permitir tipografia diferente).

**Criar `apps/web/src/features/project-tracking/lib/compute.spec.ts`** com testes Vitest cobrindo BR-67, BR-68, BR-73 com fixtures pequenas (3-4 projetos sintéticos).

**Risco:** `atob` no `decodeWeekFlags` pode receber base64 mal formado. **Mitigação:** try/catch retornando array de `false`, alinhado ao componente atual `project-week-strip.tsx`.

---

## Fase 3 — Hook de filtros (`useDashboardFilters`)

**Objetivo:** state machine única para Status × Mês × Semana × cross-filter.

**Criar `apps/web/src/features/project-tracking/hooks/use-dashboard-filters.ts`** com a interface:

```ts
useDashboardFilters({
  initialWeek: number,
  weeksInYear: number,
  referenceYear: number,
}): {
  selectedStatuses: Set<ProjectStatus>;
  weekN: number;
  monthIndex: number;       // 0–11, derivado de weekN via date-fns
  donutFocus: ProjectStatus | null;
  setStatuses: (next: Set<ProjectStatus>) => void;
  toggleStatus: (s: ProjectStatus) => void;     // respeita BR mínimo 1
  setWeek: (w: number) => void;                 // ajusta monthIndex
  setMonth: (m: number) => void;                // ajusta weekN para última semana ISO do mês
  setDonutFocus: (s: ProjectStatus | null) => void;
}
```

**Lógica:**
- `setMonth(m)` → calcula a última ISO week do mês `m` no ano `referenceYear` via util `lib/iso-week.ts` (frontend), com cap em `weeksInYear`. Para o mês corrente, faz cap também em `initialWeek` (não permite escolher futuro).
- `setWeek(w)` → atualiza weekN e recalcula `monthIndex` a partir do `weekStart`.
- `useEffect` zera `donutFocus` quando ele sai de `selectedStatuses` (BR-72).
- `toggleStatus(s)` rejeita o toggle se sobrar 0 selecionados (BR mínimo 1).

**Criar `apps/web/src/features/project-tracking/lib/iso-week.ts`** com helpers client-side:
- `weeksInYear(year): number` (usa `date-fns` `getISOWeeksInYear` ou cálculo via 28 dec).
- `lastIsoWeekOfMonth(year, monthIndex): number`.
- `monthIndexOfIsoWeek(year, weekN): number`.

---

## Fase 4 — Componentes SVG primitivos

**Objetivo:** isolar os 4 charts em componentes puros, sem lógica de negócio.

**Criar sob `apps/web/src/features/project-tracking/components/hydro/`:**

1. **`bullet-kpi.tsx`** — props: `label`, `hint`, `value (0–100)`, `target = 85`, `flagLabel`, `flagVariant: 'success' | 'warning'`. Renderiza o cabeçalho + número grande Ivar Display + bullet em SVG (trilho com 3 faixas, barra de valor, marcador de target, escala 0/50/100). Locale pt-BR (vírgula).
2. **`status-donut.tsx`** — props: `segments: Array<{ status, count, color }>`, `total`, `focus: status | null`, `onFocus(s)`, `onHover(s)`. Renderiza SVG 160×160 com `<circle>` rotacionado -90° usando `stroke-dasharray`/`stroke-dashoffset`. Centro mostra total ou contagem do foco. Hover engrossa em +5px e baixa opacidade dos outros para 0.5. Click toca `onFocus`.
3. **`donut-legend.tsx`** — props: mesmas + `onItemClick`, `onItemHover`. Lista vertical com dot quadrado + nome + contagem + `formatPctPtBr(pct, 1) + '%'`.
4. **`manager-bars.tsx`** — props: `rows: Array<{ pm, percent }>`. Renderiza SVG com barras verticais teal, valores acima, nomes abaixo (até 2 linhas), eixo Y 100/50/0%, gridlines.
5. **`weekly-bars.tsx`** — props: `weeklyPercents: number[]`, `selectedWeek`, `monthAxis: Array<{ label, span }>`. Renderiza barras (selected em `--teal-bright`, demais cinza), linha de alvo tracejada, eixo Y, rótulos adaptativos, faixa de meses. Tooltip via `<title>` em cada `<rect>`.
6. **`status-pill.tsx`** — props: `status`, `size = 'sm' | 'md'`. Pill arredondado com dot + nome na cor do status.
7. **`progress-mini.tsx`** — props: `percent: number`. Track 78×6px + fill teal.
8. **`status-multi-select.tsx`** — popover customizado. Usa `@radix-ui/react-popover` (já instalado) para a base mas estiliza com os tokens Hydro. Implementa toda a UX de US-09.1a, incluindo regra de mínimo 1.

Cada componente recebe **apenas dados já calculados** — nenhuma chamada a `compute.ts` aqui.

---

## Fase 5 — Página `dashboard-page.tsx` (reescrita)

**Objetivo:** orquestrar tudo no layout descrito em US-09 § "Layout da tela".

**Reescrever `apps/web/src/features/project-tracking/pages/dashboard-page.tsx`**:

```tsx
// Estrutura sketch (não é o código final, é o desenho).
const data = useDashboard();           // hook existente, retorna DashboardResponseDto
const filters = useDashboardFilters({ ... });
const visibleProjects = useMemo(
  () => data.projects.filter(p => filters.selectedStatuses.has(p.projectStatus)),
  [data.projects, filters.selectedStatuses],
);
const tableProjects = useMemo(
  () => filters.donutFocus
    ? visibleProjects.filter(p => p.projectStatus === filters.donutFocus)
    : visibleProjects,
  [visibleProjects, filters.donutFocus],
);

// useEffect aplica theme-hydro
useEffect(() => {
  document.documentElement.classList.add('theme-hydro');
  return () => document.documentElement.classList.remove('theme-hydro');
}, []);
```

**Layout:**
- `<TopBar>` (componente local com botão voltar, título, filtros, logo).
- Grid principal: linha 1 (2fr/1.25fr) com `<BulletKpiPanel>` e `<DonutPanel>`; linha 2 (1fr/1.3fr) com `<ManagerPanel>` e `<WeeklyPanel>`; linha 3 full-width com `<DetailTablePanel>`.
- Empty state quando `!data.hasActiveImport` (BR-78): grid colapsa e mostra single card com CTA "Importar planilha" (admin), reaproveitando `ImportDialog` da US-08.1.

**Não reaproveitar** nenhum componente legado de `apps/web/src/features/project-tracking/components/` exceto `import-dialog.tsx` (US-08.1).

---

## Fase 6 — Tabela detalhada (`project-detail-table.tsx`)

**Objetivo:** sortable, com cross-filter chip e total no `tfoot`.

**Criar `apps/web/src/features/project-tracking/components/hydro/project-detail-table.tsx`** com:
- Props: `projects: ProjectRowDto[]`, `weekN: number`, `donutFocus: ProjectStatus | null`, `onClearDonutFocus()`.
- Estado local: `sortBy: 'name' | 'status' | 'sentThisWeek' | 'cumulative'`, `sortDir: 'asc' | 'desc'`.
- Ordenação:
  - `status`: ordem canônica (Ativo → Concluído → On hold → A iniciar → Cancelado), depois nome.
  - `sentThisWeek`: true antes (asc) ou depois (desc); desempate por nome.
  - `cumulative`: numérico; desempate por nome.
  - `name`: `localeCompare(other, 'pt')`.
- `tfoot` com `td.colSpan` corretos para colunas 1-3 e o total da média de % acumulado na coluna 4 (mesmo cálculo do KPI Acumulado anual mas sobre `projects` desta tabela, **sem** BR-68 — usa o cumulative real de cada linha, já que a tabela exibe valores reais).
- `aria-sort` na `<th>` para acessibilidade.

---

## Fase 7 — i18n

**Modificar `apps/web/src/i18n/locales/pt-BR.ts`** adicionando namespace `dashboard.*`:

```ts
dashboard: {
  title: 'Status Report',
  subtitle: 'VISÃO GERAL DO PORTFÓLIO',
  back: 'Voltar',
  filters: {
    status: 'STATUS DO PROJETO',
    month: 'MÊS',
    week: 'SEMANA',
    selectAll: 'Selecionar todos',
    clearAll: 'Limpar seleção',
    allLabel: 'Todos',
    partialLabel: '{{n}} de 5',
  },
  status: { ACTIVE: 'Ativo', ON_HOLD: 'On hold', COMPLETED: 'Concluído', CANCELLED: 'Cancelado', NOT_STARTED: 'A iniciar' },
  months: { 0: 'Janeiro', 1: 'Fevereiro', ..., 11: 'Dezembro' },
  monthsShort: { 0: 'Jan', 1: 'Fev', ..., 11: 'Dez' },
  kpis: {
    panelTitle: 'KPIS GERAIS DE ENVIO',
    acumuladoAnualLabel: 'ACUMULADO ANUAL',
    acumuladoAnualHint: 'média do portfólio',
    semanaCorrenteLabel: 'ENVIO DA SEMANA CORRENTE',
    semanaCorrenteHint: 'semana {{w}}',
    target: 'TARGET',
    onTarget: 'no alvo',
    belowTarget: '{{pp}} p.p. abaixo',
  },
  donut: { panelTitle: 'QTD DE PROJETOS POR STATUS', centerLabel: 'PROJETOS' },
  manager: { panelTitle: 'ENVIO DE STATUS POR GERENTE', subtitle: 'média % acumulada', noPm: 'Sem PM atribuído' },
  weekly: {
    panelTitle: 'ENVIO DE STATUS SEMANAL',
    subtitle: 'início do ano até a semana {{w}}',
    targetLabel: 'alvo 85%',
    tooltip: 'Semana {{w}} ({{month}}): {{pct}}%',
  },
  table: {
    panelTitle: 'DETALHAMENTO POR PROJETO',
    subtitleN: '{{n}} projetos',
    subtitleFiltered: 'filtrado por {{chip}} · {{shown}} de {{total}}',
    col: { project: 'Projeto', status: 'Status', sentThisWeek: 'Enviado na semana corrente', cumulative: 'Acumulado % de envios semanais' },
    sent: 'Sim',
    notSent: 'Não',
    total: 'Total',
  },
  empty: { title: 'Nenhum import ativo para {{year}}', adminCta: 'Importar planilha', userHint: 'Solicite a um administrador que faça o import da planilha.' },
}
```

E o equivalente em `en.ts` (tradução direta).

---

## Fase 8 — Roteamento + sidebar

**Modificar `apps/web/src/app/App.tsx`:** sem mudanças — a rota `/dashboard` já existe; só o componente que ela renderiza muda (mesmo path).

**Modificar `apps/web/src/app/layout/sidebar.tsx`:**
- O grupo "Project Tracking" já tem `Dashboard` apontando para `/dashboard` — mantém.
- **Não aplicar `theme-hydro` na sidebar** — ela permanece no tema padrão; visualmente fica como "shell escuro" envolvendo o conteúdo escuro do `/dashboard`. Validar contraste visual com o protótipo; se ficar feio, na hora da implementação considerar esconder a sidebar em `/dashboard` (decisão a ser tomada quando os assets entrarem).

**Risco:** o `AdminLayout` aplica o tema light do shadcn, gerando "duas tonalidades" feias quando o usuário está no `/dashboard`. **Mitigação:** o `useEffect` da `DashboardPage` aplica `theme-hydro` no `documentElement`, fazendo cascata pra sidebar também. Avaliar a estética e ajustar — talvez o sidebar precise de um wrapper que neutralize a classe.

---

## Fase 9 — Limpeza do dashboard legado

**Remover** os componentes legados de US-08.3/.4 que não são mais usados:
- `apps/web/src/features/project-tracking/components/kpi-cards.tsx`
- `current-week-kpi.tsx`
- `freshness-badge.tsx`
- `weekly-bar-chart.tsx`
- `project-table.tsx`
- `project-week-strip.tsx`
- `project-detail-drawer.tsx`

**Manter:** `import-dialog.tsx`, `import-preview-report.tsx`, e tudo em `hooks/` e `pages/import-history-page.tsx`.

**Validar com `grep`:** `grep -r "current-week-kpi\|kpi-cards\|weekly-bar-chart" apps/web/src` não retorna nada após a limpeza.

**Verificar `package.json`:** remover `recharts` das `dependencies` se ele não tiver outros consumidores. (Confirmar primeiro com `grep -r "from 'recharts'" apps/web/src`.)

---

## Fase 10 — Testes

**Vitest unit tests** (`apps/web/src/features/project-tracking/lib/compute.spec.ts`):
- `decodeWeekFlags` com base64 conhecido produz array correto.
- `cumulativeWeeksSent` em fixtures.
- `cumulativePercent` aplica BR-68 (status ≠ ACTIVE devolve 0 quando chamado pelo cálculo de médias; devolve real na variante de tabela).
- `kpiAcumuladoAnual` em portfólio sintético com mix de status.
- `kpiSemanaCorrente` com bits específicos.
- `byManager` ordena desc, filtra zero, agrupa "Sem PM atribuído".
- `weeklyPercents` produz array do tamanho certo com valores 0–100.

**Component tests** (Vitest + React Testing Library):
- `status-multi-select.test.tsx`: abre/fecha popover, toggle respeita mínimo 1, "Selecionar todos" / "Limpar seleção" alternam.
- `bullet-kpi.test.tsx`: renderiza flag "no alvo" quando value ≥ 85, "X p.p. abaixo" quando < 85, com X correto.
- `status-donut.test.tsx`: hover engrossa segmento; click chama `onFocus` com o status; click novamente desfaz.
- `project-detail-table.test.tsx`: ordenação asc/desc funciona; chip de cross-filter limpa ao clicar; `tfoot` mostra média correta.

**Smoke test E2E manual** (no PR — adicionar checklist no body):
1. Login como admin → `/dashboard` carrega no tema escuro.
2. Importar planilha — verificar que ao confirmar o dashboard reflete novos dados.
3. Toggle "Concluído" no multi-select — KPIs e donut atualizam, gerente recalcula, tabela some os concluídos.
4. Click num segmento do donut — só a tabela filtra; KPIs/gerente/semanal **não** mudam (BR-72).
5. Trocar mês para "Jan" — semana vai para 4 (ou 5); subtítulo do gráfico semanal fica "início do ano até a semana N".
6. Trocar semana para 52 — todos os painéis recalculam para o cenário "ano fechado".
7. Cabeçalho da tabela: clicar em "Acumulado %" ordena asc; novo clique inverte.

---

## Verificação end-to-end

**Pré-deploy:**
- `pnpm build` no monorepo (api + web + shared) → 0 erros TS.
- `pnpm test` → suite verde (os 35 novos testes da US-08 continuam passando, novos testes da US-09 verdes).
- `grep` confirma ausência de imports legados.

**Staging (com assets já entregues):**
- Abrir `/dashboard` num iPad-portrait, Mac retina, e tela 1440×900 — confirmar layout 2/1.25 e responsivo abaixo de 960px.
- Confirmar tipografia Ivar Display nos números grandes (visual idêntico a `screenshots/v5.png`).
- Lighthouse: contraste AAA mantido, sem warnings críticos.

**Rollback:**
- O PR só modifica `apps/web/`. Reverter o commit do PR restaura o dashboard US-08.3 — sem migração de banco a desfazer, sem mudança de API.

---

## Critical files

- `apps/web/src/styles/hydro-theme.css` (novo)
- `apps/web/src/features/project-tracking/lib/compute.ts` (novo)
- `apps/web/src/features/project-tracking/lib/iso-week.ts` (novo)
- `apps/web/src/features/project-tracking/hooks/use-dashboard-filters.ts` (novo)
- `apps/web/src/features/project-tracking/components/hydro/` — bullet-kpi, status-donut, donut-legend, manager-bars, weekly-bars, status-multi-select, status-pill, progress-mini, project-detail-table (todos novos)
- `apps/web/src/features/project-tracking/pages/dashboard-page.tsx` (reescrito)
- `apps/web/src/i18n/locales/pt-BR.ts` (namespace `dashboard.*` adicionado, `projectTracking.dashboard.*` antigos removidos)
- `apps/web/src/i18n/locales/en.ts` (idem)
- `apps/web/public/brand/.gitkeep` (placeholder enquanto assets não chegam)

## Reused utilities

- `apps/web/src/services/project-tracking.service.ts` (`getDashboard(year)`) — sem mudança.
- `apps/web/src/features/project-tracking/hooks/use-dashboard.ts` — sem mudança.
- `apps/web/src/features/project-tracking/components/import-dialog.tsx` — chamado pelo empty state e pelo botão "Importar agora" (caso decida-se manter).
- `@radix-ui/react-popover` — base do multi-select.
- `date-fns` (já instalado) — `getISOWeek`, `getISOWeekYear`, `setISOWeek`, `lastDayOfMonth`, `getMonth` no `iso-week.ts` do frontend.

## Lista de risk items consolidada

| Risco | Mitigação |
|---|---|
| Assets Hydro atrasam | Mergear com fallbacks documentados + tarefa de follow-up para trocar quando chegarem. |
| Tema escuro contagia a sidebar e cria contraste estranho | Ajustar wrapper da sidebar para forçar tema light, ou esconder sidebar em `/dashboard`. Decisão visual no momento da implementação. |
| Bundle cresce com SVG inline complexo | SVGs são pequenos (< 5KB cada). Sem preocupação real; ganho ao remover `recharts` (~70KB gzip) compensa. |
| `theme-hydro` esquecido em outras rotas após `useEffect` cleanup falhar | Implementar via componente wrapper `<HydroThemeScope>` que aplica e remove na unmount, em vez de `useEffect` direto na page. |
| Decimal pt-BR esquecido em algum lugar | Centralizar formatação em `formatPctPtBr` no `compute.ts` e proibir `(value * 100).toFixed(...) + '%'` literal em revisão. |
