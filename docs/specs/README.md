# Functional Specifications

## Overview

This directory contains the User Stories (USs) describing the platform's base features. Each file corresponds to a system module.

---

## Module Index

| File | Module | User Stories |
|---|---|---|
| [US-01-authentication.md](./US-01-authentication.md) | Authentication | Login, account lockout, logout |
| [US-02-users.md](./US-02-users.md) | User Management (RBAC) | List, create, edit, activate/deactivate, unlock, mandatory first-login password change |
| [US-03-companies.md](./US-03-companies.md) | Company Management (Service Providers) | List, create, edit, view, activate/deactivate companies authorized to submit status reports |
| [US-04-status-report-submissions.md](./US-04-status-report-submissions.md) | Status Report Submissions | Log each delivery (auto delivery date, delivery email, attachments), list/view/edit/delete |
| [US-05-status-report-analytics.md](./US-05-status-report-analytics.md) | Status Report Analytics | KPIs, monthly trend chart, per-company compliance, heatmap, CSV export |
| [US-06-status-report-goals.md](./US-06-status-report-goals.md) | Status Report Delivery Goals | Global compliance targets per quarter / semester / year, with per-company breakdown and analytics integration |
| [US-07-excel-exports.md](./US-07-excel-exports.md) | Structured Excel Exports | Replace CSV exports with styled XLSX workbooks (cover sheet, KPIs, conditional formatting) for analytics and goal breakdown |

---

## Access Profiles (RBAC)

| Profile | Description |
|---|---|
| **Administrator** | Full system access, including user management |
| **User** | Standard access, can view project dashboard |

---

## Business Rules Summary

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
| BR-17 | CNPJ must be unique per company (stored normalized as 14 digits) | US-03.2 |
| BR-18 | CNPJ must pass check-digit validation before persistence | US-03.2 |
| BR-19 | New companies are created with `isActive = true` by default | US-03.2 |
| BR-20 | CNPJ is immutable after company creation | US-03.3 |
| BR-21 | Deactivation is a soft toggle; company data and historical reports are preserved | US-03.4 |
| BR-22 | Status reports cannot be submitted for companies with `isActive = false` (cross-module) | US-03.4, US-04.2 |
| BR-23 | A status report submission must reference an Active company | US-04.2 |
| BR-24 | `submittedAt` (delivery date) is server-generated; clients cannot set or override it | US-04.2 |
| BR-25 | Delivery email must be a syntactically valid email | US-04.2 |
| BR-26 | Attachments are optional; per-file ≤ 25 MB, total per submission ≤ 50 MB | US-04.2 |
| BR-27 | Attachments persist filename, MIME type, size and an opaque storage reference; MIME allow-list enforced at the gateway | US-04.2 |
| BR-28 | Reference month is required, defaults to current month, future months rejected | US-04.2 |
| BR-29 | Delivery date and Company on a submission are immutable after creation | US-04.4 |
| BR-30 | On-time = `submittedAt ≤ end of referenceMonth` (UTC); otherwise late. Missed = no submission for a past reference month | US-04, US-05 |
| BR-31 | Analytics consume the BR-30 classification — no separate scoring is computed | US-05 |
| BR-32 | A company is in the **expected set** for a month only if `createdAt ≤ end of month`; deactivation excludes future months but preserves past ones | US-05 |
| BR-33 | KPI deltas compare to the previous equivalent window; hidden when the prior window has no expected deliveries | US-05.1 |
| BR-34 | Analytics aggregations run server-side via `GROUP BY` (no N+1 from the application layer) | US-05 |
| BR-35 | Exports never include credentials/tokens; only fields already visible on a submission detail page | US-05.5 |
| BR-36 | A delivery goal applies uniformly to every currently active company | US-06.1 |
| BR-37 | `deliveriesPerPeriod` is integer ≥ 1 (soft cap 366) — total entregas expected **per company** for the period | US-06.1 |
| BR-38 | `monthlyDeadlineDay` is integer 1..31 — day-of-month cutoff for **goal on-time**; auto-clamps to the last day when the month is shorter | US-06.1 |
| BR-39 | `(periodType, year, periodIndex)` is unique per goal | US-06.1 |
| BR-40 | Per-company status: **hit** when `onTime ≥ expected`; **at-risk** when `delivered ≥ expected` but `onTime < expected`; **off-track** when `delivered < expected` | US-06.3 |
| BR-41 | Companies created after the period end are excluded from that goal's calculation | US-06.3 |
| BR-42 | Goal period identity (`periodType`, `year`, `periodIndex`) is immutable after creation | US-06.4 |
| BR-43 | Concluded goals allow only notes-edits — never `deliveriesPerPeriod` or `monthlyDeadlineDay` changes | US-06.4 |
| BR-44 | Concluded goals cannot be deleted; they may only be archived | US-06.5 |
| BR-45 | Analytics exports are returned as XLSX, not CSV | US-07.1 |
| BR-46 | Every workbook follows the common style guide | US-07.1, US-07.2 |
| BR-47 | Goal export honors the same `project` parameter as the JSON breakdown | US-07.2 |
| BR-48 | Goal export uses the common style guide | US-07.2 |
| BR-49 | A central `WorkbookStyleGuide` module is the single source of truth for fonts, colors and number formats | US-07.3 |

---

## Conventions Used in User Stories

- **Acceptance Criteria**: testable checklist by QA or by Claude Code itself
- **Business Rules (BR-XX)**: constraints that must be implemented on the backend, regardless of the interface
- **Permission Matrix**: at the end of each module, summarizes who can do what
- **Technical Notes**: implementation guidance without prescribing the full solution
