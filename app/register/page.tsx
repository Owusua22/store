import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Create a Sally account for faster checkout and order tracking.',
};

export default function RegisterPage() {
  return (
    <div className="container-page py-8 lg:py-12">
      <div className="mx-auto w-full max-w-md rounded-xl border border-line bg-white p-6 sm:p-8">
        <h1 className="text-[20px] font-extrabold text-ink">Create your account</h1>
        <p className="mt-1 text-[12.5px] text-muted">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-brand hover:underline">
            Sign in
          </Link>
        </p>

        <div className="mt-5">
          <Suspense fallback={<p className="text-[12.5px] text-muted">Loading…</p>}>
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
