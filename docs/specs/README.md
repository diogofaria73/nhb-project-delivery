# Functional Specifications

## Overview

This directory contains the User Stories (USs) that describe the platform's implemented features. Each file is the source of truth for the corresponding module — acceptance criteria, business rules, permission matrix and technical notes.

---

## Module Index

| File | Module | Scope |
|---|---|---|
| [US-01-authentication.md](./US-01-authentication.md) | Authentication | Login, account lockout, logout |
| [US-02-users.md](./US-02-users.md) | User Management (RBAC) | List, create, edit, activate/deactivate, unlock, mandatory first-login password change |
| [US-08-project-tracking-import.md](./US-08-project-tracking-import.md) | Project Tracking via Annual Excel Import | Upload the consolidated annual spreadsheet, snapshot it server-side, list / restore / delete import versions |
| [US-09-dashboard-hydro-visual.md](./US-09-dashboard-hydro-visual.md) | Dashboard Status Report (Hydro visual) | Hydro-themed Dashboard built on top of US-08: filters (year / status / month / week), bullet KPIs, interactive donut, manager bars, weekly chart and sortable + paginated project table |

### Fixture

| File | Purpose |
|---|---|
| `StatusReportBI_2026.xlsx` | Sample workbook used by the parser unit tests in `apps/api/src/modules/project-tracking/infrastructure/parsers/spreadsheet.parser.spec.ts`. |

---

## Access Profiles (RBAC)

| Profile | Description |
|---|---|
| **Administrator** | Full system access: user management, spreadsheet imports, restore / delete imports |
| **User** | Read-only access to the Dashboard and project details |

---

## Business Rules Summary

### Authentication (US-01) & User Management (US-02)

| Code | Description | US |
|---|---|---|
| BR-01 | JWT token with 8-hour validity | US-01 |
| BR-02 | Every request validates the token on the server | US-01 |
| BR-03 | Inactive users cannot log in **unless** they still owe a mandatory first-login password change | US-01, US-02.6 |
| BR-04 | Lockout is per account (email), not per IP | US-01 |
| BR-05 | Lockout remaining time is not shown to the user | US-01 |
| BR-06 | Email must be unique per user | US-02 |
| BR-07 | Administrator profile can only be assigned by another Admin | US-02 |
| BR-08 | Password stored with bcrypt hash | US-02 |
| BR-09 | Admin cannot downgrade their own profile | US-02 |
| BR-10 | Email change validates uniqueness | US-02 |
| BR-11 | Admin cannot deactivate their own account | US-02 |
| BR-12 | There must always be at least one active Admin | US-02 |
| BR-13 | Users created by an Admin are persisted as inactive with `mustChangePassword = true` | US-02.2, US-02.6 |
| BR-14 | A user under the first-login flow is restricted to the First-login screen until the flag is cleared | US-02.6 |
| BR-15 | A successful mandatory password change atomically clears `mustChangePassword` and activates the user | US-02.6 |
| BR-16 | Auth responses expose `mustChangePassword` and a `redirectTo` hint so clients can enforce the flow | US-02.6 |

### Project Tracking Import (US-08)

