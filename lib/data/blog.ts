// lib/data/blog.ts
// Blog data access with a demo fallback so /blog works without Supabase.

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { demoBlogPosts, findDemoBlogPost } from '@/lib/demo/blog';
import type { BlogPost } from '@/types';

export interface BlogQuery {
  category?: string;
  skinType?: string;
  tag?: string;
  limit?: number;
  includeDrafts?: boolean;
}

function sortPosts(posts: BlogPost[]) {
  return [...posts].sort(
    (a, b) =>
      new Date(b.published_at ?? b.created_at).getTime() -
      new Date(a.published_at ?? a.created_at).getTime()
  );
}

function filterDemo(query: BlogQuery) {
  let posts = demoBlogPosts.filter(
    (post) => query.includeDrafts || post.status === 'published'
  );

  if (query.category) {
    posts = posts.filter((post) => post.category === query.category);
  }
  if (query.skinType) {
    posts = posts.filter((post) => post.skin_types.includes(query.skinType!));
  }
  if (query.tag) {
    posts = posts.filter((post) => post.tags.includes(query.tag!));
  }

  posts = sortPosts(posts);
  return query.limit ? posts.slice(0, query.limit) : posts;
}

export async function getBlogPosts(query: BlogQuery = {}): Promise<BlogPost[]> {
  if (isSupabaseConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      let request = supabase
        .from('blog_posts')
        .select('*')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (!query.includeDrafts) {
        request = request.eq('status', 'published');
      }
      if (query.category) {
        request = request.eq('category', query.category);
      }
      if (query.skinType) {
        request = request.contains('skin_types', [query.skinType]);
      }
      if (query.tag) {
        request = request.contains('tags', [query.tag]);
      }
      if (query.limit) {
        request = request.limit(query.limit);
      }

      const { data, error } = await request;
      if (error) {
        console.error('getBlogPosts failed:', error.message);
        return [];
      }
      return (data ?? []) as BlogPost[];
    } catch (error) {
      console.error('getBlogPosts failed:', error);
      return [];
    }
  }

  return filterDemo(query);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (isSupabaseConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        console.error('getBlogPostBySlug failed:', error.message);
        return null;
      }
      return (data as BlogPost | null) ?? null;
    } catch (error) {
      console.error('getBlogPostBySlug failed:', error);
      return null;
    }
  }

  return findDemoBlogPost(slug);
}

export async function getRelatedBlogPosts(
  post: BlogPost,
  limit = 3
): Promise<BlogPost[]> {
  const posts = await getBlogPosts({ limit: limit + 4 });
  return posts.filter((candidate) => candidate.id !== post.id).slice(0, limit);
}
