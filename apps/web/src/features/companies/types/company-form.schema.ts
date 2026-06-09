import { z } from 'zod';
import { isValidCnpj } from '@/lib/cnpj';

export const createCompanySchema = z.object({
  tradeName: z.string().min(2, 'Trade name must have at least 2 characters').max(120),
  legalName: z.string().min(2, 'Legal name must have at least 2 characters').max(160),
  cnpj: z
    .string()
    .min(1, 'CNPJ is required')
    .refine((value) => isValidCnpj(value), { message: 'Invalid CNPJ' }),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().max(32).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export const updateCompanySchema = z.object({
  tradeName: z.string().min(2).max(120).optional(),
  legalName: z.string().min(2).max(160).optional(),
  contactEmail: z.string().email('Invalid email address').optional(),
  contactPhone: z.string().max(32).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export type CreateCompanyFormData = z.infer<typeof createCompanySchema>;
export type UpdateCompanyFormData = z.infer<typeof updateCompanySchema>;
