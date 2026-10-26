import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import BlogPostForm from '@/components/admin/BlogPostForm';
import { getSkinTypes } from '@/lib/data/skin-types';
import { isDemoMode } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';

export default async function NewBlogPostPage() {
  const skinTypes = await getSkinTypes();

  return (
    <div>
      <Link
        href="/admin/blog"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-gray-500 hover:text-red-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to blog
      </Link>
      <BlogPostForm mode="create" skinTypes={skinTypes} demoMode={isDemoMode} />
    </div>
  );
}
