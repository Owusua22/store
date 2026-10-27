// lib/auth-errors.ts
// Maps Supabase auth failures (and the raw HTTP 400s they produce) to copy a
// shopper can act on.

export interface AuthErrorInfo {
  message: string;
  /** True when the account exists but the email was never confirmed. */
  needsConfirmation?: boolean;
  code?: string;
}

interface SupabaseLikeError {
  message?: string;
  code?: string;
  status?: number;
  error_code?: string;
}

export function describeAuthError(error: unknown): AuthErrorInfo {
  const raw =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : ((error as SupabaseLikeError)?.message ?? 'Something went wrong. Please try again.');

  const code =
    (error as SupabaseLikeError)?.code ??
    (error as SupabaseLikeError)?.error_code ??
    '';
  const text = raw.toLowerCase();

  if (
    code === 'email_not_confirmed' ||
    text.includes('email not confirmed') ||
    text.includes('email_not_confirmed')
  ) {
    return {
      message:
        'This email has not been confirmed yet. Open the confirmation link we emailed you, then sign in — or resend it below.',
      needsConfirmation: true,
      code,
    };
  }

  if (text.includes('invalid login credentials') || text.includes('invalid_credentials')) {
    return {
      message:
        'Wrong email or password. If you only just registered, confirm your email first — unconfirmed accounts cannot sign in.',
      needsConfirmation: true,
      code,
    };
  }

  if (text.includes('user already registered') || text.includes('already been registered')) {
    return {
      message: 'That email already has an account. Sign in instead.',
      code,
    };
  }

  if (text.includes('password should be at least') || text.includes('weak_password')) {
    return {
      message: 'That password is too weak. Use at least 8 characters with a number and a capital letter.',
      code,
    };
  }

  if (text.includes('rate limit') || text.includes('for security purposes') || text.includes('too many requests')) {
    return {
      message: 'Too many attempts. Please wait a minute and try again.',
      code,
    };
  }

  if (text.includes('invalid email') || text.includes('unable to validate email')) {
    return { message: 'That email address does not look right. Check it and try again.', code };
  }

  if (text.includes('failed to fetch') || text.includes('networkerror')) {
    return {
      message: 'We could not reach the sign-in service. Check your connection and try again.',
      code,
    };
  }

  return { message: raw, code };
}
