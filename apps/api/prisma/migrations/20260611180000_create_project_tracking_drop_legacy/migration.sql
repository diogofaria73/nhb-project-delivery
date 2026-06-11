-- Drop legacy Status Report / Companies / Goals modules and create Project Tracking module.
-- US-08 makes the annual spreadsheet the single source of truth; per-company submissions are no longer modeled.

-- 1. Drop legacy tables in FK-safe order.
DROP TABLE IF EXISTS "status_report_attachments";
DROP TABLE IF EXISTS "status_report_submissions";
DROP TABLE IF EXISTS "status_report_goals";
DROP TABLE IF EXISTS "companies";

-- 2. Drop legacy enums no longer referenced.
DROP TYPE IF EXISTS "GoalPeriodType";

-- 3. Create new enums for project tracking.
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'NOT_STARTED');
CREATE TYPE "ProjectImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'ACTIVE', 'SUPERSEDED', 'FAILED');

-- 4. ProjectImport — one row per uploaded spreadsheet (snapshot of the whole portfolio for a reference year).
CREATE TABLE "project_imports" (
  "id"                TEXT                   PRIMARY KEY,
  "reference_year"    INTEGER                NOT NULL,
  "status"            "ProjectImportStatus"  NOT NULL DEFAULT 'PENDING',
  "original_filename" TEXT                   NOT NULL,
  "file_size_bytes"   INTEGER                NOT NULL,
  "sha256"            TEXT                   NOT NULL,
  "storage_key"       TEXT                   NOT NULL,
  "parse_report"      JSONB                  NOT NULL,
  "rows_accepted"     INTEGER                NOT NULL DEFAULT 0,
  "rows_rejected"     INTEGER                NOT NULL DEFAULT 0,
  "imported_by_id"    TEXT                   NOT NULL,
  "imported_at"       TIMESTAMP(3)           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_imports_imported_by_id_fkey"
    FOREIGN KEY ("imported_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "project_imports_reference_year_status_idx"
  ON "project_imports" ("reference_year", "status");
CREATE INDEX "project_imports_imported_at_idx"
  ON "project_imports" ("imported_at");

-- Partial unique index: at most one ACTIVE import per reference_year.
-- This is the BR-54 safety net; application code in confirm/restore use cases is the primary enforcement.
CREATE UNIQUE INDEX "project_imports_one_active_per_year"
  ON "project_imports" ("reference_year")
  WHERE "status" = 'ACTIVE';

-- 5. ProjectSnapshot — one row per project in a given import.
CREATE TABLE "project_snapshots" (
  "id"                  TEXT            PRIMARY KEY,
  "import_id"           TEXT            NOT NULL,
  "project_id"          TEXT            NOT NULL,
  "project_name"        TEXT            NOT NULL,
  "project_status"      "ProjectStatus" NOT NULL,
  "responsible"         TEXT,
  "responsible_detail"  TEXT,
  "pm"                  TEXT,
  "notes"               TEXT,
  -- 8 bytes = 64 bits. We use bits 0..52 (ISO weeks 1..53). bit (week - 1).
  "week_flags"          BYTEA           NOT NULL,
  "weeks_sent"          INTEGER         NOT NULL DEFAULT 0,
  "weeks_expected"      INTEGER         NOT NULL DEFAULT 0,
  "first_active_week"   INTEGER,
  "last_sent_week"      INTEGER,
  CONSTRAINT "project_snapshots_import_id_fkey"
    FOREIGN KEY ("import_id") REFERENCES "project_imports"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "project_snapshots_import_id_idx"
  ON "project_snapshots" ("import_id");
CREATE INDEX "project_snapshots_import_id_project_status_idx"
  ON "project_snapshots" ("import_id", "project_status");
