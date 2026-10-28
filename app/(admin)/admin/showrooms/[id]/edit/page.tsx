// app/(admin)/admin/showrooms/[id]/edit/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';

const ICON_OPTIONS = [
  '🌟', '🔥', '💎', '🏷️', '🛍️', '✨', '🎁', '💝',
  '🆕', '📦', '👑', '🎀', '💰', '🏆', '⚡', '🎯',
  '❤️', '🌈', '🌸', '🍂', '❄️', '☀️', '🌙', '💫',
];

const TYPE_OPTIONS = [
  { value: 'manual', label: 'Manual', desc: 'Manually select products' },
  { value: 'auto_new', label: 'New Arrivals', desc: 'Automatically shows newest products' },
  { value: 'auto_deals', label: 'Deals', desc: 'Products with compare-at prices' },
  { value: 'auto_bestselling', label: 'Best Selling', desc: 'Most ordered products' },
];

export default function EditShowroomPage() {
  const router = useRouter();
  const params = useParams();
  const showroomId = params.id as string;
  const initialized = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    type: 'manual',
    sort_order: '0',
    is_active: true,
    show_on_homepage: true,
    max_products: '12',
    archived: false,
  });

  // Fetch showroom data
  useEffect(() => {
    if (initialized.current || !showroomId) return;
    initialized.current = true;

    const fetchShowroom = async () => {
      try {
        const res = await fetch(`/api/admin/showrooms/${showroomId}`);
        const data = await res.json();

        if (data.success) {
          const s = data.data;
          setFormData({
            name: s.name || '',
            description: s.description || '',
            icon: s.icon || '',
            type: s.type || 'manual',
            sort_order: s.sort_order?.toString() || '0',
            is_active: s.is_active ?? true,
            show_on_homepage: s.show_on_homepage ?? true,
            max_products: s.max_products?.toString() || '12',
            archived: s.archived ?? false,
          });
        } else {
          toast.error('Showroom not found');
          router.push('/admin/showrooms');
        }
      } catch {
        toast.error('Failed to load showroom');
        router.push('/admin/showrooms');
      } finally {
        setIsLoading(false);
      }
    };

    fetchShowroom();
  }, [showroomId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/showrooms/${showroomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sort_order: parseInt(formData.sort_order),
          max_products: parseInt(formData.max_products),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Showroom updated!');
        router.push('/admin/showrooms');
      } else {
        toast.error(data.error || 'Failed to update');
      }
    } catch {
      toast.error('Failed to update showroom');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    const newArchived = !formData.archived;
    const msg = newArchived ? 'Archive this showroom?' : 'Restore this showroom?';
    if (!confirm(msg)) return;

    try {
      const res = await fetch('/api/admin/showrooms/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: showroomId, archived: newArchived }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(newArchived ? 'Showroom archived' : 'Showroom restored');
        router.push('/admin/showrooms');
      } else {
        toast.error(data.error || 'Failed');
      }
    } catch {
      toast.error('Failed');
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading showroom...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Showroom</h1>
        <p className="text-gray-500 mt-1">Update showroom details and settings</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Archived Banner */}
        {formData.archived && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-800">This showroom is archived</p>
              <p className="text-xs text-orange-600">It is hidden from the store</p>
            </div>
            <button
              type="button"
              onClick={handleArchive}
              className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Restore
            </button>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Showroom Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="e.g., New Arrivals, Best Sellers"
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
            placeholder="A brief description..."
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Collection Type</label>
          <div className="grid grid-cols-2 gap-3">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, type: opt.value }))}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  formData.type === opt.value
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-sm text-gray-900">{opt.label}</p>
                <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Icon */}
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
                    ? 'bg-red-600 text-white'
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

        {/* Sort Order & Max Products */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
            <input
              type="number"
              name="sort_order"
              value={formData.sort_order}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Products</label>
            <input
              type="number"
              name="max_products"
              value={formData.max_products}
              onChange={handleChange}
              min="1"
              max="50"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum products to display</p>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
              <p className="text-xs text-gray-500">Visible on the store</p>
            </div>
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
            />
          </div>
          <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
            <div>
              <label htmlFor="show_on_homepage" className="text-sm font-medium text-gray-700">Show on Homepage</label>
              <p className="text-xs text-gray-500">Display this collection on the homepage</p>
            </div>
            <input
              type="checkbox"
              name="show_on_homepage"
              id="show_on_homepage"
              checked={formData.show_on_homepage}
              onChange={handleChange}
              className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
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

          {!formData.archived && (
            <button
              type="button"
              onClick={handleArchive}
              className="px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium"
            >
              Archive
            </button>
          )}
        </div>
      </form>
    </div>
  );
}