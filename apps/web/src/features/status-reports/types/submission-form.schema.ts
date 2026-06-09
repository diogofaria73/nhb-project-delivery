import { z } from 'zod';

export const createSubmissionSchema = z.object({
  companyId: z.string().uuid('Company is required'),
  referenceMonth: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Reference month must be YYYY-MM'),
  deliveryEmail: z.string().email('Invalid email address'),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export const updateSubmissionSchema = z.object({
  referenceMonth: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional(),
  deliveryEmail: z.string().email('Invalid email address').optional(),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export type CreateSubmissionFormData = z.infer<typeof createSubmissionSchema>;
export type UpdateSubmissionFormData = z.infer<typeof updateSubmissionSchema>;
