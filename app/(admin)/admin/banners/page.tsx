// app/(admin)/admin/banners/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';

export default async function BannersPage() {
  const supabase = await createServerSupabaseClient();

  const { data: banners } = await supabase
    .from('banners')
    .select('*')
    .order('archived', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  const active = banners?.filter((b) => !b.archived) || [];
  const archived = banners?.filter((b) => b.archived) || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Banners</h1>
          <p className="text-gray-500 mt-1">Manage carousel banners for the homepage</p>
        </div>
        <Link
          href="/admin/banners/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          + New Banner
        </Link>
      </div>

      {/* Active Banners */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Active ({active.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {active.map((banner) => (
            <div key={banner.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
              <div className="relative h-48 bg-gray-100">
                <Image
                  src={banner.image_url}
                  alt={banner.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-black" style={{ opacity: banner.overlay_opacity || 0.4 }} />
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  {banner.subtitle && (
                    <p className="text-sm font-medium mb-1" style={{ color: banner.text_color || '#FFFFFF' }}>
                      {banner.subtitle}
                    </p>
                  )}
                  <h3 className="text-xl font-bold" style={{ color: banner.text_color || '#FFFFFF' }}>
                    {banner.title}
                  </h3>
                </div>
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    banner.is_active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                  }`}>
                    {banner.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-black/50 text-white">
                    #{banner.sort_order}
                  </span>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  {banner.link_url && (
                    <p className="text-sm text-gray-500 truncate max-w-[200px]">
                      → {banner.link_url}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/banners/${banner.id}/edit`}
                    className="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {active.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-3">🖼️</div>
            <p className="text-gray-500 mb-4">No banners yet</p>
            <Link href="/admin/banners/new" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Create your first banner →
            </Link>
          </div>
        )}
      </div>

      {/* Archived */}
      {archived.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Archived ({archived.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {archived.map((banner) => (
              <div key={banner.id} className="bg-white rounded-xl border border-gray-200 p-4 opacity-60">
                <div className="relative h-24 rounded-lg overflow-hidden bg-gray-100 mb-3">
                  <Image src={banner.image_url} alt={banner.title} fill className="object-cover grayscale" sizes="33vw" />
                </div>
                <p className="font-medium text-gray-900 text-sm">{banner.title}</p>
                <Link
                  href={`/admin/banners/${banner.id}/edit`}
                  className="text-sm text-indigo-600 hover:text-indigo-700 mt-2 inline-block"
                >
                  Edit / Restore
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}