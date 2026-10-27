import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';
import { ShieldCheck, Truck, Wallet } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your Glow-Up account to track orders and check out faster.',
};

export default function LoginPage() {
  return (
    <div className="container-page grid gap-6 py-8 lg:grid-cols-2 lg:py-12">
      <div className="hidden flex-col justify-center rounded-xl bg-ink p-8 text-white lg:flex">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-300">
          Welcome back
        </span>
        <h1 className="mt-2 text-[30px] font-extrabold leading-tight">
          Your skin care routine, saved for you.
        </h1>
        <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-white/70">
          Sign in to check out faster, follow your orders and get member-only deals on
          body lotions, serums and baby care.
        </p>
        <ul className="mt-6 space-y-3 text-[12.5px]">
          {[
            { icon: Truck, text: 'Track deliveries across Ghana' },
            { icon: Wallet, text: 'Pay on delivery or with MoMo' },
            { icon: ShieldCheck, text: '100% authentic products' },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2.5 text-white/80">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                <Icon className="h-3.5 w-3.5" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto w-full max-w-md rounded-xl border border-line bg-white p-6 sm:p-8">
        <h2 className="text-[20px] font-extrabold text-ink">Sign in to Glow-Up</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          New here?{' '}
          <Link href="/register" className="font-bold text-brand hover:underline">
            Create an account
          </Link>
        </p>

        <div className="mt-5">
          <Suspense fallback={<p className="text-[12.5px] text-muted">Loading…</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
