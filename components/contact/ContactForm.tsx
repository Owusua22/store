'use client';

import { useState } from 'react';
import { Check, Loader2, Send } from 'lucide-react';

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('sending');
    setTimeout(() => setStatus('sent'), 700);
  };

  if (status === 'sent') {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl bg-brand-soft px-6 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white">
          <Check className="h-6 w-6" />
        </span>
        <h3 className="mt-3 text-[16px] font-extrabold text-ink">Message sent</h3>
        <p className="mt-1 max-w-sm text-[12.5px] text-gray-600">
          Thanks for reaching out. Our team replies within a few hours during business
          hours — usually much faster on WhatsApp.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="btn-brand mt-4 h-9 px-4 text-[12.5px]"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-gray-700">
            First name
          </span>
          <input
            required
            type="text"
            placeholder="Ama"
            className="h-11 w-full rounded-lg border border-line px-3 text-[13px] outline-none focus:border-brand"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-gray-700">
            Last name
          </span>
          <input
            type="text"
            placeholder="Mensah"
            className="h-11 w-full rounded-lg border border-line px-3 text-[13px] outline-none focus:border-brand"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-[12px] font-semibold text-gray-700">
          Email address
        </span>
        <input
          required
          type="email"
          placeholder="you@example.com"
          className="h-11 w-full rounded-lg border border-line px-3 text-[13px] outline-none focus:border-brand"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-[12px] font-semibold text-gray-700">Subject</span>
        <input
          type="text"
          placeholder="Order, delivery, product question…"
          className="h-11 w-full rounded-lg border border-line px-3 text-[13px] outline-none focus:border-brand"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-[12px] font-semibold text-gray-700">Message</span>
        <textarea
          required
          rows={5}
          placeholder="Tell us how we can help"
          className="w-full rounded-lg border border-line px-3 py-2.5 text-[13px] outline-none focus:border-brand"
        />
      </label>

      <button
        type="submit"
        disabled={status === 'sending'}
        className="btn-brand h-11 w-full text-[13px] disabled:opacity-70"
      >
        {status === 'sending' ? (
          <>
            Sending <Loader2 className="h-4 w-4 animate-spin" />
          </>
        ) : (
          <>
            Send message <Send className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
