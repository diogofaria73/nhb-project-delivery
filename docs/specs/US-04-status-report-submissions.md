# US-04 — Status Report Submissions (Apontamento de Entrega)

## Context

Service-provider companies (US-03) periodically deliver **status report** files (PDF, spreadsheets, etc.) — typically via email. NHB users currently log this delivery in spreadsheets or trackers. This module turns that logging into a first-class feature: every time a company delivers its status report, a user records a **submission entry** in the platform with the delivery date (auto-captured), the delivery email and (optionally) the attached file(s).

The data captured here feeds the analytics module described in **US-05** — letting NHB measure which companies deliver inside the planned month and which fall behind.

- Each submission references **one Company** (from US-03) and **one reference month** (the period the report covers).
- The user does not enter the delivery date — the server captures it automatically when the entry is created.
- File attachments are **optional** but the system must store them safely when present.
- Standard Users may log new submissions and view existing ones; only Administrators may edit or delete them.

---

## US-04.1 — List submissions

**As an** authenticated User,
**I want to** view the registered status report submissions,
**So that** I can track which companies have already delivered and consult the supporting files.

### Acceptance Criteria

- [ ] The screen displays a list/table at route `/status-reports`
- [ ] Columns: **Company** (trade name), **Reference month** (formatted `MMM/YYYY`), **Delivery date** (`createdAt`, formatted by locale), **Delivery email**, **Attachments** (count + icon), **Submitted by** (user name)
- [ ] Filters available: by **Company**, by **Reference month** (period range), by **Submission status** (on-time / late — see BR-30), by **Submitted by**
- [ ] Searching by company trade name, legal name, or delivery email is available
- [ ] The list is paginated (maximum 20 records per page)
- [ ] Sorting defaults to **Delivery date — newest first**; clicking a column header toggles asc/desc
- [ ] Each row exposes quick actions (View, Download attachments, Edit/Delete — last two Admin-only)
- [ ] Standard Users see **all** submissions (read access is platform-wide so they can verify before logging a new one) but only Admin actions are gated

---

## US-04.2 — Create submission

**As an** authenticated User,
**I want to** register a new status report submission for a company,
**So that** the platform has an authoritative record of the delivery.

### Acceptance Criteria

- [ ] A **"New submission"** action opens a creation dialog/form
- [ ] The form contains the fields:
  - **Company** (required, single-select from active companies — see BR-22 from US-03)
  - **Reference month** (required, month/year picker, defaults to the current month at the moment the dialog opens)
  - **Delivery email** (required, valid email format) — the email through which the company sent the report
  - **Notes** (optional, multiline, max 500 chars)
  - **Attachments** (optional, multiple files, drag-and-drop area + file picker)
