// src/lib/validation.ts
import { ZodError } from 'zod';

/**
 * Format a ZodError into a single human-readable string.
 * Works with both Zod v3 (.errors) and Zod v4 (.issues).
 */
export function formatZodError(error: ZodError): string {
  // Zod v4 uses `.issues`; v3 used `.errors` (still aliased in some versions)
  const issues = error.issues ?? [];
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
      return `${path}${issue.message}`;
    })
    .join(', ');
}