// app/api/reviews/route.ts
// GET  → the newest published reviews (used for the live feed)
// POST → save a customer review and return it
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createReview, getPublishedReviews } from '@/lib/data/reviews';

export const dynamic = 'force-dynamic';

const reviewSchema = z.object({
  customer_name: z
    .string()
    .trim()
    .min(2, 'Please tell us your name')
    .max(60, 'That name is a little too long'),
  rating: z.coerce.number().int().min(1, 'Pick a rating').max(5),
  body: z
    .string()
    .trim()
    .min(12, 'A sentence or two is enough')
    .max(600, 'Please keep it under 600 characters'),
  // Demo catalogue ids are slugs, live ids are uuids — accept both.
  product_id: z.string().trim().max(64).nullable().optional(),
  product_name: z.string().trim().max(120).nullable().optional(),
  product_slug: z.string().trim().max(120).nullable().optional(),
});

export async function GET() {
  const reviews = await getPublishedReviews();
  return NextResponse.json(
    { data: reviews },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body' }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Please check the form' },
      { status: 422 }
    );
  }

  try {
    const review = await createReview({
      product_id: parsed.data.product_id ?? null,
      product_name: parsed.data.product_name ?? null,
      product_slug: parsed.data.product_slug ?? null,
      customer_name: parsed.data.customer_name,
      rating: parsed.data.rating,
      body: parsed.data.body,
    });

    return NextResponse.json({ data: review }, { status: 201 });
  } catch (error) {
    console.error('[reviews] could not save', error);
    return NextResponse.json(
      { error: 'We could not save that review. Please try again.' },
      { status: 500 }
    );
  }
}
