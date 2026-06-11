# NHB Project Delivery

## Overview

Platform for project delivery management and status reporting for the NHB (Norsk Hydro Brazil) client. The single source of truth for delivery data is an annual Excel spreadsheet (`StatusReportBI_YYYY.xlsx`) that the PMO re-uploads every week. The platform parses it, snapshots it as a versioned import, and exposes Project × ISO-week KPIs on the Dashboard. Administrators manage users and own the import flow; standard users see the Dashboard read-only. Built with DDD Clean Architecture.

The current domain modules are: `auth`, `users`, `project-tracking`. The previous `companies`, `status-reports`, and `status-report-goals` modules were retired by US-08 — see `docs/specs/US-08-project-tracking-import.md` and the "Superseded by US-08" section of `docs/specs/README.md`.

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS + shadcn/ui
- **Backend:** NestJS with DDD Clean Architecture + Prisma ORM + PostgreSQL
- **Monorepo:** pnpm workspaces
- **Language:** TypeScript (strict mode)

## Project Structure

```
nhb-project-delivery/
├── apps/api/          → @nhb-status-report/api (NestJS backend)
├── apps/web/          → @nhb-status-report/web (React frontend)
└── packages/shared/   → @nhb-status-report/shared (shared types/contracts)
```

## Commands

```bash
pnpm bootstrap        # First-time setup: install deps, start Docker, migrate DB, run dev servers
pnpm dev              # Run both api and web in parallel
pnpm dev:api          # Run backend only
pnpm dev:web          # Run frontend only
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm test             # Test all packages
pnpm docker:up        # Start PostgreSQL container
pnpm docker:down      # Stop PostgreSQL container
```

## Backend Architecture (apps/api)

Follows DDD Clean Architecture organized by **domain modules** (bounded contexts). Each domain owns its full vertical slice:

```
src/
├── modules/                    # Domain modules (bounded contexts)
│   ├── auth/                   # Authentication domain
│   │   ├── domain/
│   │   │   ├── entities/       # Domain entities with business logic
│   │   │   └── repositories/   # Repository interfaces (contracts only)
│   │   ├── application/
│   │   │   ├── use-cases/      # One class per use case
│   │   │   └── dtos/           # Input/output DTOs
│   │   ├── infrastructure/
│   │   │   └── repositories/   # Repository implementations (using PrismaService)
│   │   ├── presentation/
│   │   │   └── controllers/    # HTTP controllers
│   │   └── auth.module.ts      # NestJS module wiring
│   └── users/                  # User management domain
└── shared/                     # Cross-cutting concerns (shared across domains)
    ├── domain/                 # Base entity, shared interfaces
    └── infrastructure/
        ├── database/           # PrismaService and PrismaModule (global)
        ├── filters/            # Global exception filters
        └── guards/             # Auth/role guards
```

### Backend Rules

- **Domain isolation:** Each module is a self-contained bounded context. Modules communicate via exported services, never by importing internal files from another module.
- **Dependency rule:** Inner layers NEVER import from outer layers. Domain has zero framework dependencies.
- **Repository pattern:** Define interfaces in `modules/<domain>/domain/repositories/`, implement in `modules/<domain>/infrastructure/repositories/`.
- **Use cases:** One class per use case. Inject repository interfaces, not implementations.
- **Path aliases:** Use `@modules/<domain>/` for domain imports, `@shared/` for cross-cutting concerns.
- **Validation:** Use `class-validator` decorators on DTOs. Global `ValidationPipe` is already configured.
- **Entities:** Domain entities extend `BaseEntity` from `@shared/domain/`. Database schema is defined in `prisma/schema.prisma`.
- **Prisma:** `PrismaModule` is global — inject `PrismaService` in any repository. Schema lives at `apps/api/prisma/schema.prisma`.
- **Migrations:** Use `pnpm prisma:migrate` to create/apply migrations. Never edit migration files manually.
- **Environment:** Use `ConfigService` for env vars. Prisma uses `DATABASE_URL`. See `.env.example`.
- **Module boundary:** Only export what other modules need. Keep domain internals private.

### Backend Conventions

