# US-03 — Company Management (Service Providers)

## Context

The platform receives **status report files** from external **service-provider companies** (prestadoras de serviço). Before any company can submit reports, an Administrator must register it in the system. This module covers the full CRUD lifecycle of these companies.

- A *Company* in this module always represents an external service provider — not Norsk Hydro Brazil itself.
- Companies have lifecycle status (Active / Inactive). Only **active** companies are allowed to submit status reports (enforced in future modules).
- Only **Administrators** can manage companies. Standard users may consult the list as read-only context for status reports (out of scope here).

---

## US-03.1 — List companies

**As an** Administrator,
**I want to** view all registered service-provider companies,
**So that** I have visibility of every partner authorized to submit status reports.

### Acceptance Criteria

- [ ] The screen displays a list/table with all registered companies (route `/companies`)
- [ ] Columns displayed: **Trade name**, **Legal name**, **CNPJ**, **Contact email**, **Status** (Active/Inactive), **Created at**
- [ ] CNPJ is shown formatted (`00.000.000/0000-00`)
- [ ] Filtering by **status** (All / Active / Inactive) is available
- [ ] Searching by **trade name**, **legal name**, or **CNPJ** (with or without punctuation) is available
- [ ] The list is paginated (maximum 20 records per page)
- [ ] Inactive companies are displayed with differentiated styling (e.g., gray text)
- [ ] An empty state is shown when no companies match the current filter, with a CTA to create one

---

## US-03.2 — Create company

**As an** Administrator,
**I want to** register a new service-provider company,
**So that** it can be authorized to submit status reports.

### Acceptance Criteria

- [ ] A **"New company"** action opens a creation dialog/form
- [ ] The form contains the fields:
  - **Trade name** (required, max 120 chars) — *nome fantasia*
  - **Legal name** (required, max 160 chars) — *razão social*
  - **CNPJ** (required, unique, masked input `00.000.000/0000-00`)
  - **Contact email** (required, valid email format)
  - **Contact phone** (optional, free format, max 32 chars)
  - **Notes** (optional, multiline, max 500 chars)
- [ ] CNPJ is validated against the official check-digit algorithm before saving
- [ ] CNPJ uniqueness is validated server-side regardless of formatting (stored as 14 digits, no punctuation)
- [ ] The contact email must be a syntactically valid email
- [ ] Upon saving, the company is created with **Active** status
- [ ] Displays a success toast after registration
- [ ] On validation errors, displays a specific message per field
- [ ] On duplicate CNPJ, displays a clear message identifying the conflict

### Business Rules

- BR-17: **CNPJ is unique** in the system (stored normalized as 14 digits)
- BR-18: **CNPJ must pass check-digit validation**; invalid CNPJs are rejected before persistence
- BR-19: A new company is created **Active** by default

---

## US-03.3 — Edit company

**As an** Administrator,
**I want to** edit the data of a registered company,
**So that** I can keep the information current (rebranding, contact change, etc.).

### Acceptance Criteria

- [ ] The edit form is pre-filled with the current company data
- [ ] Editable fields: **Trade name**, **Legal name**, **Contact email**, **Contact phone**, **Notes**
- [ ] The **CNPJ** field is read-only after creation
- [ ] On saving, validation rules from US-03.2 apply to the editable fields
- [ ] Email uniqueness is **not** enforced (companies may share a contact email)
- [ ] Displays a success toast after the action
- [ ] The `updatedAt` timestamp is refreshed on each successful save

### Business Rules

- BR-20: **CNPJ is immutable** once a company is created; corrections require deletion + new record (out of MVP scope) or a manual admin override (future US)

---

## US-03.4 — Activate and deactivate company

**As an** Administrator,
**I want to** activate or deactivate a company,
**So that** I can control which partners are authorized to submit status reports without losing historical data.

### Acceptance Criteria

