# US-09 — Dashboard Status Report (visual Hydro)

## Context

O Dashboard introduzido em US-08.3/.4 cobriu o fluxo de dados (KPIs portfólio, gráfico semanal, tabela com timeline) mas com um visual genérico do design system padrão (shadcn + light theme). O cliente Hydro forneceu um protótipo dirigido pelo manual de marca — dark theme, tipografia Ivar Display, donut interativo com cross-filter, bullet charts com target 85%, gráfico por gerente, faixa de meses no gráfico semanal e tabela com mini-barras de progresso.

Esta US **substitui integralmente as seções US-08.3 (Dashboard) e US-08.4 (Project detail view)** da User Story anterior. As demais seções (US-08.1 upload, US-08.2 histórico, US-08.5 restore/delete) continuam vigentes — o pipeline de dados (ProjectImport + ProjectSnapshot snapshot semanal) é a fonte que alimenta este dashboard.

**Decisões alinhadas com o usuário:**
- O filtro **Mês é um atalho para a Semana**: trocar o mês seleciona automaticamente a última semana ISO daquele mês; trocar a semana sincroniza o mês correspondente. Ambos editam o mesmo "corte W".
- Os assets (fontes Ivar Display/Text, logo Hydro, protótipo HTML/React, screenshots) serão entregues em PR separado. A implementação pode ser feita em paralelo com fallbacks documentados (serif do sistema + placeholder de logo), mas o merge final está bloqueado até os assets entrarem em `apps/web/public/brand/`.

Intended outcome: o `/dashboard` passa a ser uma única tela densa, com identidade Hydro, que permite a um gestor de portfólio entender em < 5 segundos quem está dentro/fora da meta de envio semanal de status — sem precisar abrir uma planilha.

### Pré-requisito — assets de marca

| Asset | Path esperado no repo | Quem entrega |
|---|---|---|
| `IvarDisplayHydro-Regular.ttf` | `apps/web/public/brand/fonts/` | Cliente (PR separado) |
| `IvarTextHydro-Regular.ttf` / `-Bold.ttf` | `apps/web/public/brand/fonts/` | Cliente (PR separado) |
| `hydro_logo_negative.png` | `apps/web/public/brand/` | Cliente (PR separado) |
| `hydro_logo_blue.png` | `apps/web/public/brand/` | Cliente (PR separado) |
| Protótipo (`Status Report.html`, `app.jsx`, `charts.jsx`, `data.js`) | `docs/specs/prototype/` | Cliente (referência) |
| Screenshots (`v5.png`, `ms-open.png`, `centered.png`) | `docs/specs/screenshots/` | Cliente (referência visual obrigatória) |

Enquanto os assets não estão no repo: usar `Crimson Pro` (ou Georgia) como stand-in da Ivar Display; substituir o logo por um caption text "HYDRO". O merge final exige os arquivos definitivos.

---

## Identidade visual

### Design tokens (CSS custom properties)

Tokens vivem em `apps/web/src/styles/hydro-theme.css` e são aplicados via uma classe `.theme-hydro` no `<html>` (a página `/dashboard` aplica essa classe ao montar).

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#1b2027` | Fundo geral |
| `--panel` | `#252b34` | Fundo dos painéis e controles |
| `--panel-h` | `#2c333d` | Header de painel, popovers |
| `--line` | `#39414c` | Bordas, divisores |
| `--ink` | `#eceae4` | Texto principal (off-white quente) |
| `--ink-dim` | `#9aa3ad` | Texto secundário |
| `--ink-faint` | `#6b7480` | Texto terciário, eixo |
| `--teal` | `#4f9c92` | Acento primário, status ACTIVE, barras |
| `--teal-bright` | `#62b3a8` | Hover, fills, totais |
| `--taupe` | `#c5b9ac` | Acento neutro quente, status COMPLETED, alvo |
| `--status-on-hold` | `#9a6b80` | Derivado do Hydro Purple |
| `--status-not-started` | `#cf6a55` | Derivado do Hydro Bauxite |
| `--status-cancelled` | `#7a828c` | Cinza neutro |

