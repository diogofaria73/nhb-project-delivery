# HU — Dashboard "Status Report" (Portfólio de Projetos Hydro)

## 1. História de Usuário

**Como** gestor de portfólio da Hydro,
**Quero** um dashboard de Status Report com KPIs de envio de status, distribuição de projetos por status, desempenho por gerente, evolução semanal e detalhamento por projeto,
**Para** acompanhar a aderência das equipes ao processo de envio semanal de status report e identificar rapidamente projetos e gerentes fora da meta.

**Referência visual:** protótipo funcional em HTML/React (arquivos `Status Report.html`, `app.jsx`, `charts.jsx`, `data.js`) e screenshots da pasta `screenshots/` (versão final = `v5.png`, `ms-open.png`, `centered.png`). A implementação deve reproduzir fielmente esse protótipo.

---

## 2. Identidade Visual

### 2.1 Conceito

Dashboard em **tema escuro (dark mode)**, sóbrio e corporativo, com a identidade da marca Hydro. O verde-azulado (teal) é a cor de destaque/ação; tons quentes neutros (taupe) e cores de status complementam. Visual limpo, sem ruído, com painéis em cartões de cantos arredondados sobre fundo grafite com leve gradiente radial.

### 2.2 Design Tokens (CSS Custom Properties)

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#1b2027` | Fundo geral da página |
| `--panel` | `#252b34` | Fundo dos painéis/cartões e controles |
| `--panel-h` | `#2c333d` | Fundo do cabeçalho dos painéis e popovers |
| `--line` | `#39414c` | Bordas, divisores |
| `--ink` | `#eceae4` | Texto principal (off-white quente) |
| `--ink-dim` | `#9aa3ad` | Texto secundário |
| `--ink-faint` | `#6b7480` | Texto terciário/labels de eixo |
| `--teal` | `#4f9c92` | Teal base (barras, status Ativo) |
| `--teal-bright` | `#62b3a8` | Teal de destaque (hover, fills, totais) |
| `--taupe` | `#c5b9ac` | Acento neutro quente (targets, alvo) |

**Fundo do body:** `radial-gradient(1200px 600px at 80% -10%, #2a323d 0%, transparent 60%)` sobre `--bg`.

### 2.3 Cores de Status (semântica fixa)

| Status | Hex | Observação |
|---|---|---|
| Ativo | `#4f9c92` | Teal da marca |
| Concluído | `#c5b9ac` | Taupe (Hydro Warm `#C5B9AC` da paleta secundária oficial) |
| On hold | `#9a6b80` | Derivado do Hydro Purple |
| A iniciar | `#cf6a55` | Derivado do Hydro Bauxite |
| Cancelado | `#7a828c` | Cinza neutro |

Cores auxiliares de "responsável" (caso o gráfico por responsável seja usado): Radix `#4f9c92`, Júlio `#cf6a55`, Vanessa `#9a6b80`, IHM `#c5b9ac`.

### 2.4 Paleta oficial da marca (referência — manual Hydro)

Primária: Hydro Blue `#444D55`, Hydro Light Blue `#768692`, Hydro Aluminium `#8C8C8C`, Brand Black `#000000`, Brand White `#FFFFFF`. Secundária (para gráficos): Hydro Green `#43807A`, Hydro Warm `#C5B9AC`, Hydro Purple `#4A3041`, Hydro Bauxite `#B95946`. Web: Mid Gray `#757575`, Light Gray `#F4F4F4`. As cores de status do dashboard são variações dessas cores secundárias adaptadas para contraste em fundo escuro.

### 2.5 Tipografia

| Família | Arquivo | Uso |
|---|---|---|
| **Ivar Display** (serif, regular 400) | `assets/IvarDisplayHydro-Regular.ttf` | Título principal "Status Report" (34px), números grandes de KPI (64px), número central do donut (34px) |
| **Ivar Text** (serif, 400 e 700) | `assets/IvarTextHydro-Regular.ttf`, `IvarTextHydro-Bold.ttf` | Disponível para textos editoriais (carregada via `@font-face`) |
| **Helvetica Neue / Arial** (sans) | sistema | Todo o restante da UI: labels, tabela, filtros, eixos |

Convenções tipográficas:
- Títulos de painel: 13px, weight 600, `text-transform: uppercase`, `letter-spacing: .09em`.
- Subtítulo do header: 13px, uppercase, `letter-spacing: .14em`, cor `--ink-dim`.
- Labels de filtro: 11px, uppercase, `letter-spacing: .1em`, cor `--ink-faint`.
- Cabeçalhos da tabela: 11px, weight 600, uppercase, `letter-spacing: .07em`.
- Números sempre com `font-variant-numeric: tabular-nums`.
- Decimais em pt-BR (vírgula): ex. `43,8%`.

