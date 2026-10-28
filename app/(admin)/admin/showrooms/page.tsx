// app/(admin)/admin/showrooms/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';

const TYPE_LABELS: Record<string, string> = {
  manual: 'Manual',
  auto_new: 'New Arrivals',
  auto_deals: 'Deals',
  auto_bestselling: 'Best Selling',
};

export default async function ShowroomsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: showrooms } = await supabase
    .from('showrooms')
    .select('*')
    .order('archived', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  const active = showrooms?.filter((s) => !s.archived) || [];
  const archived = showrooms?.filter((s) => s.archived) || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Showrooms</h1>
          <p className="text-gray-500 mt-1">Manage featured collections and curated product displays</p>
        </div>
        <Link
          href="/admin/showrooms/new"
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          + New Showroom
        </Link>
      </div>

      {/* Active Showrooms */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Active ({active.length})
        </h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Showroom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Homepage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {active.map((showroom) => (
                <tr key={showroom.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{showroom.icon || '🏪'}</span>
                      <div>
                        <p className="font-medium text-gray-900">{showroom.name}</p>
                        {showroom.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">{showroom.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {TYPE_LABELS[showroom.type] || showroom.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${showroom.show_on_homepage ? 'text-green-600' : 'text-gray-400'}`}>
                      {showroom.show_on_homepage ? '✓ Yes' : '✗ No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {showroom.sort_order}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      showroom.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {showroom.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/showrooms/${showroom.id}/edit`}
                        className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/showrooms/${showroom.id}/products`}
                        className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        Products
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {active.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🏪</div>
              <p className="text-gray-500 mb-4">No showrooms yet</p>
              <Link href="/admin/showrooms/new" className="text-red-600 hover:text-red-700 font-medium">
                Create your first showroom →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Archived */}
      {archived.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Archived ({archived.length})</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden opacity-75">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Showroom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {archived.map((showroom) => (
                  <tr key={showroom.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl grayscale">{showroom.icon || '🏪'}</span>
                        <p className="font-medium text-gray-900">{showroom.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {TYPE_LABELS[showroom.type] || showroom.type}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/showrooms/${showroom.id}/edit`}
                        className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Edit / Restore
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}