'use client';

// components/reviews/ReviewFeed.tsx
// Live customer reviews. With Supabase configured this listens to the
// product_reviews table over Realtime; without it, it quietly re-checks every
// few seconds so the demo behaves the same way.

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { ProductReview } from '@/lib/data/reviews';

interface ReviewProduct {
  id: string;
  name: string;
  slug: string;
}

interface ReviewFeedProps {
  initialReviews: ProductReview[];
  products: ReviewProduct[];
}

function relativeTime(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function Stars({ rating, size = 11 }: { rating: number; size?: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 align-middle text-sage-deep"
      style={{ fontSize: size }}
      aria-label={`${rating} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((step) => (
        <span key={step} aria-hidden="true" className={step <= rating ? '' : 'text-line'}>
          ★
        </span>
      ))}
    </span>
  );
}

export function ReviewFeed({ initialReviews, products }: ReviewFeedProps) {
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);
  // Demo mode has no socket to wait for, so it counts as live immediately.
  const [live, setLive] = useState(!isSupabaseConfigured);
  const [newIds, setNewIds] = useState<string[]>([]);

  const merge = useCallback((incoming: ProductReview[]) => {
    setReviews((current) => {
      const seen = new Set(current.map((review) => review.id));
      const fresh = incoming.filter((review) => !seen.has(review.id));
      if (fresh.length === 0) return current;
      setNewIds((ids) => [...ids, ...fresh.map((review) => review.id)]);
      return [...fresh, ...current].slice(0, 24);
    });
  }, []);

  const refetch = useCallback(async () => {
    try {
      const response = await fetch('/api/reviews', { cache: 'no-store' });
      if (!response.ok) return;
      const json = (await response.json()) as { data?: ProductReview[] };
      if (Array.isArray(json.data)) merge(json.data);
    } catch {
      /* offline: keep what is on screen */
    }
  }, [merge]);

  // Live subscription (Supabase) or polling (demo mode).
  useEffect(() => {
    if (isSupabaseConfigured) {
      const supabase = createClient();
      if (!supabase) return;

      const channel = supabase
        .channel('product-reviews')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'product_reviews' },
          (payload) => {
            const row = payload.new as Record<string, unknown>;
            if (row.status && row.status !== 'published') return;
            merge([
              {
                id: String(row.id),
                product_id: (row.product_id as string) ?? null,
                product_name: null,
                product_slug: null,
                customer_name: String(row.customer_name ?? 'Customer'),
                rating: Number(row.rating ?? 5),
                body: String(row.body ?? ''),
                status: 'published',
                is_verified: Boolean(row.is_verified),
                created_at: String(row.created_at ?? new Date().toISOString()),
              },
            ]);
            // Pull the joined product name for the new row.
            void refetch();
          }
        )
        .subscribe((status) => setLive(status === 'SUBSCRIBED'));

      return () => {
        void supabase.removeChannel(channel);
      };
    }

    const timer = setInterval(refetch, 8000);
    return () => clearInterval(timer);
  }, [merge, refetch]);

  // Reconcile the server-rendered list with the API as soon as the page is
  // interactive — in demo mode the in-memory store lives in the route handler,
  // so the first paint can be a few seconds behind.
  useEffect(() => {
    const timer = setTimeout(() => void refetch(), 300);
    return () => clearTimeout(timer);
  }, [refetch]);

  // Let the composer tell the feed a review just went in.
  useEffect(() => {
    const onPosted = (event: Event) => {
      const detail = (event as CustomEvent<ProductReview>).detail;
      if (detail) merge([detail]);
      else void refetch();
    };
    window.addEventListener('glowup:review-posted', onPosted);
    return () => window.removeEventListener('glowup:review-posted', onPosted);
  }, [merge, refetch]);

  const average =
    reviews.length > 0
      ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
      : 0;

  return (
    <section id="reviews" className="container-page pt-12 sm:pt-16">
      <div className="section-head">
        <div>
          <span className="section-kicker">Word of mouth</span>
          <h2 className="section-title">What customers actually said</h2>
          <p className="section-subtitle">
            {reviews.length > 0 ? (
              <>
                {reviews.length} notes, averaging {average.toFixed(1)} out of 5. Posted straight
                from the shop — we do not write these.
              </>
            ) : (
              'Be the first to write one.'
            )}
          </p>
        </div>
        <p className="hidden items-center gap-2 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted sm:flex">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              live ? 'bg-sage-deep' : 'bg-line'
            }`}
            aria-hidden="true"
          />
          {live ? 'Updating live' : 'Connecting'}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
        <div>
          {reviews.length === 0 ? (
            <p className="border-t border-line py-8 text-[13px] text-muted">
              No reviews yet. Yours would sit right here.
            </p>
          ) : (
            <ul className="border-t border-line">
              {reviews.map((review) => (
                <li
                  key={review.id}
                  className={`border-b border-line py-4 ${
                    newIds.includes(review.id) ? 'fade-up' : ''
                  }`}
                >
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span className="font-serif text-[15px] text-ink">
                      {review.customer_name}
                    </span>
                    <Stars rating={review.rating} />
                    <span
                      className="text-[10.5px] uppercase tracking-[0.1em] text-muted"
                      suppressHydrationWarning
                    >
                      {relativeTime(review.created_at)}
                    </span>
                    {review.is_verified && (
                      <span className="border border-sage/50 px-1.5 py-px text-[9px] font-bold uppercase tracking-[0.12em] text-sage-deep">
                        Bought it
                      </span>
                    )}
                  </div>

                  <p className="mt-1.5 max-w-[62ch] text-[13px] leading-[1.65] text-gray-700">
                    {review.body}
                  </p>

                  {review.product_name && (
                    <Link
                      href={review.product_slug ? `/products/${review.product_slug}` : '/products'}
                      className="mt-1.5 inline-block text-[10px] font-bold uppercase tracking-[0.14em] text-sage-deep hover:underline"
                    >
                      {review.product_name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <ReviewComposer products={products} onPosted={refetch} />
      </div>
    </section>
  );
}

/* ── The form ───────────────────────────────────────────────── */

function ReviewComposer({
  products,
  onPosted,
}: {
  products: ReviewProduct[];
  onPosted: () => void;
}) {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [productId, setProductId] = useState(products[0]?.id ?? '');
  const [body, setBody] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const selected = products.find((product) => product.id === productId);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (state === 'sending') return;

    setState('sending');
    setError(null);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          rating,
          body,
          product_id: productId || null,
          product_name: selected?.name ?? null,
          product_slug: selected?.slug ?? null,
        }),
      });

      const json = (await response.json()) as { data?: ProductReview; error?: string };
      if (!response.ok) throw new Error(json.error ?? 'Could not post that review');

      setState('sent');
      setBody('');
      setRating(5);
      if (json.data) {
        window.dispatchEvent(
          new CustomEvent<ProductReview>('glowup:review-posted', {
            detail: { ...json.data, product_name: selected?.name ?? null, product_slug: selected?.slug ?? null },
          })
        );
      }
      onPosted();
      setTimeout(() => setState('idle'), 4000);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not post that review');
      setState('idle');
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      className="h-fit border border-line bg-white p-5 sm:p-6"
      aria-labelledby="review-form-heading"
    >
      <h3 id="review-form-heading" className="font-serif text-[21px] text-ink">
        Leave a note
      </h3>
      <p className="mt-1 text-[12px] leading-relaxed text-muted">
        Bought something? Say how it went. It appears here immediately.
      </p>

      <div className="mt-4">
        <span className="field-label">Your rating</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => setRating(step)}
              aria-label={`${step} star${step > 1 ? 's' : ''}`}
              aria-pressed={rating === step}
              className={`text-[19px] leading-none transition-colors ${
                step <= rating ? 'text-sage-deep' : 'text-line hover:text-sage'
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <label className="field-label" htmlFor="review-product">
          Which product
        </label>
        <select
          id="review-product"
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
          className="field-input"
        >
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3">
        <label className="field-label" htmlFor="review-name">
          Your name
        </label>
        <input
          id="review-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Adjoa M."
          className="field-input"
          required
          minLength={2}
          maxLength={60}
          autoComplete="name"
        />
      </div>

      <div className="mt-3">
        <label className="field-label" htmlFor="review-body">
          What did you think
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={4}
          placeholder="It is thick but it sinks in, and my arms are still soft the next evening…"
          className="field-input resize-y"
          required
          minLength={12}
          maxLength={600}
        />
      </div>

      {error && (
        <p className="mt-2 text-[12px] font-semibold text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={state === 'sending'}
        className="btn-brand mt-4 h-10 w-full text-[11.5px] uppercase tracking-[0.12em] disabled:opacity-60"
      >
        {state === 'sending' ? 'Posting…' : state === 'sent' ? 'Thank you — posted' : 'Post review'}
      </button>

      <p className="mt-2 text-[10.5px] leading-relaxed text-muted">
        Your name and words only. No email, no account needed.
      </p>
    </form>
  );
}

export default ReviewFeed;
