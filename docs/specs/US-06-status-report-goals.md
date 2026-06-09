# US-06 — Status Report Delivery Goals

## Context

US-04 introduced status report submissions and US-05 introduced analytics that classify each `(company, month)` delivery as **on-time**, **late** or **missed** (BR-30). The next step is to give NHB administrators a way to **declare what "good" looks like** so the platform can grade companies against an explicit, organization-wide expectation.

This US covers a **global goal** model: an Administrator defines a goal that applies **uniformly to every registered company** for a configurable period (quarter, semester or year). The goal is expressed in **two parameters that any non-technical user can understand**:

1. **Expected deliveries per period per company** — e.g., "4 deliveries per quarter".
   If there are 10 registered companies and the goal is 4 deliveries per quarter, each of the 10 companies is expected to deliver 4 reports during that quarter (regardless of how the deliveries are distributed across the months of the quarter).

2. **Monthly delivery deadline (day of the month)** — e.g., "deadline = day 25".
   For each submission, if `submittedAt ≤ day 25 of its referenceMonth` it counts as **on-time**; otherwise it counts as **late** (for goal evaluation). When the chosen day does not exist in a given month (e.g., day 31 in February), the deadline clamps to the **last day of that month**.

Goals are **read by anyone authenticated** so users can see the bar they are working against, and **managed only by Administrators**. The analytics screen (US-05) automatically picks up the active goal(s) and renders progress indicators.

### Definitions used throughout this US

- **Period type**: `QUARTERLY`, `SEMESTRAL` or `ANNUAL`.
- **Period index**: 1–4 for quarters, 1–2 for semesters, ignored for annual.
- **Period range**: the `[startDate, endDate]` of months that the period covers, normalized to UTC. Q1 = Jan–Mar, Q2 = Apr–Jun, Q3 = Jul–Sep, Q4 = Oct–Dec. S1 = Jan–Jun, S2 = Jul–Dec. Annual = Jan–Dec.
- **Eligible company set** for a goal: every company that is `isActive = true` AND `createdAt ≤ endDate` of the period. Mirrors the rule in US-05 (BR-32), adjusted by BR-36 (only currently active companies count).
- **Per-month effective deadline** for a goal with `monthlyDeadlineDay = D`:
  `effectiveDeadline(refMonth) = min(D, daysInMonth(refMonth)) at 23:59:59 UTC of refMonth`.
- **Per-submission classification (goal scope)**:
  - **goal on-time** when `submittedAt ≤ effectiveDeadline(referenceMonth)`,
  - **goal late** otherwise.
- **Per-company progress** within a goal's period:
  - `delivered = count of submissions whose referenceMonth ∈ period`,
  - `onTime = count of submissions where the submission is "goal on-time"`,
  - `late = delivered − onTime`,
  - `expected = goal.deliveriesPerPeriod` (the same value for every eligible company — BR-36).
- **Per-company status**:
  - **hit** when `onTime ≥ expected`,
  - **at-risk** when `delivered ≥ expected` but `onTime < expected` (delivered enough copies, but some were late),
  - **off-track** when `delivered < expected`.

The previous on-time/late rule used elsewhere in the platform (BR-30: "on-time = submittedAt ≤ end of referenceMonth") **continues to apply to US-04 listings and US-05 analytics**. The goal carries its own stricter deadline so that compliance can be measured against a meaningful business cutoff (e.g., "day 25").

---

## US-06.1 — Create a goal

**As an** Administrator,
**I want to** declare a delivery goal for a quarter, semester or year,
**So that** the platform can objectively report whether each company is meeting expectations.

### Acceptance Criteria

- [ ] A **"New goal"** action on the goals screen opens a creation dialog/form
- [ ] The form contains the fields:
  - **Period type** (required, select: Quarterly / Semestral / Annual)
  - **Year** (required, integer, default = current year)
  - **Period index** (required for Quarterly [1–4] and Semestral [1–2]; **hidden** for Annual)
  - **Deliveries per period (per company)** (required, integer ≥ 1, default = number of months in the period — i.e., 3 for Quarterly, 6 for Semestral, 12 for Annual — implying "1 per month" out of the box)
  - **Monthly deadline day** (required, integer 1–31, default 25). The form must show a hint that the value is the **day of the month** and that it auto-clamps when a month is shorter (e.g., day 31 becomes Feb 28)
  - **Notes** (optional, multiline, max 500 chars)
