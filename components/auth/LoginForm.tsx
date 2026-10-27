'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { Loader2, MailCheck } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { describeAuthError } from '@/lib/auth-errors';
import { site } from '@/lib/site';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  /** Pre-filled from a registration or an auth redirect. */
  defaultEmail?: string;
}

export function LoginForm({ onSuccess, onSwitchToRegister, defaultEmail = '' }: LoginFormProps) {
  const { signIn, resendConfirmation } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: defaultEmail, password: '' },
  });

  useEffect(() => {
    if (defaultEmail) setValue('email', defaultEmail);
  }, [defaultEmail, setValue]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setNeedsConfirmation(false);
      setFormError(null);
      await signIn(data.email.toLowerCase().trim(), data.password);
      toast.success('Welcome back!');
      onSuccess?.();
    } catch (err: unknown) {
      const info = describeAuthError(err);
      setNeedsConfirmation(Boolean(info.needsConfirmation));
      // Inline as well as a toast: the dialog is the only place a shopper can
      // find out why a sign-in failed.
      setFormError(info.message);
      toast.error(info.message, { autoClose: 8000 });
    } finally {
      setIsLoading(false);
    }
  };

  const resend = async () => {
    const target = (getValues('email') || defaultEmail).toLowerCase().trim();
    if (!target) {
      toast.error('Enter your email address first.');
      return;
    }
    setResending(true);
    try {
      await resendConfirmation(target);
      toast.success(`Confirmation email sent to ${target}.`, { autoClose: 8000 });
    } catch (err: unknown) {
      toast.error(describeAuthError(err).message, { autoClose: 8000 });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
        <p className="mt-2 text-sm text-gray-600">
          New to {site.name}?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-medium text-red-600 hover:text-red-500"
          >
            Create an account
          </button>
        </p>
      </div>

      {formError ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-red-800"
        >
          {formError}
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="auth-email" className="mb-1 block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            {...register('email')}
            id="auth-email"
            type="email"
            autoComplete="email"
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="you@example.com"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="auth-password" className="mb-1 block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            {...register('password')}
            id="auth-password"
            type="password"
            autoComplete="current-password"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {needsConfirmation ? (
        <button
          type="button"
          onClick={resend}
          disabled={resending}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-[12.5px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {resending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MailCheck className="h-4 w-4" />
          )}
          Resend confirmation email
        </button>
      ) : null}
    </div>
  );
}

export default LoginForm;