- [ ] **Delivery date is NOT shown as an input** — the success toast and the saved record display it as captured server-side from `submittedAt`
- [ ] Allowed attachment MIME types: `application/pdf`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/msword`, `text/csv`, `image/png`, `image/jpeg`. Other types are rejected with a clear error.
- [ ] Per-file size limit: **25 MB**. Total per submission: **50 MB**.
- [ ] Upload progress is visible for each file; cancel / remove is available before submitting the form
- [ ] On submission the system:
  - Validates the company is active (BR-22)
  - Saves the submission with `submittedAt = server NOW()` (BR-24)
  - Persists every attachment with original filename, MIME type, size, and storage reference
  - Returns the created entry with attachment metadata
- [ ] Displays a success toast: "Submission registered for {{company}} — {{referenceMonth}}"
- [ ] On validation errors, displays a specific message per field
- [ ] On server-side errors (e.g., storage failure), the entire submission is rolled back — no orphan records or files

### Business Rules

- BR-23: A submission **must reference an Active company** (cross-module enforcement of BR-22)
- BR-24: `submittedAt` (delivery date) is **server-generated**; clients cannot set or override it
- BR-25: Delivery email must be a syntactically valid email
- BR-26: Attachments are **optional**; when present, the limits in the AC apply
- BR-27: Each attachment stores its original filename, declared MIME type, size in bytes, and an internal storage reference (not the raw blob in the relational row)
- BR-28: Reference month is required and defaults to the current month, but the user may pick any past or current month (future months are rejected)

---

## US-04.3 — View submission details

**As an** authenticated User,
**I want to** open a detailed view of a submission,
**So that** I can read all metadata and download the attached files.

### Acceptance Criteria

- [ ] Clicking a row (or a "View" action) opens a details drawer/dialog
- [ ] The view displays: company (trade + legal name + CNPJ formatted), reference month, **delivery date** (date + time), delivery email, submitted by (user name + email), notes, and the list of attachments
- [ ] Each attachment shows filename, formatted size (KB/MB), and a **Download** action that streams the file with the original name and MIME type
- [ ] Status badge (on-time / late — BR-30) is visible
- [ ] Admin sees an inline "Edit" and "Delete" action; Standard User sees only View / Download

---

## US-04.4 — Edit submission (Administrator)

**As an** Administrator,
**I want to** correct the metadata of an existing submission,
**So that** I can fix typos in the delivery email, change the reference month, or update notes.

### Acceptance Criteria

- [ ] Edit form is pre-filled with the current values
- [ ] Editable fields: **Reference month**, **Delivery email**, **Notes**
- [ ] **Delivery date** and **Company** are **read-only** after creation (the original facts of the delivery are immutable)
- [ ] Attachments can be **added** but not removed in this iteration (deletion happens via the parent submission deletion, US-04.5)
- [ ] On save, displays a success toast and the table refreshes
- [ ] The `updatedAt` timestamp is refreshed

### Business Rules

- BR-29: Delivery date (`submittedAt`) and Company on a submission are **immutable** — corrections requiring a different company or date must be done via delete + new entry

---

## US-04.5 — Delete submission (Administrator)

**As an** Administrator,
**I want to** delete an incorrectly registered submission,
**So that** the platform's data and analytics stay accurate.

### Acceptance Criteria

- [ ] A "Delete" action is available from the row dropdown and from the details view
- [ ] A confirmation dialog is shown before deletion, indicating that attachments will be removed as well
- [ ] On confirmation, the submission row and all its attachment records + stored files are removed
- [ ] Displays a success toast
- [ ] Analytics (US-05) immediately reflect the removal

---

## Permission Matrix — Status Report Submissions

| Action                              | Administrator | User |
|-------------------------------------|:---:|:---:|
| List submissions                    | Y  | Y  |
| View details + download attachments | Y  | Y  |
| Create submission                   | Y  | Y  |
| Edit submission (metadata)          | Y  | N  |
| Delete submission                   | Y  | N  |

---

## Data Model (reference)

`StatusReportSubmission`:

| Field            | Type        | Constraints                                                       |
|------------------|-------------|-------------------------------------------------------------------|
| `id`             | UUID        | Primary key                                                       |
| `companyId`      | UUID        | FK → `companies.id`, required                                     |
| `referenceMonth` | Date        | required, normalized to the **first day of the month at 00:00 UTC** |
| `deliveryEmail`  | String      | required, valid email                                             |
| `notes`          | Text        | optional, max 500                                                 |
| `submittedById`  | UUID        | FK → `users.id`, required (the User who recorded the entry)       |
| `submittedAt`    | DateTime    | server-set on insert (= delivery date for analytics purposes)     |
| `updatedAt`      | DateTime    | auto-updated                                                      |

`StatusReportAttachment`:

| Field            | Type        | Constraints                                                       |
|------------------|-------------|-------------------------------------------------------------------|
| `id`             | UUID        | Primary key                                                       |
| `submissionId`   | UUID        | FK → `status_report_submissions.id`, cascade delete               |
| `filename`       | String      | required, original upload filename                                |
| `mimeType`       | String      | required, validated against the allow-list (BR-27)                |
| `sizeBytes`      | Int         | required, ≤ 25 MB                                                 |
| `storageKey`     | String      | required, opaque reference into the storage backend               |
| `uploadedAt`     | DateTime    | default `now()`                                                   |

Suggested migration name: `create_status_report_submissions`.

Recommended indexes:
- `status_report_submissions (companyId, referenceMonth)` — analytics queries
- `status_report_submissions (submittedAt)` — list ordering / period filters

---

## Technical Notes

- New domain module under `apps/api/src/modules/status-reports/` following the DDD pattern of `modules/companies/`.
- Reference month is stored as a `Date` set to the first day of the month at 00:00 UTC — comparisons in analytics become simple equality / range checks.
- File uploads:
  - Backend: `@nestjs/platform-express` + `FileInterceptor`/`FilesInterceptor`. Multer config caps size at 25 MB and validates MIME against the allow-list at the gateway before reaching the use case.
  - Storage backend abstraction (`IStorageProvider`) with two implementations: `LocalDiskStorage` (default for dev, stores under `apps/api/storage/status-reports/{yyyy}/{mm}/{uuid}-{filename}`) and a future `S3Storage` (no-op stub now). The `storageKey` column is provider-agnostic.
  - Persistence is wrapped in a single use case `RegisterSubmissionUseCase` that uses `prisma.$transaction` for the submission + attachment rows; uploaded files are streamed to the storage provider **before** committing the transaction, and on rollback the use case cleans up the written files.
  - Downloads go through `GET /api/status-reports/:id/attachments/:attachmentId` with `Content-Disposition: attachment; filename="<original>"`. Stream from storage; never re-buffer fully in memory.
- REST surface under `/api/status-reports`:
  - `GET /status-reports` (list + filters + pagination)
  - `GET /status-reports/:id` (details)
  - `POST /status-reports` (create, multipart — both Roles)
  - `PUT /status-reports/:id` (edit metadata — Admin)
  - `DELETE /status-reports/:id` (Admin)
  - `GET /status-reports/:id/attachments/:attachmentId` (stream)
- A status report submission DTO exposes a computed `status: 'on-time' | 'late'` based on BR-30 to keep clients dumb.
- Frontend feature at `apps/web/src/features/status-reports/`, mirroring `features/companies/` for table/dialog/hooks. A `StatusReportFormDialog` adds a drag-and-drop file area using a thin `react-dropzone`-style component (or native `<input type="file" multiple>` if the lib is not yet in the project).
- Sidebar (`apps/web/src/app/layout/sidebar.tsx`) adds **Status Reports** entry under a new group **Operations** (label `sidebar.groups.operations`), visible to all authenticated users.
- i18n keys live under `statusReports.*` in both `en.ts` and `pt-BR.ts`.
- Shared contracts in `packages/shared/src/types/status-report-contracts.ts`.

---

## Cross-cutting Business Rules

- BR-30 (status classification): A submission is considered **on-time** if `submittedAt` is **on or before the last day of `referenceMonth`** (server-side compared in UTC). Otherwise it is **late**. This classification is what feeds analytics in US-05.

---

## Out of Scope (for this US)

- Automatic ingestion from an inbox (e.g., parsing emails to create submissions) — covered later if needed.
- Replacing or deleting individual attachments after the submission is created.
- Per-company configurable delivery deadlines (e.g., "must deliver by day 5 of the following month") — analytics in US-05 assumes the simple monthly rule defined in BR-30.
- Notifications / reminders to companies that haven't delivered.
