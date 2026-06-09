import { z } from 'zod';

export const periodTypeEnum = z.enum(['QUARTERLY', 'SEMESTRAL', 'ANNUAL']);

export const createGoalSchema = z
  .object({
    periodType: periodTypeEnum,
    year: z.number().int().min(2000).max(2100),
    periodIndex: z.number().int().min(1).max(4).optional(),
    deliveriesPerPeriod: z.number().int().min(1).max(366),
    monthlyDeadlineDay: z.number().int().min(1).max(31),
    notes: z.string().max(500).optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.periodType === 'QUARTERLY') {
      if (!data.periodIndex || data.periodIndex < 1 || data.periodIndex > 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['periodIndex'],
          message: 'Quarter (1-4) is required',
        });
      }
    }
    if (data.periodType === 'SEMESTRAL') {
      if (!data.periodIndex || data.periodIndex < 1 || data.periodIndex > 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['periodIndex'],
          message: 'Semester (1-2) is required',
        });
      }
    }
  });

export const updateGoalSchema = z.object({
  deliveriesPerPeriod: z.number().int().min(1).max(366).optional(),
  monthlyDeadlineDay: z.number().int().min(1).max(31).optional(),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export type CreateGoalFormData = z.infer<typeof createGoalSchema>;
export type UpdateGoalFormData = z.infer<typeof updateGoalSchema>;
