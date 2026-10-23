'use client';

import { useState } from 'react';
import { Check, Loader2, Mail } from 'lucide-react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');

    try {
      const list = JSON.parse(
        window.localStorage.getItem('sally-newsletter') ?? '[]'
      ) as string[];
      if (!list.includes(value)) list.push(value);
      window.localStorage.setItem('sally-newsletter', JSON.stringify(list));
    } catch {
      /* ignore storage errors */
    }

    setTimeout(() => {
      setStatus('done');
      setMessage('You are on the list! Watch out for our next drop.');
      setEmail('');
    }, 450);
  };

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex h-11 items-center overflow-hidden rounded-lg border border-line bg-white focus-within:border-brand">
        <Mail className="ml-3 h-4 w-4 shrink-0 text-gray-400" />
        <input
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status !== 'idle') {
              setStatus('idle');
              setMessage('');
            }
          }}
          type="email"
          required
          placeholder="Your email address"
          aria-label="Email address"
          className="h-full w-full bg-transparent px-2.5 text-[13px] outline-none placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="m-1 flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-ink px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-brand disabled:opacity-60"
        >
          {status === 'loading' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : status === 'done' ? (
            <Check className="h-3.5 w-3.5" />
          ) : null}
          Subscribe
        </button>
      </div>
      {message && (
        <p
          className={`mt-2 text-[11.5px] font-semibold ${
            status === 'error' ? 'text-red-600' : 'text-emerald-600'
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
