// app/api/admin/blog/route.ts
import { NextResponse } from 'next/server';
import { formatZodError } from '@/lib/validation';
import { readJson, requireAdmin, slugify, uniqueSlug } from '@/lib/admin/guard';
import { blogPostSchema } from '@/lib/admin/schemas';
import { readingMinutes } from '@/lib/skin-types';

// GET — all posts (drafts included)
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('q')?.trim();

  let query = guard.db
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300);

  if (status && status !== 'all') query = query.eq('status', status);
  if (search) query = query.ilike('title', `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// POST — create draft or published post
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const validated = blogPostSchema.safeParse(parsed.body);
  if (!validated.success) {
    return NextResponse.json({ success: false, error: formatZodError(validated.error) }, { status: 400 });
  }

  const input = validated.data;
  const slug = await uniqueSlug(
    guard.db,
    'blog_posts',
    input.slug ? slugify(input.slug) : slugify(input.title)
  );

  const { data, error } = await guard.db
    .from('blog_posts')
    .insert({
      title: input.title,
      slug,
      excerpt: input.excerpt ?? null,
      content: input.content,
      cover_image: input.cover_image ?? null,
      category: input.category ?? null,
      tags: input.tags,
      skin_types: input.skin_types,
      author_name: input.author_name || 'Sally Skin Care',
      status: input.status,
      is_featured: input.is_featured ?? false,
      read_minutes: readingMinutes(input.content),
      published_at: input.status === 'published' ? new Date().toISOString() : null,
      seo_title: input.seo_title ?? null,
      seo_description: input.seo_description ?? null,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data }, { status: 201 });
}