### 2.6 Formas, espaçamento e elevação

- Container: `max-width: 1440px`, centralizado, padding `26px 30px 48px`, gap vertical entre linhas `18px`.
- Painéis: `border-radius: 12px`, borda 1px `--line`, header com fundo `--panel-h` e borda inferior; body com padding `20px 18px`.
- Controles (selects/botões): `border-radius: 7px`, padding `9px 13px`, fonte 14px, `min-width: 138px`; hover/focus muda borda para `--teal-bright`.
- Pills (status): `border-radius: 999px`, padding `4px 11px`, borda 1px na cor do status com alpha (`cor + '66'`), fundo na cor com alpha (`cor + '1f'`), dot de 7px.
- Popover do multi-select: `border-radius: 9px`, sombra `0 14px 40px rgba(0,0,0,.45)`.
- Transições suaves: `.12s–.3s` em hover, larguras de barra e opacidades.

### 2.7 Logo

Logo Hydro versão negativa (branca) `assets/hydro_logo_negative.png` no canto superior direito, altura 50px, opacidade .95. (Versão azul `hydro_logo_blue.png` disponível para fundos claros.)

---

## 3. Layout da Tela

Estrutura em 4 faixas verticais:

```
┌─────────────────────────────────────────────────────────────┐
│ TOPBAR: [← voltar] Status Report / VISÃO GERAL DO PORTFÓLIO │
│         Filtros: [Status multi-select][Mês][Semana]  [Logo] │
├──────────────────────────────────┬──────────────────────────┤
│ Linha 1 (grid 2fr / 1.25fr)      │                          │
│ KPIS GERAIS DE ENVIO             │ QTD DE PROJETOS POR      │
│ (2 KPIs bullet lado a lado)      │ STATUS (donut + legenda) │
├───────────────────────┬──────────┴──────────────────────────┤
│ Linha 2 (1fr / 1.3fr) │                                     │
│ ENVIO DE STATUS POR   │ ENVIO DE STATUS SEMANAL             │
│ GERENTE (barras vert.)│ (barras por semana + faixa de mês)  │
├───────────────────────┴─────────────────────────────────────┤
│ DETALHAMENTO POR PROJETO (tabela ordenável, full-width)     │
└─────────────────────────────────────────────────────────────┘
```

Responsivo: abaixo de 960px, as linhas 1 e 2 colapsam para 1 coluna; título reduz para 28px.

---

## 4. Componentes e Comportamento

### 4.1 Topbar

- Botão circular "voltar" (42px, borda `--line`, ícone chevron-left; hover: borda teal).
- Título "Status Report" em Ivar Display 34px + subtítulo "VISÃO GERAL DO PORTFÓLIO".
- À direita, três filtros globais com label acima:
  1. **Status do projeto** — multi-select customizado (ver 4.2).
  2. **Mês** — select nativo estilizado, opções Jan–Dez.
  3. **Semana** — select nativo, opções "semana 1" a "semana 52".
- Logo Hydro ao final.

### 4.2 Multi-select de Status

- Botão mostra resumo: "Todos" (todos selecionados), "N de 5" (parcial). Chevron à direita.
- Popover alinhado à direita com: ação "Selecionar todos / Limpar seleção", divisor, e uma opção por status com checkbox quadrado (17px, radius 5px — quando marcado, preenchido com a cor do status e check escuro `#1b2027`), dot colorido (9px, radius 3px) e o nome do status.
- Não permite zerar a seleção (mínimo 1 status).
- Fecha ao clicar fora.
- O filtro é **global**: recalcula KPIs, donut, gráficos e tabela.

### 4.3 Painel "KPIs gerais de envio" (bullet charts)

Dois KPIs lado a lado (grid 2 colunas, gap 36px), ambos com acento `#62b3a8`:

1. **Acumulado anual** (hint: "média do portfólio") — média do % acumulado dos projetos visíveis.
2. **Envio da semana corrente** (hint: "semana N") — % de projetos visíveis que enviaram status na semana selecionada.

Anatomia de cada KPI:
- Topo: label (15px, 600) + hint (12px faint) à esquerda; à direita o target (`85%` em taupe + label "TARGET" 10px uppercase).
- Número grande em Ivar Display 64px + unidade "%" 30px em teal.
- Flag pill à direita do número: "no alvo" (teal sobre `rgba(98,179,168,.14)`) se valor ≥ target; senão "X p.p. abaixo" (taupe sobre `rgba(197,185,172,.12)`).
- **Bullet chart:** trilho de 16px de altura com 3 faixas de cinza (`#2c333d` 0–50%, `#323a44` 50–85%, `#394250` 85–100%); barra de valor de 7px centrada verticalmente com gradiente horizontal do acento (55% → 100% de opacidade); marcador de target = traço vertical branco de 3px na posição 85%; escala inferior `0 / 50 / 100%`.