Fundo do body: `radial-gradient(1200px 600px at 80% -10%, #2a323d 0%, transparent 60%)` sobre `--bg`.

### Tipografia

| Família | Uso |
|---|---|
| **Ivar Display** (serif 400) | Título "Status Report" (34px), números grandes de KPI (64px), número central do donut (34px) |
| **Ivar Text** (serif 400/700) | Disponível para textos editoriais futuros |
| **Helvetica Neue / Arial** (sans) | Labels, tabela, filtros, eixos — todo o resto |

Convenções:
- Títulos de painel: 13px, peso 600, uppercase, `letter-spacing: .09em`.
- Subtítulo do header: 13px, uppercase, `letter-spacing: .14em`, cor `--ink-dim`.
- Labels de filtro: 11px, uppercase, `letter-spacing: .1em`, cor `--ink-faint`.
- Cabeçalhos da tabela: 11px, peso 600, uppercase, `letter-spacing: .07em`.
- Números: `font-variant-numeric: tabular-nums` em toda a UI.
- Decimais em pt-BR (vírgula): ex. `43,8%`.

### Formas / espaçamento / elevação

- Container: `max-width: 1440px`, padding `26px 30px 48px`, gap vertical `18px`.
- Painéis: `border-radius: 12px`, borda 1px `--line`, header com fundo `--panel-h` e borda inferior. Body padding `20px 18px`.
- Controles (selects/botões): `border-radius: 7px`, padding `9px 13px`, fonte 14px, `min-width: 138px`; hover/focus → borda `--teal-bright`.
- Pills de status: `border-radius: 999px`, padding `4px 11px`, borda 1px na cor com alpha `66`, fundo na cor com alpha `1f`, dot de 7px.
- Popover do multi-select: `border-radius: 9px`, sombra `0 14px 40px rgba(0,0,0,.45)`.
- Transições suaves `.12s–.3s` em hover, larguras e opacidades.

---

## US-09.1 — Topbar (título, filtros globais e logo)

**Como** gestor de portfólio,
**Quero** uma barra superior fixa com os filtros do dashboard,
**Para que** eu controle o recorte de Status, Mês e Semana sem rolar a tela.

### Acceptance Criteria

- [ ] No topo da rota `/dashboard` há uma topbar com:
  - **Botão circular "voltar"** (42px, borda `--line`, ícone chevron-left, `aria-label="Voltar"`). Hover muda a borda para `--teal-bright`.
  - **Título** "Status Report" em Ivar Display 34px + subtítulo "VISÃO GERAL DO PORTFÓLIO" (13px, uppercase, `letter-spacing: .14em`, cor `--ink-dim`).
  - Três filtros à direita, cada um com label uppercase 11px acima do controle:
    1. **Status do projeto** — multi-select customizado (US-09.1a abaixo).
    2. **Mês** — select com opções "Janeiro" … "Dezembro".
    3. **Semana** — select com opções "semana 1" … "semana 53" (53 quando o ano referência tem 53 semanas ISO; ver BR-57 da US-08).
  - **Logo Hydro** (versão negativa, `apps/web/public/brand/hydro_logo_negative.png`, altura 50px, opacidade 0.95) no canto direito.
- [ ] Filtro **Mês ↔ Semana** sincronizados: ao escolher um mês, a Semana vai para a última semana ISO desse mês; ao escolher uma semana, o Mês reflete o mês da `weekStart`.
- [ ] Default na primeira renderização: `Status = todos`, `Semana = currentISOWeek` (efetiva via `IsoWeekService.effectiveCurrentWeek(year)`), `Mês = mês de currentISOWeek`.
- [ ] Mudança em qualquer filtro recalcula imediatamente todos os painéis (KPIs, donut, gerente, semanal, tabela).

### US-09.1a — Multi-select de Status (popover customizado)

