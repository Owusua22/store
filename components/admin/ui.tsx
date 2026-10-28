// components/admin/ui.tsx
// Small presentational kit shared by the admin screens.
'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-black tracking-tight text-gray-900">{title}</h1>
        {description ? <p className="mt-1 text-[13px] text-gray-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function AdminCard({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white shadow-sm shadow-black/[0.03]',
        padded && 'p-5',
        className
      )}
    >
      {children}
    </div>
  );
}

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
  title?: string;
};

export function AdminButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled,
  className,
  title,
}: ButtonProps) {
  const variants: Record<string, string> = {
    primary: 'bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/20',
    secondary: 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-600 hover:bg-gray-100',
    danger: 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'px-3 py-1.5 text-[12px]' : 'px-4 py-2.5 text-[13px]',
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.08em] text-gray-500">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11.5px] text-gray-400">{hint}</span> : null}
    </label>
  );
}

const inputBase =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-[13.5px] text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input {...rest} className={cn(inputBase, className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea {...rest} className={cn(inputBase, 'min-h-24 resize-y', className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, children, ...rest } = props;
  return (
    <select {...rest} className={cn(inputBase, 'pr-8', className)}>
      {children}
    </select>
  );
}

export function Badge({
  children,
  tone = 'gray',
}: {
  children: ReactNode;
  tone?: 'gray' | 'green' | 'red' | 'amber' | 'blue';
}) {
  const tones: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-600',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold',
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-10 text-center">
      <p className="text-[13.5px] font-bold text-gray-700">{title}</p>
      {hint ? <p className="mt-1 text-[12px] text-gray-500">{hint}</p> : null}
    </div>
  );
}

export function DemoNotice({ children }: { children?: ReactNode }) {
  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-800">
      <strong className="font-bold">Demo mode.</strong>{' '}
      {children ??
        'Changes are saved in this browser only. Add your Supabase keys to .env.local to manage the live store.'}
    </div>
  );
}
