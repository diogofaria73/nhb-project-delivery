# US-05 — Status Report Analytics

## Context

Once the platform records every status report submission (US-04), Administrators need to **measure delivery performance** at a glance: which service-provider companies are meeting the monthly schedule, which are chronically late, and how compliance is evolving over time.

This module consumes the data persisted by US-04 (`StatusReportSubmission`, classification rule BR-30) and exposes a **read-only analytics screen** with KPIs, a per-month compliance overview, a per-company breakdown and a heatmap. It does **not** mutate any business data.

Definitions used throughout this US (consistent with US-04):

- **Reference month**: the month a status report refers to (the value of `referenceMonth` on the submission).
- **Submitted**: any submission exists for `(company, referenceMonth)`.
- **On-time**: submitted, and `submittedAt ≤ end of referenceMonth` (UTC).
- **Late**: submitted, and `submittedAt > end of referenceMonth`.
- **Missed**: no submission exists for `(company, referenceMonth)` and that reference month is in the **past**.
- **Expected company set for a month**: every company that was already active during that reference month (i.e., `createdAt ≤ end of referenceMonth`).

---

## US-05.1 — Overview KPIs

**As an** Administrator,
**I want to** see at a glance the monthly compliance numbers for a chosen period,
**So that** I can quickly judge whether deliveries are healthy or slipping.

### Acceptance Criteria

- [ ] The screen is available at route `/status-reports/analytics`
- [ ] A period selector at the top lets the Administrator pick the **time window** (defaults to the **last 6 months including the current month**); the rest of the page reacts to this selection
- [ ] Four KPI cards are visible at the top:
  - **Expected deliveries** (sum across the window of the expected company set per month)
  - **On-time deliveries** (count + % of expected)
  - **Late deliveries** (count + % of expected)
  - **Missed deliveries** (count + % of expected)
- [ ] Each KPI shows a **delta vs. the previous equivalent window** (e.g., comparing last 6 months to the 6 months before) when there is data for that prior window
- [ ] Loading states are shown until the analytics endpoint resolves

---

## US-05.2 — Monthly compliance trend

**As an** Administrator,
**I want to** visualize on-time / late / missed deliveries by month,
**So that** I can spot trends and seasonal slippage.

### Acceptance Criteria

- [ ] A stacked bar chart shows, for each month in the selected window:
  - On-time deliveries (green)
  - Late deliveries (amber)
  - Missed deliveries (red)
- [ ] Hovering a bar segment reveals the exact counts and the company list (top 5, with "+N more")
- [ ] The chart respects the period selector from US-05.1
- [ ] A toggle switches the Y axis between **absolute counts** and **percentage of expected**
- [ ] The chart is responsive and accessible (alt text / data table fallback for screen readers)

---

## US-05.3 — Per-company compliance breakdown

**As an** Administrator,
**I want to** see how each active company is performing,
**So that** I can identify companies that consistently miss the schedule.

### Acceptance Criteria

- [ ] A table lists, for the selected period, one row per **company that was expected to deliver at least once**, with columns:
  - **Company** (trade name)
  - **Expected** (number of months the company was active in the window)
  - **On-time** (count + %)
  - **Late** (count + %)
  - **Missed** (count + %)
  - **Compliance score** = `on-time / expected` rendered as a colored badge (green ≥ 90%, amber 60–89%, red < 60%)
- [ ] The table is sortable by every column; default sort is **Compliance score ascending** (worst first)
- [ ] Filters available: by **Compliance band** (green / amber / red), and a search by company name
- [ ] Clicking a row opens a drawer with the **per-month timeline** of that company within the period (one cell per month, color-coded by status)
- [ ] The table supports CSV export of the visible rows

---

## US-05.4 — Compliance heatmap

**As an** Administrator,
**I want to** see a heatmap of companies × months,
**So that** I can pinpoint patterns at a glance (a specific month where many companies slipped, a specific company that is always late, etc.).

### Acceptance Criteria

- [ ] A heatmap grid has **companies on the Y axis** and **months on the X axis**, restricted to the selected period
- [ ] Each cell is color-coded: green (on-time), amber (late), red (missed), gray (company not yet active that month)
- [ ] Hovering a cell shows: company name, reference month, status, delivery date (if any), delivery email (if any) and a link to the underlying submission (US-04.3)
- [ ] Rows can be sorted by **company name** or by **compliance score** (same definition as US-05.3)
- [ ] When the period contains more than 60 companies, the heatmap virtualizes rows for performance
- [ ] Empty state (no expected deliveries in the period) is handled with a clear message

---

## US-05.5 — Export and share

**As an** Administrator,
**I want to** export the analytics for sharing with stakeholders,
**So that** I can include the data in reports and meetings.

### Acceptance Criteria

- [ ] An **Export** action offers:
  - **CSV** — flat rows: `company, referenceMonth, status, submittedAt, deliveryEmail`
  - **Summary CSV** — one row per company with the KPIs from US-05.3
