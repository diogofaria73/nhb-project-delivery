import { Prisma } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';

export interface GoalAggregateRow {
  company_id: string;
  trade_name: string;
  delivered: number;
  on_time: number;
}

/**
 * Per-company aggregation over a goal's period.
 *
 * For each currently-active company that already existed by the end of the
 * period, returns the total count of submissions whose `referenceMonth` lies
 * in `[startDate, endDate]` and the subset of those that were sent before the
 * monthly deadline (auto-clamped to the last day of the month when the
 * deadline day does not exist).
 *
 * `late = delivered - on_time` is computed in the application layer.
 */
export async function fetchGoalAggregate(
  prisma: PrismaService,
  startDate: Date,
  endDate: Date,
  deadlineDay: number,
): Promise<GoalAggregateRow[]> {
  return prisma.$queryRaw<GoalAggregateRow[]>(Prisma.sql`
    SELECT
      c.id AS company_id,
      c.trade_name,
      COALESCE(COUNT(s.id), 0)::int AS delivered,
      COALESCE(SUM(
        CASE
          WHEN s.submitted_at <=
            (
              date_trunc('month', s.reference_month) +
              (
                LEAST(
                  ${deadlineDay}::int,
                  EXTRACT(DAY FROM date_trunc('month', s.reference_month)
                                       + interval '1 month'
                                       - interval '1 day')::int
                ) - 1
              ) * interval '1 day'
              + interval '23 hours 59 minutes 59 seconds'
            )
          THEN 1 ELSE 0
        END
      ), 0)::int AS on_time
    FROM companies c
    LEFT JOIN status_report_submissions s
      ON s.company_id = c.id
     AND s.reference_month BETWEEN ${startDate}::date AND ${endDate}::date
    WHERE c.is_active = true
      AND c.created_at <= ${endDate}::date
    GROUP BY c.id, c.trade_name
    ORDER BY c.trade_name ASC
  `);
}
