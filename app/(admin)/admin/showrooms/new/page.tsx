// app/(admin)/admin/showrooms/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

const TYPE_OPTIONS = [
  { value: 'manual', label: 'Manual', desc: 'Manually select products' },
  { value: 'auto_new', label: 'New Arrivals', desc: 'Automatically shows newest products' },
  { value: 'auto_deals', label: 'Deals', desc: 'Products with compare-at prices' },
  { value: 'auto_bestselling', label: 'Best Selling', desc: 'Most ordered products' },
];

export default function NewShowroomPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'manual',
    sort_order: '0',
    is_active: true,
    show_on_homepage: true,
    max_products: '12',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/showrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sort_order: parseInt(formData.sort_order),
          max_products: parseInt(formData.max_products),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Showroom created!');
        router.push('/admin/showrooms');
      } else {
        toast.error(data.error || 'Failed to create');
      }
    } catch {
      toast.error('Failed to create showroom');
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Showroom</h1>
        <p className="text-gray-500 mt-1">Set up a new featured collection</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
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
            placeholder="e.g., New Arrivals, Best Sellers, Summer Deals"
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
            placeholder="A brief description of this collection..."
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Collection Type *</label>
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

        {/* Toggles */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={handleChange} className="w-4 h-4 text-red-600 rounded" />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="show_on_homepage" id="show_on_homepage" checked={formData.show_on_homepage} onChange={handleChange} className="w-4 h-4 text-red-600 rounded" />
            <label htmlFor="show_on_homepage" className="text-sm font-medium text-gray-700">Show on Homepage</label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t">
          <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium">
            {isSubmitting ? 'Creating...' : 'Create Showroom'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}