- [ ] In the company list, each record has an action to **Deactivate** (active companies) or **Activate** (inactive companies)
- [ ] When deactivating, the system displays a confirmation before executing
- [ ] A deactivated company cannot have new status reports submitted (enforced by future modules)
- [ ] Historical status reports already submitted by an inactive company remain accessible
- [ ] Displays a success toast after the action
- [ ] The action is reversible without data loss

### Business Rules

- BR-21: Deactivation is a **soft toggle**; company data and historical reports are preserved
- BR-22: Status reports cannot be submitted for companies with `isActive = false` (cross-module — enforced when the status-report module is implemented)

---

## US-03.5 — View company details

**As an** Administrator,
**I want to** open a dedicated view of a single company,
**So that** I can review all stored fields without entering edit mode.

### Acceptance Criteria

- [ ] Clicking a row (or a "View" action) opens a read-only details screen / drawer
- [ ] Displays every persisted field, including audit timestamps (`createdAt`, `updatedAt`) and current status
- [ ] CNPJ is shown formatted
- [ ] Provides quick actions: **Edit**, **Activate/Deactivate**
- [ ] (Future) Displays a summary of status reports submitted by this company

---

## Permission Matrix — Companies

| Action                          | Administrator | User |
|---------------------------------|:---:|:---:|
| List companies                  | Y  | (read-only, future) |
| View company details            | Y  | (read-only, future) |
| Create company                  | Y  | N  |
| Edit company                    | Y  | N  |
| Activate / Deactivate company   | Y  | N  |

---

## Data Model (reference)

`Company`:

| Field            | Type      | Constraints                                       |
|------------------|-----------|---------------------------------------------------|
| `id`             | UUID      | Primary key                                       |
| `tradeName`      | String    | required, max 120                                 |
| `legalName`      | String    | required, max 160                                 |
| `cnpj`           | String(14)| required, **unique**, stored as digits only       |
| `contactEmail`   | String    | required, valid email                             |
| `contactPhone`   | String    | optional, max 32                                  |
| `notes`          | Text      | optional, max 500                                 |
| `isActive`       | Boolean   | default `true`                                    |
| `createdAt`      | DateTime  | default `now()`                                   |
| `updatedAt`      | DateTime  | auto-updated                                      |

Suggested migration name: `create_companies`.

---

## Technical Notes

- New domain module under `apps/api/src/modules/companies/` following DDD conventions already established (entities / value-objects / repositories / use-cases / dtos / presentation / module).
- CNPJ should live as a **value object** (`Cnpj`) that validates and normalizes input — instantiated from raw or formatted strings, exposes both representations.
- Use cases (one per file): `CreateCompanyUseCase`, `UpdateCompanyUseCase`, `ListCompaniesUseCase`, `FindCompanyUseCase`, `ToggleCompanyStatusUseCase`.
- REST surface under `/api/companies`:
  - `GET /companies` (list + filters + pagination)
  - `GET /companies/:id` (details)
  - `POST /companies` (create — Admin only)
  - `PUT /companies/:id` (edit — Admin only, **CNPJ is ignored** if sent)
  - `PATCH /companies/:id/toggle-status` (Admin only)
- All routes are protected by `JwtAuthGuard` + `RolesGuard` with `@Roles('ADMINISTRATOR')` for write actions.
- Frontend feature at `apps/web/src/features/companies/`, mirroring the structure of `features/users/` (page + components + hooks + types).
- Shared contracts in `packages/shared/src/types/company-contracts.ts` (CompanyResponse, CreateCompanyPayload, UpdateCompanyPayload, ListCompaniesParams).
- i18n keys live under `companies.*` in both `en.ts` and `pt-BR.ts`.
- Sidebar (`apps/web/src/app/layout/sidebar.tsx`) adds a new entry under the **Management** group, visible to Administrators only.
- Status report ingestion (future module) must check `company.isActive === true` before accepting any file (BR-22).

---

## Out of Scope (for this US)

- File ingestion for status reports — covered by a future US.
- Linking a Company to specific Users or Projects.
- Mass import (CSV) of companies.
- CNPJ corrections after creation.