- [ ] O botão exibe **"Todos"** quando os 5 status estão marcados; **"N de 5"** caso parcial (ex.: "3 de 5"). Chevron à direita.
- [ ] Click abre popover alinhado à direita com:
  - Linha de ação: "Selecionar todos" (quando há item desmarcado) ou "Limpar seleção" (quando todos marcados).
  - Divisor.
  - Uma linha por status, na ordem canônica: **Ativo, Concluído, On hold, A iniciar, Cancelado**. Cada linha contém:
    - Checkbox quadrado 17×17px, `border-radius: 5px`. Marcado = preenchido com a cor do status; check (`✓`) na cor `#1b2027`. Desmarcado = borda `--line`.
    - Dot quadrado 9×9px (`border-radius: 3px`) na cor do status.
    - Nome do status.
- [ ] **Mínimo 1 status selecionado**: a opção do último marcado fica desabilitada (não permite zerar).
- [ ] Popover fecha ao clicar fora ou pressionar `Esc`.
- [ ] Operável por teclado (Tab nas linhas, Space alterna, Esc fecha).
- [ ] A seleção do multi-select é o **filtro global** — recalcula KPIs, donut, gerente, semanal e tabela.

---

## US-09.2 — Painel "KPIs gerais de envio" (bullet charts)

**Como** gestor,
**Quero** ver os 2 KPIs de envio (acumulado anual e semana corrente) com indicação visual de meta,
**Para** identificar em uma piscada se estou no alvo de 85%.

### Acceptance Criteria

- [ ] Card "KPIs GERAIS DE ENVIO" ocupa a coluna esquerda (largura `2fr` do grid 2fr/1.25fr).
- [ ] Dois KPIs em grid 2 colunas, gap 36px, ambos com acento `#62b3a8`:
  1. **Acumulado anual** — hint "média do portfólio". Valor = média do `% acumulado` dos projetos visíveis (BR-50).
  2. **Envio da semana corrente** — hint "semana N" (N = semana selecionada). Valor = `(projetos visíveis que enviaram na semana N) / (total visível) × 100`, em %.
- [ ] Anatomia de cada KPI:
  - Topo (flex row): label "ACUMULADO ANUAL" / "ENVIO DA SEMANA CORRENTE" (15px, 600) + hint (12px, `--ink-faint`) à esquerda; à direita o target ("85%" em taupe, 16px) + caption "TARGET" (10px uppercase).
  - Número grande em Ivar Display 64px + unidade `%` 30px em teal `--teal-bright`. Vírgula como separador decimal (`43,8`).
  - **Flag pill** à direita do número:
    - Se valor ≥ 85%: texto "no alvo", fundo `rgba(98,179,168,.14)`, borda `1px rgba(98,179,168,.4)`, texto teal `--teal-bright`.
    - Caso contrário: texto "X p.p. abaixo" (X = `round(85 − valor)` em pontos percentuais), fundo `rgba(197,185,172,.12)`, borda taupe com alpha, texto taupe.
  - **Bullet chart** (16px de altura):
    - Trilho com 3 faixas de cinza: 0–50% (`#2c333d`), 50–85% (`#323a44`), 85–100% (`#394250`).
    - Barra de valor 7px, centrada verticalmente, com gradiente horizontal do acento (55% → 100% de opacidade), largura = valor%.
    - Marcador de target = traço vertical branco 3px de largura, 22px de altura, posição `left: 85%`.
    - Escala inferior: `0 / 50 / 100%` (10px, `--ink-faint`).
- [ ] **Locale pt-BR** para os valores numéricos (vírgula decimal).

---

## US-09.3 — Painel "Qtd de projetos por status" (donut interativo)

### Acceptance Criteria

