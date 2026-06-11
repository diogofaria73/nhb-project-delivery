# US-08 — Project Tracking via Annual Excel Import

## Context

The platform's current operational flow (US-03 → US-07) assumes NHB users log **per-company, per-month** status report submissions one by one. In practice, the PMO already maintains a single consolidated **annual spreadsheet** (`StatusReportBI_YYYY.xlsx`) that is the source of truth for every project's weekly delivery status. Re-keying that spreadsheet into the platform is duplicate work and a source of drift.

This US **inverts the flow**: instead of registering one submission at a time, an Administrator uploads the annual spreadsheet and the platform parses, validates, snapshots and exposes all derived indicators on the Dashboard. The unit of tracking moves from **Company × Month** to **Project × Week**, matching the spreadsheet's own grain.

### Operating cadence — weekly re-upload

The spreadsheet is **re-uploaded by the PMO once a week** (typically every Monday, after the previous week is closed). Each weekly upload is essentially the previous file with **one more `Semana N` column filled in** — same projects, same statuses, plus the new week's `ok` marks. This drives three design choices baked into the rules below:

1. The import preview (US-08.1) shows a **delta vs. the previous `ACTIVE` import** (newly added `ok`s, removed `ok`s, new projects, project-status changes), not just absolute totals — because absolute totals barely move week-to-week and the diff is what tells the Admin "did the right thing get uploaded?".
2. The Dashboard's compliance denominator (BR-60) is capped at the **current ISO week**, not at week 52 — otherwise compliance % would look catastrophic at the start of the year just because most of the year hasn't happened yet.
3. The Dashboard surfaces a **freshness indicator** on the header strip and a **current-week KPI**, so anyone landing on the page can tell at a glance whether last week's upload happened and how the week that just closed is doing.

Expected volume: ~52 imports per `referenceYear` per year. The schema and history page are sized for that and nothing else.

> **Scope decision (confirmed):** This module **replaces** the Company × Month submission model defined in US-03, US-04, US-05, US-06 and US-07. Those USs are marked as **superseded by US-08** — their backend domain modules, tables and frontend features are retired as part of this delivery (see *Migration & Deprecation* at the end). Historical company-submission data is **not** carried over; the spreadsheet is the new source of truth.

### Spreadsheet shape (reference — `StatusReportBI_2026.xlsx`)

The workbook contains three sheets. Only two are consumed:

| Sheet | Role | Read by parser |
|---|---|:---:|
| `StatusReport_YYYY_NovaFormula` | Authoritative project × week matrix | **Yes (primary)** |
| `BI` | Pre-computed annual KPIs (% concluded, % cancelled, weekly totals…) | **Yes (sanity-check only)** |
| `StatusReport_YYYY_backup` | Stale snapshot kept by the PMO for safety | **No (ignored)** |

**Primary sheet — columns expected (row 1 = header):**

| Column | Meaning | Type |
|---|---|---|
| `Project ID` | External project identifier (e.g., `PRJ0010317`, `PRJ-3371`) | string |
| `Project Name` | Human-readable project name | string |
| `Status Projeto` | One of: `ativo`, `on hold`, `concluído`, `cancelado`, `a iniciar` (case-insensitive, accent-insensitive) | enum |
| `Responsável pelo Envio` | Email, free-text role (e.g., `GBS IT PMO`, `PARCEIRO`) or blank | string \| null |
| `Semana 1` … `Semana 52` | Cell value `ok` (any case) ⇒ status report sent in that ISO week; blank ⇒ not sent | flag |
| `Total de Status nas Semanas` | Sum of `ok` per row | computed — **ignored on import** |
| `Total de status não enviados` | Expected − sent | computed — **ignored on import** |
| `Total que deveria ter sido enviado` | Expected weeks (depends on project status & start week) | computed — **ignored on import** |
| `OBS` | Free-text notes | string \| null |
| `PM` | Project manager name | string \| null |
| `Detal. Resp. Envio` | Free-text detail of the responsible party | string \| null |

The three `Total …` columns are **derived** and recomputed server-side from the 52 weekly flags — never trusted blindly. The `BI` sheet is parsed and compared against the server-side aggregation; mismatches are surfaced as **warnings** on the import report but do not block the import.

### Normalised project status enum

