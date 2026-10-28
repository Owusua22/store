import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import BlogPostForm, { type BlogFormValues } from '@/components/admin/BlogPostForm';
import { getSkinTypes } from '@/lib/data/skin-types';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { demoBlogPosts } from '@/lib/demo/blog';
import type { BlogPost } from '@/types';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

async function loadPost(id: string): Promise<BlogPost | null> {
  if (isSupabaseConfigured) {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.from('blog_posts').select('*').eq('id', id).maybeSingle();
    return (data as BlogPost | null) ?? null;
  }
  return demoBlogPosts.find((post) => post.id === id) ?? null;
}

export default async function EditBlogPostPage({ params }: Props) {
  const { id } = await params;
  const [post, skinTypes] = await Promise.all([loadPost(id), getSkinTypes()]);

  if (!post) notFound();

  const values: Partial<BlogFormValues> = {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? '',
    content: post.content,
    cover_image: post.cover_image ?? '',
    category: post.category ?? 'Skin care tips',
    tags: (post.tags ?? []).join(', '),
    skin_types: post.skin_types ?? [],
    author_name: post.author_name,
    status: post.status,
    is_featured: post.is_featured,
    seo_title: post.seo_title ?? '',
    seo_description: post.seo_description ?? '',
  };

  return (
    <div>
      <Link
        href="/admin/blog"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-gray-500 hover:text-red-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to blog
      </Link>
      <BlogPostForm
        mode="edit"
        postId={post.id}
        initialValues={values}
        skinTypes={skinTypes}
        demoMode={!isSupabaseConfigured}
      />
    </div>
  );
}