- [ ] Card "QTD DE PROJETOS POR STATUS" ocupa a coluna direita da linha 1 (`1.25fr`).
- [ ] Donut renderizado em **SVG puro**, viewBox 160×160, raio 62, espessura 22. Segmentos iniciam no topo (rotação `-90°`). Um segmento por status que tem projetos visíveis, na cor do status, sem gap. Implementação via `stroke-dasharray` / `stroke-dashoffset` em `<circle>`.
- [ ] **Centro do donut**:
  - Padrão: total de projetos visíveis (Ivar Display 34px) + caption "PROJETOS" (10px uppercase).
  - Em foco (hover em segmento/legenda): contagem do status (Ivar Display 34px na cor do status) + nome do status em uppercase (10px na cor do status).
- [ ] **Legenda à direita** (lista vertical), uma linha por status com:
  - Dot quadrado 11×11px (`border-radius: 3px`) na cor do status.
  - Nome do status (13px).
  - Quantidade (13px, peso 600, tabular-nums).
  - Percentual com 1 casa decimal e vírgula (ex.: `43,8%`), em `--ink-dim` 12px.
- [ ] **Interações**:
  - **Hover** em segmento ou item da legenda: o segmento engrossa em +5px de stroke; os demais reduzem opacidade para 0.5.
  - **Click** em segmento ou legenda: define o status como **foco da tabela** (cross-filter local — ver US-09.6). Demais segmentos ficam com opacidade 0.32; o item da legenda em foco recebe fundo `cor + '24'`. Click novamente no mesmo status remove o foco.
  - Se o status em foco sair da seleção global do multi-select, o foco é limpo automaticamente.
- [ ] Operável por teclado: Tab navega pelos itens da legenda; Enter/Space ativa/desativa o foco.

---

## US-09.4 — Painel "Envio de status por gerente"

### Acceptance Criteria

- [ ] Card "ENVIO DE STATUS POR GERENTE" na linha 2 (coluna esquerda, `1fr`).
- [ ] Subtítulo: "média % acumulada".
- [ ] Altura do corpo: 248px.
- [ ] **Uma barra vertical por PM** (Project Manager), em teal `--teal` `#4f9c92`. Largura máxima 56px, `border-radius: 4px 4px 0 0`.
- [ ] Barras ordenadas **decrescente** por valor.
- [ ] PMs com média 0% são **omitidos**.
- [ ] Valor da barra (% acumulado médio dos projetos do PM, considerando o filtro global) renderizado acima de cada barra, 13px peso 600.
- [ ] Nome do PM abaixo da barra (12px, `--ink-dim`, até 2 linhas, `text-overflow: ellipsis` na segunda).
- [ ] Eixo Y com 3 ticks (`100% / 50% / 0%`) e gridlines horizontais sutis (`#333b45`, opacidade 0.6).
- [ ] Implementação em SVG puro (mesma estética dos outros painéis).

---

## US-09.5 — Painel "Envio de status semanal"

### Acceptance Criteria

- [ ] Card "ENVIO DE STATUS SEMANAL" na linha 2 (coluna direita, `1.3fr`).
- [ ] Subtítulo dinâmico: "início do ano até a semana N" (N = semana selecionada).
- [ ] Altura do corpo: 248px.
- [ ] **Uma barra por semana**, de 1 até N (semana selecionada inclusiva). Valor = `% de projetos visíveis que enviaram na semana w`.
- [ ] **Semana N (selecionada)**: barra em `--teal-bright` `#62b3a8` com o valor exibido acima.
- [ ] Demais barras em cinza `#5a636e`.
- [ ] **Linha de alvo** tracejada (`stroke-dasharray="4 4"`) na cor taupe, na altura de 85%, com rótulo "alvo 85%" à direita.
- [ ] Eixo Y `100% / 50% / 0%` + gridlines.
- [ ] **Rótulos de semana** abaixo das barras com passo adaptativo:
  - ≤16 barras: todas as semanas.
  - ≤26: a cada 2.
  - ≤40: a cada 4.
  - >40: a cada 5.
  - A semana selecionada **sempre** exibe rótulo, em destaque (branco, peso bold).