| Spreadsheet value | Stored as | Counts as "active" for KPIs |
|---|---|:---:|
| `ativo` | `ACTIVE` | Yes |
| `on hold` | `ON_HOLD` | No |
| `concluído` / `concluido` | `COMPLETED` | No |
| `cancelado` | `CANCELLED` | No |
| `a iniciar` | `NOT_STARTED` | No |

Any other value triggers a row-level error (see US-08.1 acceptance criteria).

---

## US-08.1 — Upload and import the annual spreadsheet (Administrator)

**As an** Administrator,
**I want to** upload the consolidated annual Excel file,
**So that** the platform extracts every project's weekly delivery status and refreshes the Dashboard without manual re-keying.

### Acceptance Criteria

- [ ] An **"Import spreadsheet"** action is available on the Dashboard, visible to **Administrators only**
- [ ] The action opens a dialog with:
  - A drag-and-drop area + file picker accepting **only** `.xlsx` (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)
  - A **Reference year** input (required, integer 2024..currentYear+1, defaults to current year) — used to disambiguate which year's weekly axis the file maps to
  - A short explanation of which sheets are read and which are ignored
- [ ] File constraints: per-file size **≤ 10 MB**, single file per upload
- [ ] On submit, the file is streamed to the backend and processed in a **dry-run first**: the response returns a parse report with:
  - Total rows read
  - Rows accepted, skipped (empty), rejected (with row number + reason)
  - Sanity-check diff vs. the `BI` sheet (per-week sent count, total sent, % concluded/cancelled/on-hold/not-started) — discrepancies listed as warnings
  - **Delta vs. the previous `ACTIVE` import for the same `referenceYear`** (only when one exists): new projects added, projects removed, projects whose `projectStatus` changed (old → new), count of `ok` marks added per ISO week, count of `ok` marks removed per ISO week. The delta is the primary thing the Admin reviews before confirming.
  - A preview table of the first 10 accepted projects
- [ ] The dialog shows the report and asks for an explicit **"Confirm import"** click before any data is persisted
- [ ] On confirmation the system:
  - Creates a new `ProjectImport` snapshot row (status `PENDING` → `PROCESSING` → `COMPLETED`/`FAILED`), stamped with `importedById`, `importedAt`, `referenceYear`, `originalFilename`, `fileSizeBytes`, `storageKey`, `sha256`
  - Persists every accepted row as a `ProjectSnapshot` linked to the import, with the 52 weekly flags expanded into either a packed `weekFlags` field (52-bit bitmap stored as `bytea`) or — if the team prefers row-per-week — a `ProjectWeekFlag` child table (decision is left to the implementation; see Technical Notes)
  - Marks the new import as the **active import** for that `referenceYear` (only one active import per year — previous active import for the same year is demoted to `SUPERSEDED`)
  - The original `.xlsx` file is stored in the storage backend (re-using the `IStorageProvider` abstraction) so the raw artefact can be re-downloaded later
- [ ] Displays a success toast: `"Imported {N} projects from {filename} ({yyyy})"` and refreshes the Dashboard
- [ ] On parse failure (corrupt file, missing required sheet, missing required column, header drift) the dialog shows a single actionable error message and **no** rows or snapshots are persisted
- [ ] On row-level errors (unknown status enum, missing Project ID, duplicate Project ID within the same upload), the import is still confirmable; the offending rows are reported and **skipped**, never silently coerced
- [ ] Upload progress and parse progress are visible (two-phase progress UI)

### Business Rules