- [ ] On submit, the system validates the form, derives the period range and persists the goal
- [ ] The system **rejects** creation when a goal already exists for the same `(periodType, year, periodIndex)` (uniqueness — BR-39)
- [ ] The system **warns** but still allows creation when the period is entirely in the past (Concluded)
- [ ] A success toast: "Goal saved for {{period label}}"
- [ ] The new goal appears in the goals list (US-06.2) with its current progress

### Business Rules

- BR-36: A goal applies uniformly to **every currently active company** in the system — there is no per-company customization in this iteration
- BR-37: **Deliveries per period** must be `integer ≥ 1`. There is no implicit upper bound, but a soft cap of `366` should be enforced to catch fat-finger errors
- BR-38: **Monthly deadline day** must be `integer between 1 and 31`. When the day does not exist in a given month, the effective deadline is the **last day of that month** at 23:59:59 UTC
- BR-39: For a given `(periodType, year, periodIndex)` only one goal record may exist (`UNIQUE` constraint). Repeating the trio is handled through US-06.4 instead

---

## US-06.2 — List goals

**As an** authenticated User,
**I want to** see every declared goal and its real-time progress,
**So that** I know what I am being measured against.

### Acceptance Criteria

- [ ] The goals page is at route `/goals` and is visible to every authenticated user
- [ ] Goals are grouped visually by **status** in three sections:
  - **Active** — period contains today's date
  - **Upcoming** — period starts in the future
  - **Concluded** — period entirely in the past
- [ ] Each goal card shows:
  - Period label (e.g., "Q1 2026", "Sem 1 2026", "2026")
  - **Deliveries per period** (e.g., "4 / period")
  - **Deadline** (e.g., "Day 25 of each month")
  - Notes (if any)
  - Aggregate progress: **% of companies hitting the goal so far** and the absolute counts (`X of Y companies`)
  - Aggregate goal-on-time rate (sum of `onTime` across all eligible companies divided by `eligibleCompanies × deliveriesPerPeriod`)
  - The last refresh time
- [ ] Each card has quick links: **View details** (US-06.3) and (Admin only) **Edit / Archive**
- [ ] An empty state with a CTA to create the first goal is shown when no goals exist

---

## US-06.3 — Goal detail and breakdown

**As an** authenticated User,
**I want to** drill into a goal and see which companies are hitting it and which are not,
**So that** I can take action where it is needed.

### Acceptance Criteria

- [ ] A goal detail screen (or drawer) shows the goal metadata and a **per-company breakdown** table
- [ ] Table columns: **Company**, **Delivered**, **On-time**, **Late**, **Missing** (`max(0, expected − delivered)`), **Status badge** (Hit / At-risk / Off-track)
- [ ] Default sort: **status worst-first** (off-track → at-risk → hit), then by **trade name**
- [ ] Filters: by status (Hit / At-risk / Off-track) and free-text search by trade name
- [ ] A **"Project end-of-period"** toggle (Active goals only) extrapolates the current pace to the full period and re-classifies each company against the projection — useful to anticipate misses
- [ ] CSV export with the visible breakdown
- [ ] Standard Users see the data but not the Admin-only "Edit" / "Archive" / "Delete" actions
- [ ] When the goal is in the **Concluded** state, the data is read-only and a "Final result" banner is shown

### Business Rules

- BR-40: **Hit / At-risk / Off-track** classification follows the definitions in the **Context** section above, using the goal's own `monthlyDeadlineDay` for on-time vs late
- BR-41: Companies created **after** the period end are excluded from that goal's calculation (no retroactive expectations)

---

## US-06.4 — Edit a goal

**As an** Administrator,
**I want to** correct or adjust a goal,
**So that** I can fix a typo or re-baseline expectations if business priorities change.

### Acceptance Criteria

- [ ] Editable fields when the period is **Active** or **Upcoming**: **Deliveries per period**, **Monthly deadline day**, **Notes**
- [ ] **Period type / Year / Period index are immutable** after creation (they identify the goal). To "move" a goal, delete it (US-06.5, Upcoming only) and create another
- [ ] When the period is **Concluded**, only **Notes** is editable (history must remain faithful)
- [ ] On save: success toast, breakdown (US-06.3) recomputes immediately, `updatedAt` is refreshed
- [ ] Audit: the goal stores `updatedById` to record who changed it last

### Business Rules

- BR-42: Period identity (`periodType`, `year`, `periodIndex`) is **immutable** after creation
- BR-43: Concluded goals allow only **notes** edits — `deliveriesPerPeriod` and `monthlyDeadlineDay` changes would rewrite historical conclusions