- [ ] **Faixa de meses** abaixo dos rótulos: agrupa semanas consecutivas por mês (Jan, Fev, …) com divisores verticais entre grupos.
- [ ] Largura/gap das barras adaptativos à quantidade: `gap 4 → 2 → 1px`; largura máxima 30 → 18px conforme N cresce.
- [ ] Tooltip nativo (`title` no SVG `<rect>`): "Semana w (Mês): X%".

---

## US-09.6 — Painel "Detalhamento por projeto" (tabela)

### Acceptance Criteria

- [ ] Card "DETALHAMENTO POR PROJETO" ocupa a faixa inferior full-width.
- [ ] Subtítulo:
  - Sem cross-filter ativo: "N projetos" (N = total visível).
  - Com foco vindo do donut (US-09.3): "filtrado por **[chip do status]** · X de N", onde o chip é um pill clicável (dot + nome + "✕") que limpa o filtro quando clicado.
- [ ] Colunas, **todas ordenáveis**:
  1. **Projeto** (alinhamento esquerda) — nome do projeto.
  2. **Status** (esquerda) — pill colorido (mesma definição do multi-select, mas só leitura).
  3. **Enviado na semana corrente** (centro) — badge:
     - `● Sim` em teal `--teal-bright`, peso 600 quando o projeto tem `ok` na semana N.
     - `● Não` em cinza `#8b939d` caso contrário.
  4. **Acumulado % de envios semanais** (alinhamento direita) — mini barra de progresso (track 78×6px `#353d47`, fill teal `--teal-bright`) + valor numérico ao lado (`43,8%`).
- [ ] **Cabeçalhos clicáveis**: alterna asc/desc. Indicador visual:
  - Inativo: `↕` em `--ink-faint`.
  - Ativo: `▲` ou `▼` em teal.
- [ ] **Desempate**: sempre por nome do projeto, `localeCompare(other, 'pt')`.
- [ ] Ordenação de **Status** segue ordem canônica: Ativo → Concluído → On hold → A iniciar → Cancelado.
- [ ] Hover na linha: fundo `#2b323c`.
- [ ] Bordas inferiores `#2e353f`; padding `12px 14px` por célula.
- [ ] **Rodapé (`tfoot`)**: linha "Total" com borda superior 2px, exibindo na coluna de Acumulado a **média** do % acumulado dos projetos listados, em teal bold.
- [ ] **Não há paginação nem virtualização** — a planilha tem ~50 projetos por ano, cabem em uma tela.

---

## Regras de negócio

> Os snapshots, weekFlags, e enum de status seguem o que foi estabelecido em US-08 (BR-50 a BR-57). As regras abaixo são adicionais e governam apenas a renderização do dashboard.

