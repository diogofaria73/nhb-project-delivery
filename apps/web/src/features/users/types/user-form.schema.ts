import { z } from 'zod';

export const createUserSchema = z
  .object({
    name: z.string().min(2, 'Name must have at least 2 characters'),
    email: z.string().email('Invalid email address'),
    role: z.enum(['ADMINISTRATOR', 'USER'], {
      message: 'Role is required',
    }),
    password: z.string().min(8, 'Password must have at least 8 characters'),
    passwordConfirmation: z.string().min(8, 'Password confirmation is required'),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Passwords do not match',
    path: ['passwordConfirmation'],
  });

export const updateUserSchema = z
  .object({
    name: z.string().min(2, 'Name must have at least 2 characters').optional(),
    email: z.string().email('Invalid email address').optional(),
    role: z.enum(['ADMINISTRATOR', 'USER']).optional(),
    password: z
      .string()
      .min(8, 'Password must have at least 8 characters')
      .optional()
      .or(z.literal('')),
    passwordConfirmation: z.string().optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.password && data.password.length > 0) {
        return data.password === data.passwordConfirmation;
      }
      return true;
    },
    {
      message: 'Passwords do not match',
      path: ['passwordConfirmation'],
    },
  );

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
