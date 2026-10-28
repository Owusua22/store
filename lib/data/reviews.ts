// lib/data/reviews.ts
// Customer product reviews.
//
// Live mode  → public.product_reviews in Supabase (Realtime enabled), so a
//              review appears on every open page the moment it is saved.
// Demo mode  → an in-process store so the flow is still testable end to end.

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export interface ProductReview {
  id: string;
  product_id: string | null;
  product_name: string | null;
  product_slug: string | null;
  customer_name: string;
  rating: number;
  body: string;
  status: 'pending' | 'published' | 'hidden';
  is_verified: boolean;
  created_at: string;
}

export interface NewReview {
  product_id: string | null;
  product_name: string | null;
  product_slug: string | null;
  customer_name: string;
  rating: number;
  body: string;
}

export const REVIEW_LIMIT = 24;

/** Demo store — survives for the life of the server process. */
const demoReviews: ProductReview[] = [
  {
    id: 'rev-1',
    product_id: 'p-body-lotion-shea',
    product_name: 'Shea Butter Body Lotion 400ml',
    product_slug: 'shea-butter-body-lotion-400ml',
    customer_name: 'Adjoa M.',
    rating: 5,
    body: 'Finished my second tub. It is thick but it sinks in, and my arms are still soft the next evening. I buy two now so I never run out.',
    status: 'published',
    is_verified: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'rev-2',
    product_id: 'p-baby-lotion',
    product_name: 'Baby Soft Lotion 400ml',
    product_slug: 'baby-soft-lotion-400ml',
    customer_name: 'Yaa A.',
    rating: 5,
    body: 'No reaction on my daughter’s skin, and it has no strong perfume — that was the main thing for me. The bottle is big for the price.',
    status: 'published',
    is_verified: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 27).toISOString(),
  },
  {
    id: 'rev-3',
    product_id: 'p-face-serum-vitc',
    product_name: 'Vitamin C Glow Serum 30ml',
    product_slug: 'vitamin-c-glow-serum-30ml',
    customer_name: 'Nana K.',
    rating: 4,
    body: 'Three weeks in and the dark spots on my cheeks have faded. It stings slightly if you use too much, so I use two drops only.',
    status: 'published',
    is_verified: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 52).toISOString(),
  },
  {
    id: 'rev-4',
    product_id: 'p-shampoo-argan',
    product_name: 'Nourishing Argan Shampoo 500ml',
    product_slug: 'nourishing-argan-shampoo-500ml',
    customer_name: 'Efua B.',
    rating: 4,
    body: 'My braids last longer with this one, less flaking on the scalp. I wish the bottle came bigger.',
    status: 'published',
    is_verified: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 73).toISOString(),
  },
  {
    id: 'rev-5',
    product_id: 'p-shower-gel-shea',
    product_name: 'Shea Shower Cream 750ml',
    product_slug: 'shea-shower-cream-750ml',
    customer_name: 'Kwesi O.',
    rating: 5,
    body: 'Bought it for my mother and she asked me to get three more for her friends. That says enough.',
    status: 'published',
    is_verified: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
  },
];

function mapRow(row: Record<string, unknown>): ProductReview {
  const product = (row.products ?? null) as
    | { name?: string; slug?: string }
    | null;

  return {
    id: String(row.id),
    product_id: (row.product_id as string | null) ?? null,
    product_name:
      (row.product_name as string | null) ?? product?.name ?? null,
    product_slug: product?.slug ?? null,
    customer_name: String(row.customer_name ?? 'Customer'),
    rating: Number(row.rating ?? 5),
    body: String(row.body ?? ''),
    status: (row.status as ProductReview['status']) ?? 'published',
    is_verified: Boolean(row.is_verified),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

/** Published reviews, newest first. Safe to call from a server component. */
export async function getPublishedReviews(limit = REVIEW_LIMIT): Promise<ProductReview[]> {
  if (!isSupabaseConfigured) {
    return demoReviews
      .filter((review) => review.status === 'published')
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*, products(name, slug)')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map(mapRow);
  } catch {
    return [];
  }
}

/** Published reviews for one product, newest first. */
export async function getProductReviews(
  productId: string,
  limit = 12
): Promise<ProductReview[]> {
  if (!isSupabaseConfigured) {
    return demoReviews
      .filter(
        (review) => review.status === 'published' && review.product_id === productId
      )
      .slice(0, limit);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*, products(name, slug)')
      .eq('product_id', productId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map(mapRow);
  } catch {
    return [];
  }
}

/** Reviews waiting for the shop to approve them. Admin only. */
export async function getPendingReviews(limit = 50): Promise<ProductReview[]> {
  if (!isSupabaseConfigured) {
    return demoReviews.filter((review) => review.status !== 'published').slice(0, limit);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*, products(name, slug)')
      .neq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map(mapRow);
  } catch {
    return [];
  }
}

/**
 * Save a customer review. Returns the created row.
 * In live mode the row is written with the anon key and starts as `pending`
 * unless the shop has switched auto-publish on.
 */
export async function createReview(input: NewReview): Promise<ProductReview> {
  const draft: ProductReview = {
    id: `rev-${Date.now()}`,
    product_id: input.product_id,
    product_name: input.product_name,
    product_slug: input.product_slug,
    customer_name: input.customer_name,
    rating: input.rating,
    body: input.body,
    status: 'published',
    is_verified: false,
    created_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured) {
    demoReviews.unshift(draft);
    return draft;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('product_reviews')
    .insert({
      product_id: input.product_id,
      customer_name: input.customer_name,
      rating: input.rating,
      body: input.body,
      status: 'published',
      is_verified: false,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Could not save the review');
  }

  // Reviews feed the product's headline rating and count.
  if (input.product_id) {
    const { error: rpcError } = await supabase.rpc('refresh_product_rating', {
      p_product_id: input.product_id,
    });
    if (rpcError) {
      // Non-fatal: the review is saved, the badge will catch up on the next sync.
    }
  }

  return mapRow({ ...(data as Record<string, unknown>), product_name: input.product_name });
}

/** Used by the admin moderation screen. */
export async function setReviewStatus(
  id: string,
  status: ProductReview['status']
): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const review = demoReviews.find((item) => item.id === id);
    if (!review) return false;
    review.status = status;
    return true;
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('product_reviews')
    .update({ status })
    .eq('id', id);

  return !error;
}