- **BR-66 — Target institucional fixo:** o target dos bullet charts é a constante `85`. Não é configurável nesta US.
- **BR-67 — % acumulado por projeto (denominador = W):** `% acumulado(projeto, W) = popcount(weekFlags[1..W]) / W × 100`, onde W é a semana selecionada (1..53). Note que o denominador **não** é mais `weeksExpected` como em US-08 — é a semana selecionada, comum a todos os projetos. Decimais com 1 casa em pt-BR.
- **BR-68 — Projetos não-ACTIVE têm % acumulado tratado como 0** nos cálculos do KPI "Acumulado anual" e do painel "Por gerente". Esses projetos continuam visíveis na tabela com `% acumulado` real calculado por BR-67.
- **BR-69 — KPI Acumulado anual:** média aritmética dos `% acumulado(projeto, W)` dos projetos visíveis (apenas ACTIVE contam — BR-68). Visíveis = passados pelo multi-select de status.
- **BR-70 — KPI Envio da semana corrente:** `(nº de projetos visíveis com bit W setado) / (nº de projetos visíveis) × 100`. Visíveis = passados pelo multi-select.
- **BR-71 — Donut:** contagem por status dos projetos do conjunto pré-filtrado pelo **multi-select** (o donut nunca filtra por si mesmo, é só insumo).
- **BR-72 — Cross-filter do donut:** clicar num segmento define um foco local que filtra **somente a tabela** (US-09.6). KPIs, donut e os dois gráficos de barras permanecem inalterados. O foco é único (um status por vez) e é limpo se o status em foco sair da seleção global.
- **BR-73 — Por gerente:** agrupa projetos visíveis pelo campo `pm`. Para cada PM, calcula a média dos `% acumulado` (com BR-68). PMs com média 0% são omitidos da renderização. Projetos sem PM são agrupados sob o rótulo "Sem PM atribuído" e seguem a mesma regra de omissão.
- **BR-74 — Gráfico semanal:** para cada semana w em 1..W, `% = (nº de projetos visíveis com bit w setado) / (nº de projetos visíveis) × 100`. Mesmo conjunto visível dos KPIs.
- **BR-75 — Tabela:** linha por projeto visível. Cross-filter do donut (BR-72) filtra adicionalmente.
- **BR-76 — Sincronia Mês ↔ Semana:** trocar **mês** define `W = última semana ISO daquele mês no ano referência`. Trocar **semana** define `Mês = mês da weekStart de W em America/Sao_Paulo`. Implementado via um único `useState<{ week: number, year: number }>` no topo da página; o mês é derivado.
- **BR-77 — Ano referência:** o dashboard sempre opera no **referenceYear do import ACTIVE** retornado pelo backend (`/api/project-tracking/dashboard`). Não há seletor de ano nesta tela — para mudar de ano, o usuário usa o histórico de imports (US-08.2).
- **BR-78 — Empty state:** se não há import ACTIVE no ano corrente, a topbar e o título são renderizados, mas os 4 painéis dão lugar a um único card "Nenhum import ativo para {ano}" com CTA "Importar planilha" (Admin) — equivalente ao empty state da antiga US-08.3 mas dentro do mesmo visual Hydro.

---

## Permission Matrix — Dashboard

| Ação | Administrator | User |
|---|:---:|:---:|
| Abrir o Dashboard | Y | Y |
| Usar filtros (Status, Mês, Semana) | Y | Y |
| Cross-filter do donut | Y | Y |
| Ver tabela detalhada | Y | Y |
| Abrir o import dialog (US-08.1) a partir do empty state | Y | N |

---

## Data Model

**Nenhum model novo.** O dashboard consome o mesmo endpoint `GET /api/project-tracking/dashboard?year=YYYY` introduzido em US-08, e calcula todos os indicadores client-side a partir do array `projects[]` (com `weekFlagsBase64`, `projectStatus`, `pm`) e do header (importedAt, importedByName, originalFilename).

> Nota: o campo `weeksExpected` do response continua útil para US-08.2 (histórico) e para o detail drawer caso reintroduzido — mas **não é consumido** pelo novo dashboard. A nova UI ignora os campos `weeklyBars[]`, `annualConsolidated`, `currentWeek`, `portfolio` calculados no backend para US-08 (esses cálculos passam a ser client-side). Eles podem ser deprecados futuramente, mas ficam como compat para clientes existentes (none por enquanto além desta US).

---

## Technical Notes

- **Tema:** novo arquivo `apps/web/src/styles/hydro-theme.css` define todas as custom properties listadas em "Design tokens" e um seletor `.theme-hydro` que troca o `--background`/`--foreground` para o dark. A página `/dashboard` aplica/remove `theme-hydro` em `document.documentElement` no mount/unmount via `useEffect` — assim a tela vizinha (Import history, Users) continua no tema padrão (shadcn) sem mudança visual.
- **Fontes:** declaração `@font-face` em `apps/web/src/styles/hydro-theme.css` apontando para `/brand/fonts/IvarDisplayHydro-Regular.ttf` etc. Enquanto o asset não está commitado, o `src` cai para `local("Crimson Pro"), local("Georgia")`.
- **Charts em SVG puro:** sem `recharts`. Componentes em `apps/web/src/features/project-tracking/components/hydro/`:
  - `bullet-kpi.tsx` — KPI com bullet (US-09.2)
  - `status-donut.tsx` — donut interativo (US-09.3)
  - `manager-bars.tsx` — barras verticais (US-09.4)
  - `weekly-bars.tsx` — barras semanais com faixa de meses (US-09.5)
  - `project-detail-table.tsx` — tabela (US-09.6)
  - `status-multi-select.tsx` — popover do multi-select (US-09.1a)
  - `status-pill.tsx`, `progress-mini.tsx` — primitives.
