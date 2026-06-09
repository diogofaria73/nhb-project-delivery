-- Replace `target` + `minimum_monthly_deliveries` with `deliveries_per_period`
-- and `monthly_deadline_day` (per US-06 revision).
--
-- Backfill rule:
--   deliveries_per_period = minimum_monthly_deliveries × months_in_period
--   monthly_deadline_day  = 25 (admin should revisit each existing goal)

ALTER TABLE "status_report_goals"
  ADD COLUMN "deliveries_per_period" INTEGER,
  ADD COLUMN "monthly_deadline_day" INTEGER NOT NULL DEFAULT 25;

UPDATE "status_report_goals"
SET "deliveries_per_period" = "minimum_monthly_deliveries" * CASE "period_type"
  WHEN 'QUARTERLY' THEN 3
  WHEN 'SEMESTRAL' THEN 6
  WHEN 'ANNUAL'    THEN 12
  ELSE 3
END
WHERE "deliveries_per_period" IS NULL;

ALTER TABLE "status_report_goals"
  ALTER COLUMN "deliveries_per_period" SET NOT NULL;

ALTER TABLE "status_report_goals"
  DROP COLUMN "target",
  DROP COLUMN "minimum_monthly_deliveries";
