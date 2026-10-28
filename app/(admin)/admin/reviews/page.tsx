// app/(admin)/admin/reviews/page.tsx
// Moderate customer reviews: everything posted is visible on the storefront
// immediately, so this screen is for restoring or hiding one after the fact.
import { getPendingReviews, getPublishedReviews } from '@/lib/data/reviews';
import { ReviewModeration } from './ReviewModeration';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const [published, held] = await Promise.all([
    getPublishedReviews(40),
    getPendingReviews(40),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <p className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-muted">Storefront</p>
        <h1 className="mt-1 font-serif text-[30px] text-ink">Customer reviews</h1>
        <p className="mt-2 max-w-[62ch] text-[12.5px] leading-relaxed text-muted">
          Reviews appear on the home page and on the product page the moment a customer posts
          one — that is the point of it. Use this screen to hide something abusive or to put
          back a review you hid by mistake.
        </p>
      </div>

      <ReviewModeration published={published} held={held} />
    </div>
  );
}