- Controllers handle HTTP concerns only — delegate logic to use cases.
- Use constructor injection for all dependencies.
- Prefix all API routes with `/api` (configured globally).
- Return consistent response shapes using `@nhb-status-report/shared` types.
- Each domain module registers itself in `app.module.ts`.

## Frontend Architecture (apps/web)

Feature-based organization with shadcn/ui component library:

```
src/
├── app/               # App shell, routing, providers
├── components/ui/     # shadcn/ui components (auto-generated)
├── features/          # Feature modules (pages + logic together)
├── hooks/             # Shared custom hooks
├── lib/               # Utilities (cn helper, etc.)
├── services/          # API client and service layer
├── styles/            # Global CSS, theme variables
└── types/             # Shared TypeScript types
```

### Frontend Rules

- **shadcn/ui:** Add components via `npx shadcn@latest add <component>` from `apps/web/`. Config is in `components.json`.
- **Path alias:** Use `@/` prefix for all internal imports (maps to `src/`).
- **Features:** Each feature is a self-contained folder with its own components, hooks, and types.
- **Styling:** Use Tailwind utility classes. Use `cn()` helper from `@/lib/utils` to merge class names.
- **Routing:** React Router v6 with route definitions in `src/app/App.tsx`.
- **API calls:** All HTTP requests go through the `services/` layer — never call fetch directly from components.
- **State:** Colocate state in features. Lift to app-level only when shared across multiple features.

### Frontend Conventions

- Components are named exports (not default exports).
- File naming: `kebab-case.tsx` for files, `PascalCase` for components.
- Keep components small and focused. Extract logic into custom hooks.

## Shared Package (packages/shared)

- Contains TypeScript interfaces and types shared between frontend and backend.
- Import as `@nhb-status-report/shared` in both apps.
- Types only — no runtime code, no dependencies.

## New Feature Checklist

When creating any new feature, follow these steps strictly. Do NOT deviate from the folder structure or naming patterns.

### Backend — Adding a New Domain Module (template: the existing `project-tracking` module)

Each domain module is a self-contained bounded context. The reference implementation lives at `apps/api/src/modules/project-tracking/` — when in doubt, mirror its layout. The vertical slice for a hypothetical new module `[domain]` looks like:

```
src/modules/[domain]/
├── domain/
│   ├── entities/[entity].entity.ts                 # Domain entity with business logic
│   ├── repositories/[entity].repository.ts         # Interface + injection token
│   ├── services/[name].service.ts                  # Domain services (e.g., IsoWeekService)
│   └── errors/[domain].errors.ts                   # Domain-specific errors
├── application/
│   ├── dtos/
│   │   ├── [verb]-[entity].dto.ts                  # Input DTO with class-validator
│   │   └── [entity]-response.dto.ts                # Output DTO
│   └── use-cases/
│       ├── [verb]-[entity].use-case.ts             # One file per use case
│       └── index.ts                                # Barrel export
├── infrastructure/
│   ├── repositories/prisma-[entity].repository.ts  # Implements interface using PrismaService
│   └── parsers/                                    # External-format adapters (optional)
├── presentation/
│   ├── controllers/[domain].controller.ts          # HTTP layer, injects use cases
│   └── filters/[domain]-exception.filter.ts        # Maps domain errors to HTTP status codes
└── [domain].module.ts                              # NestJS module wiring
```

Then:
1. Add the Prisma model in `prisma/schema.prisma`
2. Run `pnpm prisma:migrate` to generate migration (if the dev DB state diverges, prefer writing the SQL by hand under `prisma/migrations/<timestamp>_<name>/migration.sql` and apply via `prisma migrate deploy`)
3. Register the module in `src/app.module.ts`

**Naming conventions (backend):**
- Files: `kebab-case.suffix.ts` — e.g., `confirm-import.use-case.ts`
- Classes: `PascalCase` + suffix — e.g., `ConfirmImportUseCase`, `ProjectTrackingController`
- Interfaces: Prefix with `I` — e.g., `IProjectImportRepository`
- DTOs: `[Verb][Entity]Dto`, `[Entity]ResponseDto`
- Use cases: `[Verb][Entity]UseCase`
- Repositories: `Prisma[Entity]Repository` (implementation), `I[Entity]Repository` (interface); inject via string token defined alongside the interface

