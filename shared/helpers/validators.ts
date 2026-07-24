import { z, ZodSchema } from 'zod';
import { ValidationError } from '../errors/errors';

export const commonSchemas = {
  email: z.string().email('Please enter a valid email address'),
  id: z.string().min(1, 'ID cannot be empty'),
  nonEmptyString: z.string().trim().min(1, 'Field cannot be empty'),
};

export function validateData<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issueMessages = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(`Validation failed: ${issueMessages}`, result.error.format());
  }
  return result.data;
}