- BR-50: The `.xlsx` upload **must contain** the sheet `StatusReport_YYYY_NovaFormula` (the suffix `_NovaFormula` is required; the year prefix is matched against the `referenceYear` input — mismatches abort the import)
- BR-51: Required header columns are `Project ID`, `Project Name`, `Status Projeto`, and `Semana 1` through `Semana 52`. Missing any one of them aborts the import before any row is processed.
- BR-52: A row is **valid** when `Project ID` is non-empty and `Status Projeto` parses to the enum. Any other validation failure (e.g., a weekly cell containing text other than blank/`ok`/`OK`) is reported on the row and the row is rejected.
- BR-53: Duplicate `Project ID` within the same upload is rejected; only the **first** occurrence is kept and subsequent ones are reported as `duplicate-in-file` errors.
- BR-54: One **active** import per `(referenceYear)` at a time. Confirming a new import atomically demotes the previous active import to `SUPERSEDED` — never deletes it. (See US-08.5 for rollback.)
- BR-55: The raw uploaded `.xlsx` is retained for the lifetime of the import row; deleting the import (US-08.5) deletes the file too.
- BR-56: All computed totals from the spreadsheet (`Total de Status nas Semanas`, etc.) are **discarded on import** — the backend recomputes them from the 52 weekly flags. The `BI` sheet's numbers are compared and any divergence ≥ 1 unit (or ≥ 1 percentage point for percentages) is surfaced as a warning.
- BR-57: ISO week numbering. The columns `Semana 1`…`Semana 52` are mapped to **ISO 8601 weeks** of `referenceYear`. Years with an ISO week 53 (e.g., 2026) are explicitly handled: if the spreadsheet does not include a `Semana 53` column, week 53 is treated as **0 expected, 0 sent** for that year and a warning is surfaced on import. A future iteration may expand the schema to 53 columns.
- BR-64: The **current ISO week** used by KPI and freshness calculations is the ISO 8601 week of `now()` evaluated in `America/Sao_Paulo` (the PMO's operating timezone). This is the *only* place the system reads the wall clock for analytics — every other date derives from the spreadsheet.

---

## US-08.2 — Import history (Administrator)

**As an** Administrator,
**I want to** see every spreadsheet that has been imported,
**So that** I can audit who refreshed the data and when, and recover a previous snapshot if needed.

### Acceptance Criteria

- [ ] A side panel / page at route `/dashboard/imports` (Administrator-only) lists every `ProjectImport` row
- [ ] Columns: **Reference year**, **Status** (`ACTIVE` / `SUPERSEDED` / `FAILED`), **Filename**, **Rows accepted / rejected**, **Imported at**, **Imported by**, **Actions**
- [ ] Default sort: `importedAt` descending
- [ ] Row actions: **Download original file**, **View import report** (the same report shown at import time, persisted as JSON), **Restore** (only on `SUPERSEDED` rows — see US-08.5), **Delete** (only when not the active import for its year)
- [ ] Pagination: 20 per page
- [ ] Filters: by `referenceYear`, by `status`

---

## US-08.3 — Project Tracking Dashboard

**As an** authenticated User,
**I want to** see the consolidated indicators built from the latest imported spreadsheet,
**So that** I can monitor delivery health without having to open the Excel file.

### Acceptance Criteria

- [ ] Route `/dashboard` (replacing the legacy dashboard) shows, scoped to a **Reference year** selector (defaults to the most recent year with an `ACTIVE` import):
  - A small header strip: `Last import: {date} by {user} — {filename}` with a link to US-08.2, plus a **freshness badge**:
    - Green `up to date` when the last import is ≤ 7 days old
    - Amber `last import N days ago` when it is between 8 and 14 days old
    - Red `last import N days ago — overdue` when it is older than 14 days
    The Admin gets a "Import now" button next to the badge when it is amber or red; standard users see the badge as read-only.
  - **Current-week KPI** (rendered as the primary card): `Current-week compliance` = `% of ACTIVE projects with 'ok' in the current ISO week`, with the absolute fraction (e.g., `21 / 29 — 72%`) and the ISO week label (`ISO week 18 — 27 Apr to 3 May`). Standard users see this card as well.
  - **Portfolio KPI cards** — counts and percentages:
    - **Total projects** (denominator = all projects in the active import)
    - **Active** (`ACTIVE`) — count + %
    - **On hold** (`ON_HOLD`) — count + %
    - **Completed** (`COMPLETED`) — count + %
    - **Cancelled** (`CANCELLED`) — count + %
    - **Not started** (`NOT_STARTED`) — count + %
  - **Annual consolidated indicator**: `sent / expected` across all `ACTIVE` projects for the year, rendered as a big-number percentage + absolute (e.g., `35% — 162 of 459`)
  - **Weekly compliance chart**: a bar chart with 52 (or 53) bars; each bar is the percentage of `ACTIVE` projects that have `ok` in that week. Bars for ISO weeks **after the current week** are rendered greyed-out (those weeks have not happened yet and have no expected deliveries). The current-week bar is highlighted with an outline.
  - **Project table** (one row per project from the active import):
    - Columns: **Project ID**, **Project Name**, **Status**, **PM**, **Responsible**, **Sent / Expected**, **Compliance %**, **Last status** (week of the most recent `ok`)
    - A horizontal **52-cell timeline** column shows the project's weeks colour-coded: green = sent, red = expected but not sent, gray = not expected (project not yet active or already completed/cancelled before the week)
    - Search by Project ID or Project Name, filters by Status, PM, Responsible
    - Sort by every numeric column; default sort = Compliance % ascending (worst first)
    - Pagination: 50 per page
- [ ] When **no import exists** for the selected year, an empty state is shown with a primary CTA "Import spreadsheet" (Administrator) or "No data yet — ask an admin to import" (Standard User)
- [ ] All numbers in this screen are **derived server-side** from the `ACTIVE` import — never recomputed in the browser
- [ ] Loading skeletons cover KPI cards, chart and table independently

### Business Rules

- BR-58: The Dashboard always reads the **single `ACTIVE`** import for the selected `referenceYear`. Other imports are invisible to standard users.
- BR-59: KPI percentages have `totalProjects` as denominator. A reference year with zero projects renders dashes (`—`) instead of `0%`.
- BR-60: For the weekly compliance chart and project-table compliance score, the "expected weeks" denominator follows the BI rule: a project is **expected** to send in week `w` if it is `ACTIVE` at the end of week `w` (i.e., not yet `COMPLETED` or `CANCELLED`) **and** it had already started by week `w` **and** `w ≤ currentISOWeek` (per BR-64). Start week is taken as the first `Semana` column whose value is non-blank, or week 1 if the project is `ACTIVE` from the start of the year. Future weeks (`w > currentISOWeek`) are **never** expected — they contribute 0 to both numerator and denominator so the compliance % is not artificially depressed at the start of the year. Until a more precise project-lifecycle is modelled, this approximation is acceptable.
- BR-61: Standard Users see the full Dashboard but never see import metadata beyond the header strip; the link to `/dashboard/imports` is hidden for them.
- BR-65: The freshness badge thresholds (≤7d green, 8–14d amber, >14d red) and the "Import now" CTA are driven exclusively by `max(importedAt)` for the active import of the selected `referenceYear`. The badge is not shown when the selected year has no `ACTIVE` import (the empty state takes over instead).

---

## US-08.4 — Project detail view

**As an** authenticated User,
**I want to** drill into a single project,
**So that** I can review its weekly timeline and notes.

### Acceptance Criteria

- [ ] Clicking a row in the Dashboard project table opens a side drawer with:
  - Project ID, name, status badge, PM, Responsible, OBS (free-text)
  - The 52-week timeline rendered with bigger cells and tooltips per week (`Week N (DD/MM – DD/MM): sent | not sent | not expected`)
  - Aggregates: `Sent`, `Expected`, `Compliance %`
  - A "View source row" action that downloads the underlying `.xlsx` (re-uses the `ACTIVE` import's stored file)
- [ ] No edit actions are exposed — the spreadsheet is the single source of truth and any change must come from a new import

---

## US-08.5 — Restore a previous import or delete a stale one (Administrator)

**As an** Administrator,
**I want to** roll back to a previously imported spreadsheet or delete an obsolete one,
**So that** I can correct mistakes (e.g., wrong file uploaded, missing rows) without re-uploading the original file.

### Acceptance Criteria

- [ ] On any `SUPERSEDED` import, a **"Restore"** action prompts for confirmation; on confirm the system atomically swaps the `ACTIVE` flag — the current `ACTIVE` import for that year becomes `SUPERSEDED` and the chosen one becomes `ACTIVE`. The Dashboard reflects the change immediately.
- [ ] On any non-`ACTIVE` import, a **"Delete"** action removes the import row, all its `ProjectSnapshot` children and the stored `.xlsx` file. A confirmation dialog spells out that this is irreversible.
- [ ] The `ACTIVE` import cannot be deleted directly; the Administrator must first restore another import (which demotes it to `SUPERSEDED`) or import a new one.

### Business Rules

- BR-62: Restore is **atomic** — it never leaves a `referenceYear` with zero `ACTIVE` imports or with more than one `ACTIVE` import. Use a single transaction.
- BR-63: Delete cascades to `ProjectSnapshot` rows and the stored file. The `ProjectImport` row is hard-deleted; there is no soft-delete. (The history of past imports is preserved by *not* deleting them, not by tombstones.)

---

## Permission Matrix — Project Tracking

| Action | Administrator | User |
|---|:---:|:---:|
| Open Dashboard (US-08.3, US-08.4) | Y | Y |
| Open Import history (US-08.2) | Y | N |
| Upload / confirm import (US-08.1) | Y | N |
| Download original `.xlsx` | Y | Y |
| Restore a `SUPERSEDED` import | Y | N |
| Delete an import | Y | N |

---

## Data Model (reference)

### `ProjectImport`

| Field | Type | Constraints |
|---|---|---|
| `id` | UUID | Primary key |
| `referenceYear` | Int | required, 2024..currentYear+1 |
| `status` | Enum | `PENDING` \| `PROCESSING` \| `ACTIVE` \| `SUPERSEDED` \| `FAILED` |
| `originalFilename` | String | required |
| `fileSizeBytes` | Int | required |
| `sha256` | String | hex digest of the uploaded file |
| `storageKey` | String | opaque reference into the storage backend |
| `parseReport` | JSON | report shown in US-08.1 (rows accepted/rejected, BI sanity diff, warnings) |
| `rowsAccepted` | Int | |
| `rowsRejected` | Int | |
| `importedById` | UUID | FK → `users.id` |
| `importedAt` | DateTime | default `now()` |

Unique constraint: at most one row with `status = ACTIVE` per `referenceYear` (enforced by a partial unique index).

### `ProjectSnapshot`

| Field | Type | Constraints |
|---|---|---|
| `id` | UUID | Primary key |
| `importId` | UUID | FK → `project_imports.id`, cascade delete |
| `projectId` | String | external project identifier from the spreadsheet (e.g., `PRJ-3371`) |
| `projectName` | String | |
| `projectStatus` | Enum | `ACTIVE` \| `ON_HOLD` \| `COMPLETED` \| `CANCELLED` \| `NOT_STARTED` |
| `responsible` | String? | |
| `responsibleDetail` | String? | |
| `pm` | String? | |
| `notes` | String? | the `OBS` column |
| `weekFlags` | `bytea` (7 bytes / 56 bits) | one bit per ISO week; bit `w-1` set ⇒ `ok` in week `w` |
| `weeksSent` | Int | derived, persisted for fast aggregation |
| `weeksExpected` | Int | derived per BR-60 |

Recommended indexes:
- `project_imports (referenceYear, status)` — Dashboard read path
- `project_snapshots (importId)` — drill-down
- `project_snapshots (importId, projectStatus)` — KPI aggregation

(Alternative if the team prefers normalised storage: drop `weekFlags`/`weeksSent`/`weeksExpected` and use a `project_week_flags (snapshot_id, weekNumber, sent boolean)` table. Both options are acceptable — pick one in the implementation PR.)

---

## Technical Notes

- **New domain module** at `apps/api/src/modules/project-tracking/`, following the existing DDD layout. It owns three aggregates: `ProjectImport`, `ProjectSnapshot` and (optionally) `ProjectWeekFlag`.
- **Parser**: use [`exceljs`](https://www.npmjs.com/package/exceljs) (streaming `.xlsx` reader). The parser lives in `infrastructure/parsers/spreadsheet.parser.ts` and exposes a pure function `parse(file: Buffer | Stream, year: number): ParseReport`. No NestJS dependencies — easy to unit-test against the fixture `docs/specs/StatusReportBI_2026.xlsx`.
- **Use cases**:
  - `ParseAndPreviewImportUseCase` (dry-run)
  - `ConfirmImportUseCase` (persists snapshot + flips ACTIVE atomically in a `$transaction`)
  - `RestoreImportUseCase`
  - `DeleteImportUseCase`
  - `GetActiveImportUseCase` / `GetDashboardUseCase` (read-side; uses raw SQL aggregation grouped by `projectStatus`, joined with the bitmask popcount for weekly totals)
- **REST surface** under `/api/project-tracking`:
  - `POST /project-tracking/imports/preview` (multipart, Admin) — returns `ParseReport` without persisting
  - `POST /project-tracking/imports/confirm` (multipart, Admin) — persists; returns the new `ProjectImport`
  - `GET /project-tracking/imports?year=…&status=…` (Admin)
  - `GET /project-tracking/imports/:id` (Admin)
  - `GET /project-tracking/imports/:id/file` (Admin & Users — streams the original `.xlsx`)
  - `POST /project-tracking/imports/:id/restore` (Admin)
  - `DELETE /project-tracking/imports/:id` (Admin)
  - `GET /project-tracking/dashboard?year=…` (Admin & Users) — KPIs + weekly bar values + lightweight project list (cursor pagination)
  - `GET /project-tracking/projects/:snapshotId` (Admin & Users) — drill-down
- **Storage**: reuse `IStorageProvider` from the previous status-reports module before its removal — extract it to `apps/api/src/shared/infrastructure/storage/` so the new module does not depend on the deprecated one.
- **Frontend**:
  - New feature folder `apps/web/src/features/project-tracking/` with `components/`, `hooks/`, `pages/`, `types/`, `index.ts`
  - Pages: `dashboard-page.tsx` (replaces the existing dashboard route), `import-history-page.tsx`
  - Components: `import-dialog.tsx`, `import-preview-report.tsx`, `kpi-cards.tsx`, `weekly-bar-chart.tsx`, `project-table.tsx`, `project-week-strip.tsx`, `project-detail-drawer.tsx`
  - Service: `apps/web/src/services/project-tracking.service.ts`
  - Routing: replace the existing dashboard route in `apps/web/src/app/App.tsx`; add `/dashboard/imports` (Admin-guarded)
  - Sidebar: keep the **Dashboard** entry pointing to `/dashboard`; remove the legacy Status Reports / Analytics / Goals entries (see *Migration & Deprecation*)
- **Shared contracts** in `packages/shared/src/types/project-tracking-contracts.ts`. Export from the package barrel.
- **i18n** keys under `projectTracking.*` in both `en.ts` and `pt-BR.ts`. The spreadsheet's Portuguese labels (`ativo`, `on hold`…) live in the parser, not in the UI strings.

---

## Migration & Deprecation

This US replaces the entire Company × Month flow. Concretely, in the implementation PR(s):

1. Mark US-03, US-04, US-05, US-06 and US-07 as **superseded by US-08** in `docs/specs/README.md` (move them to a "Superseded" section; do not delete the files — they remain readable for historical context).
2. Drop the routes from `apps/web/src/app/App.tsx`: `/companies`, `/status-reports`, `/status-reports/analytics`, `/status-report-goals`.
3. Remove the corresponding `apps/web/src/features/` folders: `companies/`, `status-reports/`, `status-report-analytics/`, `goals/`.
4. Remove the backend modules: `apps/api/src/modules/companies/`, `apps/api/src/modules/status-reports/`, `apps/api/src/modules/status-report-goals/`.
5. Generate a Prisma migration that **drops** `companies`, `status_report_submissions`, `status_report_attachments`, `status_report_goals` (and any dependent indexes), then **creates** `project_imports`, `project_snapshots` (and optionally `project_week_flags`). Drop the now-unused `GoalPeriodType` enum.
6. The `User.submissions`, `User.goalsCreated`, `User.goalsUpdated` relations are removed; replace with `User.imports` (FK from `project_imports.importedById`).
7. Update `CLAUDE.md`: replace the references to the Company / Status Report modules with the new Project Tracking module, and update the New Feature Checklist examples accordingly.
8. The seed (`apps/api/prisma/seed.ts`) keeps the Admin user but drops any seeded companies/submissions.
9. Historical company-submission data is **not** migrated. If the operations team needs to keep a copy, the deprecated tables can be exported as CSV before the migration runs — this is a manual ops step, not part of the platform.

> Because the migration is destructive, the implementation PR should be split into at least two: **(a)** introduce the new module behind a feature flag with the new tables created additively, **(b)** flip the dashboard route and drop the deprecated modules in a second PR once the new flow is validated in staging.

---

## Out of Scope (for this US)

- Editing individual weekly flags from the UI — the spreadsheet remains the single source of truth.
- Multi-year aggregations (cross-year comparisons, YoY deltas). The Dashboard always shows one `referenceYear`.
- Notifications when a project misses a week.
- Auto-ingestion from a shared drive / email attachment. Upload is always user-initiated.
- A REST endpoint to create / update a project without going through an import.
- PDF export of the Dashboard.
- Per-project drill-down beyond the side drawer (e.g., a dedicated `/projects/:id` page).
