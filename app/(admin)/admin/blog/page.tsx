import Link from 'next/link';
import { Plus } from 'lucide-react';

import { getBlogPosts } from '@/lib/data/blog';
import { isDemoMode } from '@/lib/supabase/config';
import { AdminPageHeader } from '@/components/admin/ui';
import BlogListClient from './BlogListClient';

export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  const posts = await getBlogPosts({ includeDrafts: true, limit: 200 });

  return (
    <div>
      <AdminPageHeader
        title="Blog"
        description="Publish routines, ingredient guides and baby care advice. Published posts appear at /blog."
        action={
          <Link
            href="/admin/blog/new"
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-red-600/20 hover:bg-red-700"
          >
            <Plus className="h-4 w-4" /> New article
          </Link>
        }
      />

      <BlogListClient posts={posts} demoMode={isDemoMode} />
    </div>
  );
}
