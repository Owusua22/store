import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

export default async function CategoriesPage() {
  const supabase = await createServerSupabaseClient();

  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch categories:', error);
  }

  const activeCategories = categories?.filter((c) => c.is_active !== false) || [];
  const archivedCategories = categories?.filter((c) => c.is_active === false) || [];

  async function toggleActive(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const currentActive = formData.get('is_active') === 'true';
    const newActive = !currentActive;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/categories/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: newActive }),
        }
      );
      if (!res.ok) console.error('Toggle failed:', await res.text());
    } catch (e) {
      console.error('Toggle error:', e);
    }
    revalidatePath('/admin/categories');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 mt-1">Manage product categories</p>
        </div>
        <Link
          href="/admin/categories/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          + Add Category
        </Link>
      </div>

      {/* Active Categories */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Active Categories ({activeCategories.length})
        </h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Icon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {activeCategories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon|| '📦'}</span>
                      <div>
                        <p className="font-medium text-gray-900">{category.name}</p>
                        <p className="text-sm text-gray-500">/{category.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-2xl">{category.icon|| '📦'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs">
                    {category.description || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/categories/${category.id}/edit`}
                        className="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        Edit
                      </Link>
                      <form action={toggleActive} className="inline">
                        <input type="hidden" name="id" value={category.id} />
                        <input type="hidden" name="is_active" value="true" />
                        <button
                          type="submit"
                          className="px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        >
                          Archive
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {activeCategories.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📁</div>
              <p className="text-gray-500 mb-4">No active categories</p>
              <Link href="/admin/categories/new" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Add your first category →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Archived Categories */}
      {archivedCategories.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Archived Categories ({archivedCategories.length})
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden opacity-75">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Icon</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {archivedCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl grayscale">{category.icon|| '📁'}</span>
                        <div>
                          <p className="font-medium text-gray-900">{category.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-2xl grayscale">{category.icon|| '📁'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/categories/${category.id}/edit`}
                          className="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          Edit
                        </Link>
                        <form action={toggleActive} className="inline">
                          <input type="hidden" name="id" value={category.id} />
                          <input type="hidden" name="is_active" value="false" />
                          <button
                            type="submit"
                            className="px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            Restore
                          </button>
                        </form>
                      </div>
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