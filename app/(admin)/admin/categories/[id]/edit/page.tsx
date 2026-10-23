// src/app/(admin)/categories/[id]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';

const ICON_OPTIONS = [
  '👕', '👖', '👗', '👠', '👜', '⌚', '🕶️', '🧢',
  '🧥', '👟', '🎒', '💍', '👑', '🎀', '🌟', '🔥',
  '✨', '💎', '🎁', '🏷️', '📦', '🛍️', '💄', '🧴',
  '🧹', '🏠', '🍳', '☕', '🍽️', '🥄', '🔪', '📚',
  '✏️', '🎨', '🎵', '🎮', '⚽', '🏀', '🎾', '🏊','👩🏻'
];

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentCategories, setParentCategories] = useState<{ id: string; name: string }[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    icon: '',
    parent_id: '',
    is_active: true,
    sort_order: '0',
  });

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const { id } = await params;
        const res = await fetch(`/api/admin/categories/${id}`);
        const data = await res.json();
        
        if (data.success) {
          const category = data.data;
          setFormData({
            name: category.name || '',
            description: category.description || '',
            slug: category.slug || '',
            icon: category.icon || '',
            parent_id: category.parent_id || '',
            is_active: category.is_active ?? true,
            sort_order: category.sort_order?.toString() || '0',
          });
        } else {
          toast.error(data.error || 'Category not found');
          router.push('/admin/categories');
        }
      } catch (error) {
        console.error('Fetch error:', error);
        toast.error('Failed to load category');
        router.push('/admin/categories');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchParentCategories = async () => {
      try {
        const res = await fetch('/api/admin/categories');
        const data = await res.json();
        if (data.success) {
          setParentCategories(data.data.filter((c: { parent_id: string | null; archived: boolean })  => !c.parent_id && !c.archived));
        }
      } catch (error) {
        console.error('Failed to fetch parent categories:', error);
      }
    };

    fetchCategory();
    fetchParentCategories();
  }, [params, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { id } = await params;
      
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          parent_id: formData.parent_id || null,
          sort_order: parseInt(formData.sort_order),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Category updated successfully!');
        router.push('/admin/categories');
      } else {
        toast.error(data.error || 'Failed to update category');
      }
    } catch (error) {
      toast.error('Failed to update category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading category...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Category</h1>
        <p className="text-gray-500 mt-1">Update category details</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Parent Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
          <select
            name="parent_id"
            value={formData.parent_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">None (Top-level category)</option>
            {parentCategories
              .filter((c) => c.id !== (params as { id: string }).id)
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>
        </div>

        {/* Icon Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
          <div className="grid grid-cols-8 gap-2 p-4 border border-gray-300 rounded-lg bg-gray-50">
            {ICON_OPTIONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg transition-colors ${
                  formData.icon === icon
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
          {formData.icon && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-3xl">{formData.icon}</span>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, icon: '' }))}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove icon
              </button>
            </div>
          )}
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
          <input
            type="number"
            name="sort_order"
            value={formData.sort_order}
            onChange={handleChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_active"
            id="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Active (visible on store)
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}