### 4.4 Painel "Qtd de projetos por status" (donut interativo)

- Donut SVG (viewBox 160×160, raio 62, espessura 22), segmentos na cor de cada status, iniciando no topo (rotação -90°).
- Centro: total de projetos (Ivar Display 34px) + label "PROJETOS"; quando um status está em foco, mostra a contagem e o nome desse status na sua cor.
- Legenda à direita: dot quadrado (11px radius 3) + nome + quantidade (600) + percentual com 1 casa decimal e vírgula (ex.: `43,8%`).
- **Interações:**
  - Hover em segmento ou item de legenda: segmento engrossa (+5px) e os demais reduzem opacidade para .5.
  - **Clique** em segmento/legenda: define o status como **foco da tabela** (cross-filter). Demais segmentos ficam com opacidade .32; item da legenda em foco recebe fundo `cor + '24'`. Clicar novamente remove o foco.

### 4.5 Painel "Envio de status por gerente"

- Subtítulo: "média % acumulada". Altura do corpo: 248px.
- Barras verticais em teal `#4f9c92`, uma por gerente, ordenadas decrescente, ocultando gerentes com valor 0.
- Valor (13px, 600) acima de cada barra; nome do gerente abaixo (12px, dim, até 2 linhas).
- Eixo Y com 3 ticks (`100% / 50% / 0%`) e gridlines horizontais sutis (`#333b45`, opacidade .6).
- Barras com `border-radius: 4px 4px 0 0`, largura máx. 56px.

### 4.6 Painel "Envio de status semanal"

- Subtítulo dinâmico: "início do ano até a semana N". Altura do corpo: 248px.
- Uma barra por semana, da semana 1 até a selecionada. Barra da **semana selecionada** em teal `#62b3a8` com o valor exibido acima; demais em cinza `#5a636e`.
- Linha de alvo tracejada em taupe na altura de 85% com rótulo "alvo 85%" à direita.
- Eixo Y `100/50/0%` + gridlines.
- Rótulos de semana abaixo das barras com passo adaptativo para evitar poluição (todas se ≤16; a cada 2 se ≤26; a cada 4 se ≤40; a cada 5 acima) — a semana selecionada sempre exibe o rótulo em destaque (branco, bold).
- **Faixa de meses** abaixo dos rótulos: agrupa semanas consecutivas por mês (Jan, Fev, ...) com divisores verticais entre grupos.
- Largura/gap das barras adaptativos à quantidade (gap 4 → 2 → 1px; largura máx. 30 → 18px).
- Tooltip nativo (`title`): "Semana N (Mês): X%".

### 4.7 Painel "Detalhamento por projeto" (tabela)

- Subtítulo: "N projetos"; quando há foco vindo do donut: "filtrado por [chip do status] · X de N", onde o chip é um pill clicável com dot colorido + nome + "✕" que limpa o filtro.
- Colunas (todas **ordenáveis** ao clicar no cabeçalho, com indicador ▲/▼ ativo em teal e ↕ apagado nas inativas):
  1. **Projeto** (esquerda) — nome do projeto.
  2. **Status** (esquerda) — pill colorido com dot.
  3. **Enviado na semana corrente** (centro) — badge "● Sim" (teal, 600) ou "● Não" (cinza `#8b939d`).
  4. **Acumulado % de envios semanais** (direita) — mini barra de progresso (track 78×6px `#353d47`, fill teal) + valor numérico.
- Ordenação: clique alterna asc/desc; desempate sempre por nome (locale pt). Ordenação de status segue a ordem canônica: Ativo, Concluído, On hold, A iniciar, Cancelado.
- Linhas com hover `#2b323c`; bordas inferiores `#2e353f`; padding `12px 14px`.
- **Rodapé (tfoot):** linha "Total" com borda superior 2px, exibindo a média do % acumulado em teal bold na última coluna.

---

## 5. Regras de Negócio / Modelo de Dados

Entidade **Projeto**: `nome`, `gerente`, `responsável`, `status` (Ativo | Concluído | On hold | A iniciar | Cancelado), histórico de envios semanais de status report.

Cálculos (com base nos filtros Mês `m`, Semana `w` e Status selecionados):