---

## US-06.5 — Archive / Delete a goal

**As an** Administrator,
**I want to** remove or archive a goal,
**So that** the goals list reflects current organizational practice.

### Acceptance Criteria

- [ ] **Upcoming** goals can be deleted hard (no data has accrued)
- [ ] **Active** goals can be archived with confirmation; archived goals are hidden from the default list but still queryable via a "Show archived" toggle
- [ ] **Concluded** goals **cannot be deleted**; they may only be archived for clarity
- [ ] All deletion / archival actions display a confirmation dialog summarizing the consequence
- [ ] Standard Users do not see these actions

### Business Rules

- BR-44: Concluded goals are **immutable for delete**; they may be archived but never removed (audit trail)

---

## US-06.6 — Integration with analytics (US-05)

**As an** Administrator,
**I want to** see active goal progress prominently inside the analytics dashboard,
**So that** the analytics view answers "are we hitting our goals?" without leaving the page.

### Acceptance Criteria

- [ ] When at least one **Active** goal exists, the top of `/status-reports/analytics` shows a **"Goal progress" strip** with one chip per active goal (period label + chosen `deliveriesPerPeriod` + companies-hitting count + colored band based on aggregate progress)
- [ ] Clicking a chip navigates to the goal's detail page (US-06.3)
- [ ] When no Active goal exists, the strip is **hidden** (no empty placeholder)
- [ ] The KPI cards on `/status-reports/analytics` gain a contextual hint when an Active goal exists: "Goal: {{deliveriesPerPeriod}} / period · deadline day {{monthlyDeadlineDay}}"

---

## Permission Matrix — Goals

| Action                          | Administrator | User |
|---------------------------------|:---:|:---:|
| List goals                      | Y  | Y  |
| View goal detail / breakdown    | Y  | Y  |
| Create goal                     | Y  | N  |
| Edit goal                       | Y  | N  |
| Archive goal                    | Y  | N  |
| Delete goal (Upcoming only)     | Y  | N  |
| Export breakdown CSV            | Y  | Y  |
| See goal strip on analytics     | Y  | N (US-05 already Admin-only) |

---

## Data Model (reference)

`StatusReportGoal`:

| Field                  | Type     | Constraints                                                                 |
|------------------------|----------|------------------------------------------------------------------------------|
| `id`                   | UUID     | Primary key                                                                  |
| `periodType`           | Enum     | `QUARTERLY` \| `SEMESTRAL` \| `ANNUAL`, required                             |
| `year`                 | Int      | required, e.g., 2026                                                         |
| `periodIndex`          | Int?     | required for QUARTERLY (1–4) and SEMESTRAL (1–2); NULL for ANNUAL            |
| `startDate`            | Date     | computed at write-time from `(periodType, year, periodIndex)`                |
| `endDate`              | Date     | computed at write-time                                                       |
| `deliveriesPerPeriod`  | Int      | required, `1 ≤ value ≤ 366`, expected total **per company** for the period   |
| `monthlyDeadlineDay`   | Int      | required, `1 ≤ value ≤ 31`, day-of-month deadline for goal-on-time           |
| `notes`                | Text?    | optional, max 500                                                            |
| `isArchived`           | Boolean  | default `false`                                                              |
| `createdById`          | UUID     | FK → `users.id`                                                              |
| `updatedById`          | UUID?    | FK → `users.id`                                                              |
| `createdAt`            | DateTime | default `now()`                                                              |
| `updatedAt`            | DateTime | auto-updated                                                                 |

Uniqueness: `UNIQUE (periodType, year, periodIndex)` — `periodIndex` is `NULL` for annual, treated as a distinct value by Postgres.

Suggested migration name: `update_goals_to_count_model` (replaces the prior `target`/`minimumMonthlyDeliveries` columns).

Recommended indexes:
- `(startDate, endDate)` — used to compute "Active / Upcoming / Concluded" sections and to lookup the active set during analytics requests
- `(isArchived)` — list filtering

### Data migration note

Existing rows persisted with the old model (`target`, `minimumMonthlyDeliveries`) must be transformed:
- `deliveriesPerPeriod` ← `minimumMonthlyDeliveries × monthsInPeriod(periodType)` (1 × 3, 1 × 6 or 1 × 12 by default).
- `monthlyDeadlineDay` ← `28` (a safe, sub-end-of-month default that exists in every month). Administrators are expected to revisit any pre-existing goals after the migration; the change is announced in release notes.

---

