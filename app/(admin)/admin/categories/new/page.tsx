'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

const ICON_OPTIONS = [
  '👕', '👖', '👗', '👠', '👜', '⌚', '🕶️', '🧢',
  '🧥', '👟', '🎒', '💍', '👑', '🎀', '🌟', '🔥',
  '✨', '💎', '🎁', '🏷️', '📦', '🛍️', '💄', '🧴',
  '🏠', '🍳', '☕', '🍽️', '🥄', '🔪', '📚', '👩🏻',
  '✏️', '🎨', '🎵', '🎮', '⚽', '🏀', '🎾', '🏊',
];

export default function NewCategoryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '📦', // store icon emoji here
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Category created successfully!');
        router.push('/admin/categories');
      } else {
        toast.error(data.error || 'Failed to create category');
      }
    } catch {
      toast.error('Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add New Category</h1>
        <p className="text-gray-500 mt-1">Create a new category</p>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="e.g., Men's Clothing"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Category description..."
          />
        </div>

        {/* Icon Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
          <div className="grid grid-cols-8 gap-2 p-4 border border-gray-300 rounded-lg bg-gray-50">
            {ICON_OPTIONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, image_url: icon }))}
                className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg transition-colors ${
                  formData.image_url === icon
                    ? 'bg-red-600 text-white'
                    : 'bg-white hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
          {formData.image_url && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-3xl">{formData.image_url}</span>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove icon
              </button>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_active"
            id="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
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
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
          >
            {isSubmitting ? 'Creating...' : 'Create Category'}
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