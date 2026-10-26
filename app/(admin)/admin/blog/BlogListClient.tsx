'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { Clock, ExternalLink, Pencil, Trash2 } from 'lucide-react';

import {
  AdminButton,
  AdminCard,
  Badge,
  DemoNotice,
  EmptyState,
  Input,
  Select,
} from '@/components/admin/ui';
import type { BlogPost } from '@/types';

const STATUS_TONES = {
  published: 'green',
  draft: 'amber',
  archived: 'gray',
} as const;

export default function BlogListClient({
  posts,
  demoMode,
}: {
  posts: BlogPost[];
  demoMode: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      posts.filter((post) => {
        const matchesStatus = status === 'all' || post.status === status;
        const matchesSearch =
          !search.trim() || post.title.toLowerCase().includes(search.trim().toLowerCase());
        return matchesStatus && matchesSearch;
      }),
    [posts, status, search]
  );

  const remove = async (post: BlogPost) => {
    if (demoMode) {
      toast.info('Demo mode: connect Supabase to delete posts.');
      return;
    }
    if (!confirm(`Delete “${post.title}”? This cannot be undone.`)) return;

    setBusyId(post.id);
    try {
      const response = await fetch(`/api/admin/blog/${post.id}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error ?? 'Delete failed');
      toast.success('Post deleted');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      {demoMode ? <DemoNotice /> : null}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search articles…"
          className="max-w-xs"
        />
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="max-w-[180px]"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
          <option value="archived">Archived</option>
        </Select>
        <span className="text-[12px] text-gray-500">
          {filtered.length} article{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No articles match" hint="Try a different status or search term." />
      ) : (
        <AdminCard padded={false}>
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-3 font-bold">Article</th>
                <th className="px-5 py-3 font-bold">Category</th>
                <th className="px-5 py-3 font-bold">Status</th>
                <th className="px-5 py-3 font-bold">Published</th>
                <th className="px-5 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50/60">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded-md bg-gray-100">
                        {post.cover_image ? (
                          <Image
                            src={post.cover_image}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{post.title}</p>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-[11.5px] text-gray-500">
                          <Clock className="h-3 w-3" /> {post.read_minutes} min · /{post.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{post.category ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <Badge tone={STATUS_TONES[post.status] ?? 'gray'}>
                      {post.status === 'published' ? 'Published' : post.status === 'draft' ? 'Draft' : 'Archived'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-gray-500">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1.5">
                      {post.status === 'published' ? (
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-[12px] font-semibold text-gray-600 hover:bg-gray-50"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> View
                        </a>
                      ) : null}
                      <Link
                        href={`/admin/blog/${post.id}/edit`}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                      <AdminButton
                        size="sm"
                        variant="danger"
                        disabled={busyId === post.id}
                        onClick={() => remove(post)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </AdminButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminCard>
      )}
    </div>
  );
}
