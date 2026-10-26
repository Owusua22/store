// app/api/admin/blog/[id]/route.ts
import { NextResponse } from 'next/server';
import { formatZodError } from '@/lib/validation';
import { readJson, requireAdmin, slugify } from '@/lib/admin/guard';
import { blogPostSchema } from '@/lib/admin/schemas';
import { readingMinutes } from '@/lib/skin-types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const { data, error } = await guard.db
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
  return NextResponse.json({ success: true, data });
}

export async function PUT(request: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const validated = blogPostSchema.partial().safeParse(parsed.body);
  if (!validated.success) {
    return NextResponse.json({ success: false, error: formatZodError(validated.error) }, { status: 400 });
  }

  const input = validated.data;
  const { data: existing } = await guard.db
    .from('blog_posts')
    .select('status, published_at')
    .eq('id', id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });

  const update: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) update[key] = value;
  }

  if (input.slug) update.slug = slugify(input.slug);
  if (typeof input.content === 'string') update.read_minutes = readingMinutes(input.content);

  if (input.status) {
    const wasPublished = existing.status === 'published';
    if (input.status === 'published' && !wasPublished) {
      update.published_at = new Date().toISOString();
    }
    if (input.status === 'draft' && wasPublished) {
      update.published_at = null;
    }
  }

  const { data, error } = await guard.db
    .from('blog_posts')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: Request, context: RouteContext) {
  return PUT(request, context);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const { error } = await guard.db.from('blog_posts').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, message: 'Post deleted' });
}