- **Filtros e estado:** um único hook `useDashboardFilters({ initialWeek, weeksInYear })` que mantém `{ selectedStatuses: Set<ProjectStatus>, weekN: number }` e expõe `setStatuses`, `setWeek`, `setMonth` (este último converte para weekN). O **foco do cross-filter** vive como state separado dentro da `DashboardPage` e é limpo via `useEffect` quando `selectedStatuses` muda.
- **Cálculos client-side:** util `apps/web/src/features/project-tracking/lib/compute.ts` exporta funções puras:
  - `decodeWeekFlags(base64): boolean[]` (53 posições)
  - `cumulativeWeeksSent(flags, weekN): number`
  - `cumulativePercent(flags, weekN, isActive): number`
  - `kpiAcumuladoAnual(projects, weekN): number`
  - `kpiSemanaCorrente(projects, weekN): number`
  - `weeklyPercents(projects, untilWeek): number[]`
  - `byManager(projects, weekN): Array<{ pm: string; percent: number; count: number }>` (ordenado desc, filtra 0)
- **i18n:** novas chaves sob `dashboard.*` em `pt-BR.ts` e `en.ts`. Como o visual é em pt-BR (decisão Hydro), os labels do EN podem ficar como traduções fiéis mas a fonte da verdade é o pt-BR.
- **Acessibilidade:**
  - `aria-label` em todos os controles (botão voltar, filtros).
  - SVG charts com `role="img"` e `aria-label` resumindo o valor.
  - Tabela usa `<table>` semântica com `<th scope="col">` ordenáveis e `aria-sort="ascending|descending|none"`.
  - Contraste: o token `--ink` (`#eceae4`) sobre `--panel` (`#252b34`) dá ~12.3:1 (AAA). Validar em CI com axe (futuro).
- **Substituição:** os componentes legados da feature `project-tracking` introduzidos em US-08.3/.4 (`kpi-cards.tsx`, `weekly-bar-chart.tsx`, `project-table.tsx`, `project-week-strip.tsx`, `current-week-kpi.tsx`, `freshness-badge.tsx`, `project-detail-drawer.tsx`) são **removidos** nesta entrega. Os hooks `use-dashboard.ts` permanecem (continuam buscando o mesmo endpoint).
- **Responsividade (BR do HU original):** abaixo de 960px o grid colapsa para 1 coluna; título do header reduz para 28px; faixa de meses do gráfico semanal mantém grupos mas oculta divisores verticais.

---

## Out of Scope

- Animação de transição entre seleções de filtro (motion fluido) — fica para iteração visual posterior.
- Modo claro (`light`) — explicitamente fora desta US; o dashboard é exclusivamente dark.
- Histórico de imports com tema Hydro — `/dashboard/imports` mantém o visual shadcn da US-08.2 nesta entrega.
- Drill-down de projeto (drawer) — descontinuado nesta US; a tabela já mostra tudo o que era exibido no drawer da US-08.4.
- Gráfico por "Responsável" (cores Radix/Júlio/Vanessa/IHM no HU original) — não há campo `responsável` consistente em todos os projetos; entra como gráfico opcional numa US futura quando o campo for normalizado.
- Export do dashboard (CSV/PDF/PNG) — fora do escopo.
- Filtro por gerente (clicar numa barra do painel de PM cross-filtra a tabela) — fora do escopo desta US, embora seja uma extensão natural do BR-72.
