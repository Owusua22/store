'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import type { ProductReview } from '@/lib/data/reviews';

interface ReviewModerationProps {
  published: ProductReview[];
  held: ProductReview[];
}

export function ReviewModeration({ published, held }: ReviewModerationProps) {
  const [rows, setRows] = useState<{ published: ProductReview[]; held: ProductReview[] }>({
    published,
    held,
  });
  const [busy, setBusy] = useState<string | null>(null);

  const move = async (review: ProductReview, status: 'published' | 'hidden') => {
    setBusy(review.id);
    try {
      const response = await fetch(`/api/admin/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Could not update that review');

      setRows((current) => {
        const without = {
          published: current.published.filter((row) => row.id !== review.id),
          held: current.held.filter((row) => row.id !== review.id),
        };
        const updated = { ...review, status };
        return status === 'published'
          ? { published: [updated, ...without.published], held: without.held }
          : { published: without.published, held: [updated, ...without.held] };
      });

      toast.success(status === 'published' ? 'Review is live again' : 'Review hidden');
    } catch {
      toast.error('Could not update that review');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-baseline justify-between border-b border-line pb-2">
          <h2 className="font-serif text-[20px] text-ink">Live on the site</h2>
          <span className="text-[10.5px] uppercase tracking-[0.14em] text-muted">
            {rows.published.length} shown
          </span>
        </div>

        {rows.published.length === 0 ? (
          <p className="py-6 text-[12.5px] text-muted">Nothing published yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.published.map((review) => (
              <li key={review.id} className="py-4">
                <ReviewRow review={review} />
                <button
                  type="button"
                  disabled={busy === review.id}
                  onClick={() => move(review, 'hidden')}
                  className="mt-2 border border-line px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-700 hover:border-ink hover:text-ink disabled:opacity-50"
                >
                  {busy === review.id ? 'Working…' : 'Hide from the site'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-baseline justify-between border-b border-line pb-2">
          <h2 className="font-serif text-[20px] text-ink">Hidden</h2>
          <span className="text-[10.5px] uppercase tracking-[0.14em] text-muted">
            {rows.held.length} kept back
          </span>
        </div>

        {rows.held.length === 0 ? (
          <p className="py-6 text-[12.5px] text-muted">Nothing hidden.</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.held.map((review) => (
              <li key={review.id} className="py-4">
                <ReviewRow review={review} />
                <button
                  type="button"
                  disabled={busy === review.id}
                  onClick={() => move(review, 'published')}
                  className="mt-2 border border-sage-deep px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-sage-deep hover:bg-sage-deep hover:text-paper disabled:opacity-50"
                >
                  {busy === review.id ? 'Working…' : 'Put it back on the site'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ReviewRow({ review }: { review: ProductReview }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-2.5">
        <span className="font-serif text-[15px] text-ink">{review.customer_name}</span>
        <span className="text-[11px] text-sage-deep" aria-label={`${review.rating} out of 5`}>
          {'★'.repeat(review.rating)}
          <span className="text-line">{'★'.repeat(5 - review.rating)}</span>
        </span>
        <span className="text-[10px] uppercase tracking-[0.1em] text-muted">
          {new Date(review.created_at).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
        {review.product_name && (
          <span className="border border-line px-1.5 py-px text-[9.5px] uppercase tracking-[0.1em] text-muted">
            {review.product_name}
          </span>
        )}
      </div>
      <p className="mt-1.5 max-w-[70ch] text-[12.5px] leading-relaxed text-gray-700">
        {review.body}
      </p>
    </div>
  );
}