| Code | Description | US |
|---|---|---|
| BR-50 | `.xlsx` upload must contain a sheet matching `StatusReport_*_NovaFormula` (any year suffix); the workbook's year is informational only — the form-supplied `referenceYear` drives the snapshot. | US-08.1 |
| BR-51 | Required header columns: `Project ID`, `Project Name`, `Status Projeto`, `Semana 1` … `Semana 52` (missing any column aborts the import). | US-08.1 |
| BR-52 | A row is valid when `Project ID` is non-empty and `Status Projeto` parses to the enum; week cells must be blank or `ok` (case-insensitive). | US-08.1 |
| BR-53 | Duplicate `Project ID` within the same upload keeps the first occurrence and reports subsequent ones as `duplicate-in-file`. | US-08.1 |
| BR-54 | At most **one ACTIVE import per `referenceYear`** (enforced by a partial unique index + transactional flip in confirm / restore). | US-08.1, US-08.5 |
| BR-55 | The raw uploaded `.xlsx` is retained for the lifetime of the import row; deleting the import deletes the file. | US-08.5 |
| BR-56 | Totals from the spreadsheet are discarded on import — the backend recomputes everything from the 52 weekly flags. The `BI` sheet's numbers feed a sanity-check that surfaces warnings (≥ 1 unit or ≥ 1 p.p. divergence). | US-08.1 |
| BR-57 | Weeks `Semana 1`…`Semana 52` map to ISO 8601 weeks of `referenceYear`. Years with ISO week 53 are handled: missing `Semana 53` is treated as 0 expected / 0 sent + a warning. | US-08.1 |
| BR-58 | The Dashboard always reads the single `ACTIVE` import for the selected `referenceYear`. | US-09 |
| BR-59 | KPI percentages have `totalProjects` as denominator; a year with zero projects renders dashes. | US-09 |
| BR-60 | "Expected weeks" denominator is capped at `currentISOWeek` (`min(end-of-project-week, currentISOWeek)`) to avoid artificially low compliance at the start of the year. | US-09 |
| BR-61 | Standard Users see the full Dashboard but never see import metadata beyond the header strip; the link to `/dashboard/imports` is hidden. | US-08, US-09 |
| BR-62 | Restore is atomic: it never leaves a `referenceYear` with zero or more than one `ACTIVE` import. | US-08.5 |
| BR-63 | Delete cascades to `ProjectSnapshot` rows and the stored file. The `ACTIVE` import cannot be deleted directly. | US-08.5 |
| BR-64 | The **current ISO week** used by KPI and freshness calculations is the ISO 8601 week of `now()` in `America/Sao_Paulo`. This is the only place the backend reads the wall clock for analytics. | US-08 |
| BR-65 | Freshness badge thresholds: green ≤ 7d, amber 8–14d, red > 14d. Driven exclusively by `max(importedAt)` for the active import. | US-08, US-09 |

### Dashboard Visual (US-09)

| Code | Description | US |
|---|---|---|
| BR-66 | Target institutional fixed at 85% for the bullet charts. | US-09.2 |
| BR-67 | Project cumulative % uses W (selected week) as denominator: `popcount(weekFlags[1..W]) / W × 100`. | US-09 |
| BR-68 | Projects whose status is not `ACTIVE` are treated as 0% for the "Acumulado anual" KPI and manager-bars averages (still appear with real values in the table). | US-09.2, US-09.4 |
| BR-69 | KPI Acumulado anual: arithmetic mean of `cumulativePct` of visible projects (with BR-68). | US-09.2 |
| BR-70 | KPI Envio da semana corrente: `(visible projects with bit W) / (visible projects) × 100`. | US-09.2 |
| BR-71 | Donut counts use the projects after the global status multi-select; the donut never filters itself. | US-09.3 |
| BR-72 | Donut cross-filter affects the table only. Cleared automatically when the focused status leaves the global selection. | US-09.3, US-09.6 |
| BR-73 | Manager bars group visible projects by `pm`; empty / 0% PMs are omitted; ordered desc by percent. | US-09.4 |
| BR-74 | Weekly chart percentage for week `w` = `(visible projects with bit w) / (visible projects) × 100`, for `w = 1..W`. | US-09.5 |
| BR-75 | Detail table lists visible projects (after global filter), further filtered by the donut focus. | US-09.6 |
| BR-76 | Month filter groups the Week select's options. Picking "All months" disables the Week select and reverts W to the current ISO week (year-to-date view). | US-09.1 |
| BR-77 | The Dashboard always operates on the `referenceYear` chosen in the topbar; the cross-year navigation goes through the Import history. | US-09.1 |
| BR-78 | When the selected month has zero submissions across the visible projects, a banner explains why and offers a "clear month filter" action. | US-09 |

---

## Conventions Used in User Stories

- **Acceptance Criteria**: testable checklist by QA or by Claude Code itself
- **Business Rules (BR-XX)**: constraints that must be implemented on the backend, regardless of the interface
- **Permission Matrix**: at the end of each module, summarizes who can do what
- **Technical Notes**: implementation guidance without prescribing the full solution