- **% acumulado do projeto**: percentual de aderência acumulada de envios do projeto no ano (no protótipo, apenas projetos Ativos acumulam; demais = 0).
- **Enviado na semana corrente** (booleano): se o projeto enviou status na semana `w`.
- **KPI Acumulado anual** = média do % acumulado dos projetos visíveis (pós-filtro de status).
- **KPI Envio da semana corrente** = (projetos visíveis que enviaram na semana `w` ÷ total visível) × 100.
- **Donut** = contagem de projetos visíveis por status (somente status selecionados no filtro global).
- **Por gerente** = média do % acumulado dos projetos visíveis de cada gerente (omite valor 0, ordena desc).
- **Semanal** = para cada semana de 1 a `w`: (projetos visíveis que enviaram naquela semana ÷ total visível) × 100.
- **Acumulado % de envios semanais (tabela)** = (nº de semanas com envio até `w` ÷ `w`) × 100, arredondado.
- **Total da tabela** = média da coluna de acumulado dos projetos listados.
- **Target institucional** = 85% (constante).
- Interdependência dos filtros: o **multi-select de status** filtra tudo; o **clique no donut** filtra apenas a tabela (cross-filter local) e é limpo automaticamente se o status sair da seleção global.

Dados de exemplo do protótipo (16 projetos, 4 gerentes — Thamires Ribeiro, Felipe Athar, Bruno Carvalho, Ana Lima — e 4 responsáveis — Radix, Júlio, Vanessa, IHM) estão em `data.js` e podem ser usados como seed/mocks.

---

## 6. Critérios de Aceite

1. **Dado** que acesso o dashboard, **então** vejo topbar com título, 3 filtros (status multi-select, mês, semana) e logo Hydro, seguidos dos 4 painéis no layout especificado.
2. **Dado** que altero Mês, Semana ou a seleção de status, **então** todos os KPIs, gráficos e a tabela recalculam imediatamente.
3. **Dado** que o multi-select tem apenas 1 status marcado, **então** não consigo desmarcá-lo (mínimo 1).
4. **Dado** que clico em um segmento do donut (ou item da legenda), **então** a tabela passa a exibir apenas projetos daquele status, o subtítulo mostra o chip de filtro, e clicar no chip (ou novamente no segmento) remove o filtro.
5. **Dado** que clico em um cabeçalho da tabela, **então** ela ordena por aquela coluna, alternando asc/desc, com indicador visual e desempate por nome.
6. **Dado** que o KPI está abaixo de 85%, **então** vejo a flag "X p.p. abaixo"; se ≥ 85%, vejo "no alvo".
7. **Dado** que seleciono a semana N, **então** o gráfico semanal mostra barras da semana 1 a N, com a semana N destacada em teal com valor visível, linha de alvo a 85% e faixa de meses correta.
8. **Visual:** cores, tipografia (Ivar Display nos títulos/números grandes), raios, espaçamentos e estados de hover conforme tokens da seção 2; tela fiel aos screenshots `v5.png` / `ms-open.png` / `centered.png`.
9. **Responsividade:** abaixo de 960px o layout colapsa para 1 coluna sem quebra visual.
10. **Acessibilidade mínima:** botão voltar com `aria-label`; controles operáveis por teclado; números com `tabular-nums`; contraste de texto adequado sobre fundo escuro.

---

## 7. Assets a entregar junto

| Arquivo | Uso |
|---|---|
| `assets/IvarDisplayHydro-Regular.ttf` | Fonte de display (títulos e números) |
| `assets/IvarTextHydro-Regular.ttf` / `-Bold.ttf` | Fonte de texto da marca |
| `assets/hydro_logo_negative.png` | Logo para fundo escuro (usado na topbar) |
| `assets/hydro_logo_blue.png` | Logo para fundos claros (reserva) |
| `data.js` do protótipo | Mock/seed de dados e lógica de cálculo de referência |
| `screenshots/` | Referência visual obrigatória |

---

## 8. Notas técnicas para implementação

- O protótipo usa React 18 + SVG puro (sem lib de gráficos) e CSS vanilla com custom properties — replicar essa abordagem mantém fidelidade total; alternativamente, qualquer stack pode ser usada **desde que o resultado visual e as interações sejam idênticos**.
- Gráficos: donut com `stroke-dasharray/dashoffset` em círculos SVG rotacionados -90°; bullet com camadas absolutas; barras com divs flex — todos descritos em `charts.jsx`.
- Locale pt-BR em ordenações (`localeCompare(..., 'pt')`) e formatação de percentuais com vírgula.
- Os PDFs de marca (`brand_colors.pdf`, `typography.pdf`, `digital.pdf`) ficam como referência normativa da identidade Hydro.
