import { Prisma } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import { MonthlyAggregateRow } from './analytics-shared';

/**
 * Returns one row per (month, company) within [from, to]. Each row carries the
 * classification (on-time / late / missed / inactive) computed entirely in SQL
 * to avoid N+1 round trips from the application layer.
 *
 * - `is_eligible`: the company was created on or before the last day of the
 *    month and is currently active. Inactive companies are still considered
 *    eligible for PAST months in which they were created — historical accuracy.
 *    The simple definition: eligible iff company.createdAt <= end_of_month.
 * - `status`:
 *    * 'inactive' when not eligible (no expected delivery)
 *    * 'on-time' when at least one submission exists for that (company, month)
 *       with submittedAt <= end_of_month
 *    * 'late' when at least one submission exists but the earliest is after end_of_month
 *    * 'missed' when eligible but no submission exists
 *
 * When `companyId` is provided, the result is scoped to that single company.
 */
export async function fetchMonthlyAggregate(
  prisma: PrismaService,
  from: Date,
  to: Date,
  companyId?: string,
): Promise<MonthlyAggregateRow[]> {
  const companyFilter = companyId
    ? Prisma.sql`AND c.id = ${companyId}::uuid`
    : Prisma.empty;

  const rows = await prisma.$queryRaw<MonthlyAggregateRow[]>(Prisma.sql`
    WITH months AS (
      SELECT generate_series(${from}::date, ${to}::date, '1 month')::date AS month
    ),
    eligible AS (
      SELECT m.month, c.id AS company_id, c.trade_name,
        (c.created_at <= (m.month + interval '1 month' - interval '1 millisecond')) AS is_eligible
      FROM months m
      CROSS JOIN companies c
      WHERE TRUE ${companyFilter}
    ),
    earliest AS (
      SELECT s.company_id, date_trunc('month', s.reference_month)::date AS month,
             MIN(s.submitted_at) AS first_submission_at
      FROM status_report_submissions s
      WHERE s.reference_month BETWEEN ${from}::date AND ${to}::date
        ${companyId ? Prisma.sql`AND s.company_id = ${companyId}::uuid` : Prisma.empty}
      GROUP BY s.company_id, date_trunc('month', s.reference_month)
    )
    SELECT
      e.month,
      e.company_id,
      e.trade_name,
      e.is_eligible,
      ea.first_submission_at,
      CASE
        WHEN NOT e.is_eligible THEN 'inactive'
        WHEN ea.first_submission_at IS NULL THEN 'missed'
        WHEN ea.first_submission_at <= (e.month + interval '1 month' - interval '1 millisecond')
             THEN 'on-time'
        ELSE 'late'
      END AS status
    FROM eligible e
    LEFT JOIN earliest ea ON ea.company_id = e.company_id AND ea.month = e.month
    ORDER BY e.month ASC, e.trade_name ASC
  `);
  return rows;
}