- [ ] The export respects the current period and filters
- [ ] Filenames are auto-generated: `status-report-analytics-{from}-{to}.csv`
- [ ] (Future) PDF export with charts — out of scope for this iteration

---

## Permission Matrix — Analytics

| Action                                  | Administrator | User |
|-----------------------------------------|:---:|:---:|
| Open analytics screen                   | Y  | N  |
| Use period filters and breakdowns       | Y  | N  |
| Export analytics                        | Y  | N  |
| Drill down to a submission (US-04.3)    | Y  | Y (via US-04.3) |

Regular Users do **not** have access to this dashboard. They may still view individual submissions through US-04.3.

---

## Computed Indicators (reference)

Given a selected period `[from, to]` of months:

```
expected_company_set(month) =
  { company | company.createdAt ≤ endOfMonth(month) AND company.isActive_at(endOfMonth(month)) }

submissions(company, month) =
  StatusReportSubmissions where companyId = company.id AND referenceMonth = month

status(company, month) =
  if no submissions       → 'missed'
  else if min(submittedAt) ≤ endOfMonth(month) → 'on-time'
  else                    → 'late'

kpi_expected = Σ_month |expected_company_set(month)|
kpi_on_time  = count of (company, month) where status = 'on-time'
kpi_late     = count of (company, month) where status = 'late'
kpi_missed   = count of (company, month) where status = 'missed'

compliance_score(company, period) = on_time(company, period) / expected(company, period)
```

`isActive_at(t)` is approximated as `company.isActive = true` today AND `company.createdAt ≤ t`. A future US can introduce historical status changes; for now the simple definition is acceptable.

---

## Business Rules

- BR-31: Analytics consume the same `submittedAt`/`referenceMonth` semantics defined in US-04 (BR-24, BR-28) and the classification in BR-30 — **no separate scoring is computed** in this module.
- BR-32: A company is part of the **expected set** for a month only if it was **created on or before the last day of that month** and is currently active. Deactivating a company excludes it from **future** expected sets but keeps it in past sets (historical accuracy).
- BR-33: KPI deltas (US-05.1) are computed against the **previous equivalent window** (same length immediately preceding the current selection). If the prior window has no expected deliveries, the delta is hidden.
- BR-34: Analytics endpoints are **read-only** and aggregate data with SQL `GROUP BY company_id, reference_month` — never with N+1 queries from the application layer.
- BR-35: Exports never include user PII beyond what already appears on a submission detail page (i.e., they include `deliveryEmail` and `submittedById → name` but not credentials, tokens, etc.).

---

## Technical Notes

- New REST surface, hosted by the same status-reports module (no new domain module):
  - `GET /api/status-reports/analytics/overview?from=YYYY-MM&to=YYYY-MM` → KPIs (US-05.1) + monthly buckets (US-05.2)
  - `GET /api/status-reports/analytics/companies?from=YYYY-MM&to=YYYY-MM&band=green|amber|red&search=…` → per-company breakdown (US-05.3)
  - `GET /api/status-reports/analytics/heatmap?from=YYYY-MM&to=YYYY-MM` → matrix (US-05.4)
  - `GET /api/status-reports/analytics/export?from=YYYY-MM&to=YYYY-MM&kind=flat|summary` → CSV stream (US-05.5)
- All analytics endpoints are guarded by `@Roles('ADMINISTRATOR')`.
- Aggregation queries are written in Prisma raw SQL (`prisma.$queryRaw`) using `GENERATE_SERIES` to produce the month axis, then `LEFT JOIN companies` and `LEFT JOIN status_report_submissions` so that **missed** months are produced server-side without round-trips.
- A small `analytics/` subfolder under `apps/api/src/modules/status-reports/application/` holds these use cases and DTOs; the controller delegates to them.
- Frontend feature at `apps/web/src/features/status-report-analytics/` (own folder, even though it lives next to US-04 in the sidebar):
  - Pages: `analytics-page.tsx`
  - Components: `kpi-cards.tsx`, `monthly-chart.tsx`, `company-table.tsx`, `compliance-heatmap.tsx`, `period-picker.tsx`
  - Hooks: one `useAnalyticsOverview`, `useAnalyticsCompanies`, `useAnalyticsHeatmap` (lightweight wrappers around the service)
  - Charts: reuse the existing UI primitives + a single thin chart library (recharts) added only here
- Sidebar adds an entry **Analytics** under the **Operations** group (introduced in US-04), Administrator-only.
- i18n keys under `statusReportAnalytics.*`.

---

## Out of Scope (for this US)

- Real-time updates / websockets — page reloads on user action.
- Per-company deadline customization (e.g., "must deliver by day 5") — when introduced, the BR-30 rule will be generalized and this US will be revisited.
- Predictive analytics / anomaly detection.
- PDF export (CSV only for now).
- Notifications to companies based on compliance scores.
