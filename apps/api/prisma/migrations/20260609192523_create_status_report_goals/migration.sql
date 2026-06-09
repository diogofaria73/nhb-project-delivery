-- CreateEnum
CREATE TYPE "GoalPeriodType" AS ENUM ('QUARTERLY', 'SEMESTRAL', 'ANNUAL');

-- CreateTable
CREATE TABLE "status_report_goals" (
    "id" TEXT NOT NULL,
    "period_type" "GoalPeriodType" NOT NULL,
    "year" INTEGER NOT NULL,
    "period_index" INTEGER,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "target" DECIMAL(5,2) NOT NULL,
    "minimum_monthly_deliveries" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT NOT NULL,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "status_report_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "status_report_goals_start_date_end_date_idx" ON "status_report_goals"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "status_report_goals_is_archived_idx" ON "status_report_goals"("is_archived");

-- CreateIndex
CREATE UNIQUE INDEX "status_report_goals_period_type_year_period_index_key" ON "status_report_goals"("period_type", "year", "period_index");

-- AddForeignKey
ALTER TABLE "status_report_goals" ADD CONSTRAINT "status_report_goals_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_report_goals" ADD CONSTRAINT "status_report_goals_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