## Technical Notes

- Domain module remains `apps/api/src/modules/status-report-goals/`. The `GoalPeriod` value object is unchanged; a small **`GoalDeadline` helper** (or static method on the entity) computes `effectiveDeadline(refMonth, dayOfMonth)` clamping to the month's last day.
- **`fetchGoalAggregate` SQL helper** (already in `apps/api/src/modules/status-report-goals/infrastructure/queries/`) is updated so the per-month "on-time" predicate is:
  `MIN(submitted_at) ≤ (date_trunc('month', refMonth) + LEAST(deadlineDay, EXTRACT(DAY FROM (refMonth + interval '1 month' - interval '1 day')))::int - 1 || ' days')::interval + interval '23:59:59'`
  (Equivalent in JS: clamp the deadline day to the month's last day, then compare against `submittedAt` in UTC.)
  The aggregate now returns per-company `delivered`, `on_time` and `late` directly (no more "missed" rows — that classification belongs to US-05's aggregate).
- **Breakdown classification** moves into the `BreakdownGoalUseCase`:
  - `hit` when `on_time ≥ deliveriesPerPeriod`
  - `at-risk` when `delivered ≥ deliveriesPerPeriod` but `on_time < deliveriesPerPeriod`
  - `off-track` when `delivered < deliveriesPerPeriod`
- REST surface under `/api/goals` is unchanged (paths and verbs), only the payload shapes change:
  - `Create` / `Update` accept `deliveriesPerPeriod` and `monthlyDeadlineDay`
  - `Response` exposes both fields
  - `Breakdown` rows expose `delivered`, `onTime`, `late`, `missing`, `status` (+ optional `projected`)
- Frontend feature at `apps/web/src/features/goals/`:
  - `goal-form-dialog.tsx` swaps the `Target (%)` + `Min monthly` inputs for **`Deliveries per period`** (number) and **`Monthly deadline day`** (number with hint).
  - `goal-card.tsx` displays `{{deliveriesPerPeriod}} / period · deadline day {{monthlyDeadlineDay}}` instead of `target %`.
  - `goal-breakdown-table.tsx` removes the "Hit rate %" column and surfaces **Delivered / On-time / Late / Missing** + status badge.
  - `goal-status-strip.tsx` (rendered inside the analytics page) shows the same compact summary as the cards.
- Shared contracts in `packages/shared/src/types/status-report-goal-contracts.ts`:
  - `GoalResponse.target` and `GoalResponse.minimumMonthlyDeliveries` are removed.
  - Added: `GoalResponse.deliveriesPerPeriod` and `GoalResponse.monthlyDeadlineDay`.
  - `GoalBreakdownRow.hitRate` is removed; added: `delivered`, `onTime`, `late`, `missing`.
- i18n keys under `goals.*` adjusted accordingly:
  - Replace `goals.form.target` and `goals.form.minimum` with `goals.form.deliveriesPerPeriod` and `goals.form.deadlineDay` (+ helper text about month clamping).
  - Replace `goals.card.target` with `goals.card.deliveriesPerPeriod` and `goals.card.deadlineDay`.
  - Update `goals.breakdown.columns.*` to use the new shape.

---

## Cross-cutting Business Rules (summary)

- BR-36 — Goal applies uniformly to every active company
- BR-37 — `deliveriesPerPeriod` is `integer ≥ 1` (soft cap 366)
- BR-38 — `monthlyDeadlineDay` is `integer 1..31`; clamps to last day of month when the day does not exist
- BR-39 — `(periodType, year, periodIndex)` is unique
- BR-40 — Per-company status follows: **hit** (onTime ≥ expected), **at-risk** (delivered ≥ expected but onTime < expected), **off-track** (delivered < expected)
- BR-41 — Companies created after the period end are excluded
- BR-42 — Period identity is immutable after creation
- BR-43 — Concluded goals: notes-only edits
- BR-44 — Concluded goals cannot be deleted (archive-only)

---

## Out of Scope (for this US)

- **Per-company customization** (different counts or deadlines per company) — a future US can introduce `StatusReportGoalOverride` rows.
- **Per-month required count** (e.g., "1 per month" instead of "4 per quarter") — this US treats the total within the period as the unit.
- **Tier-based goals** (e.g., gold/silver/bronze companies).
- **Notifications/alerts** when a company drops to At-risk or Off-track — a future US can attach to a goal.
- **Goal templates / cloning** between periods.
- **Multiple deadlines per period** (e.g., interim mid-period checkpoints).