**Wiring pattern (see `project-tracking.module.ts`):**
```typescript
// Define the injection token next to the interface:
export const PROJECT_IMPORT_REPOSITORY = 'IProjectImportRepository';

// In the module, bind interface to implementation:
{
  provide: PROJECT_IMPORT_REPOSITORY,
  useClass: PrismaProjectImportRepository,
}

// In use cases, inject by token:
constructor(
  @Inject(PROJECT_IMPORT_REPOSITORY)
  private readonly importRepository: IProjectImportRepository,
) {}
```

For file uploads, reuse `StorageModule` from `@shared/infrastructure/storage/` and inject `STORAGE_PROVIDER` — the new module just adds `imports: [StorageModule]`. For role-gated endpoints, apply `@UseGuards(RolesGuard)` at the controller and `@Roles('ADMINISTRATOR')` per handler.

### Frontend — Adding a New Feature (template: the existing `project-tracking` feature)

Each feature is a self-contained module under `src/features/`. The reference implementation lives at `apps/web/src/features/project-tracking/`:

```
src/features/[feature]/
├── components/
│   ├── [thing].tsx                   # Feature-specific components
│   └── [other-thing].tsx
├── hooks/
│   ├── use-[thing].ts                # Custom hooks (useState/useEffect/useCallback — no React Query)
│   └── use-[other-thing].ts
├── types/
│   └── index.ts                      # Re-export shared contracts from @nhb-status-report/shared
├── pages/
│   ├── [feature]-page.tsx            # Route page components
│   └── [feature]-detail-page.tsx
└── index.ts                          # Public API barrel export
```

Then register routes in `src/app/App.tsx`, gating Admin-only pages with `<RoleGuard allowedRoles={['ADMINISTRATOR']}>`. Add the API service in `src/services/[feature].service.ts` consuming `apiClient` (use `postFormData` for multipart uploads, `getBlob` for downloads).

**Naming conventions (frontend):**
- Files: `kebab-case.tsx` for components, `kebab-case.ts` for logic
- Components: `PascalCase` named exports — e.g., `export function DashboardPage()`
- Hooks: `use-` prefix in filename, `use` prefix in function — e.g., `useDashboard()`
- Pages: `[feature]-page.tsx`
- Services: `[feature].service.ts`

**Component rules:**
- Never put business logic in components — extract to hooks.
- Never call API directly in components — use hooks that call services.
- Pattern: `Page → Component → Hook → Service → API`
- Add i18n keys under a top-level namespace per feature (e.g., `projectTracking.*`) in both `pt-BR.ts` and `en.ts`.

### Shared Types — When to Add

Add types to `packages/shared/src/types/` when:
- The same shape is used by both frontend and backend (API contracts)
- Creating a new resource? Add its response type here.

Pattern: `[feature]-contracts.ts` — e.g., `project-tracking-contracts.ts`

Always re-export from `packages/shared/src/index.ts`.

## Code Quality Enforcement

### Forbidden Patterns

- `any` type — use `unknown` and narrow, or define proper types
- `console.log` in production code — use NestJS Logger on backend
- Relative imports crossing layers (e.g., controller importing from `../../domain/`)
- Business logic in controllers or components
- Direct database access outside repository implementations
- Inline styles on frontend — use Tailwind classes
- Default exports — always use named exports
- Barrel exports (`index.ts`) in leaf directories with a single file — only use them in feature roots

### Required Patterns

- All endpoints must validate input via DTOs with `class-validator`
- All use cases must be unit-testable (depend on interfaces, not concrete classes)
- All services on frontend must handle errors and return typed responses
- All new models must be added to `prisma/schema.prisma` with a corresponding migration
- All public API surfaces (controllers, pages) must have their route registered

## General Rules

- **Language:** All code, comments, types, and documentation in English.
- **TypeScript:** Strict mode enabled. No `any` unless absolutely necessary.
- **Formatting:** 2-space indentation, LF line endings, UTF-8 (see `.editorconfig`).
- **Node version:** 20+ (see `.nvmrc`).
- **No secrets in code:** Use environment variables via `.env` files (gitignored).
- **Commits:** Conventional style, concise messages describing the "why".
