// app/(admin)/admin/banners/new/page.tsx
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Upload, X } from 'lucide-react';

export default function NewBannerPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    image_url: '',
    link_url: '',
    link_text: 'Shop Now',
    text_color: '#FFFFFF',
    overlay_opacity: '0.4',
    sort_order: '0',
    is_active: true,
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image');
      return;
    }

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();

      if (data.success) {
        const url = data.data?.url || data.url;
        setFormData((prev) => ({ ...prev, image_url: url }));
        toast.success('Image uploaded!');
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) {
      toast.error('Please upload a banner image');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          overlay_opacity: parseFloat(formData.overlay_opacity),
          sort_order: parseInt(formData.sort_order),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Banner created!');
        router.push('/admin/banners');
      } else {
        toast.error(data.error || 'Failed to create');
      }
    } catch {
      toast.error('Failed to create banner');
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
        <h1 className="text-3xl font-bold text-gray-900">New Banner</h1>
        <p className="text-gray-500 mt-1">Create a carousel banner for the homepage</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text" name="title" value={formData.title} onChange={handleChange} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Summer Collection 2024"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
            <input
              type="text" name="subtitle" value={formData.subtitle} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., UP TO 50% OFF"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description" value={formData.description} onChange={handleChange} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Short description..."
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image *</label>
            <input
              ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload}
              disabled={isUploading} className="hidden" id="banner-upload"
            />
            {formData.image_url ? (
              <div className="relative rounded-lg overflow-hidden border border-gray-200">
                <img src={formData.image_url} alt="Banner preview" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label htmlFor="banner-upload"
                className="flex items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
              >
                <div className="text-center">
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">{isUploading ? 'Uploading...' : 'Click to upload banner image'}</p>
                  <p className="text-xs text-gray-500 mt-1">Recommended: 1920×600px</p>
                </div>
              </label>
            )}
          </div>

          {/* Link URL & Text */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
              <input
                type="text" name="link_url" value={formData.link_url} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="/products or /products?category=..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
              <input
                type="text" name="link_text" value={formData.link_text} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Shop Now"
              />
            </div>
          </div>

          {/* Styling */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color" name="text_color" value={formData.text_color} onChange={handleChange}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text" value={formData.text_color} onChange={(e) => setFormData(p => ({ ...p, text_color: e.target.value }))}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Overlay</label>
              <input
                type="range" name="overlay_opacity" min="0" max="1" step="0.1"
                value={formData.overlay_opacity}
                onChange={handleChange}
                className="w-full mt-2"
              />
              <p className="text-xs text-gray-500 text-center">{Math.round(parseFloat(formData.overlay_opacity) * 100)}%</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input
                type="number" name="sort_order" value={formData.sort_order} onChange={handleChange} min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <input type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={handleChange}
              className="w-4 h-4 text-indigo-600 rounded" />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t">
            <button type="submit" disabled={isSubmitting || isUploading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium">
              {isSubmitting ? 'Creating...' : 'Create Banner'}
            </button>
            <button type="button" onClick={() => router.back()}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium">
              Cancel
            </button>
          </div>
        </form>

        {/* Live Preview */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
          <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-[16/6]">
            {formData.image_url ? (
              <>
                <img src={formData.image_url} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black" style={{ opacity: parseFloat(formData.overlay_opacity) || 0 }} />
                <div className="absolute inset-0 flex flex-col justify-center px-12">
                  {formData.subtitle && (
                    <p className="text-sm font-semibold mb-2 tracking-wider uppercase" style={{ color: formData.text_color }}>
                      {formData.subtitle}
                    </p>
                  )}
                  <h2 className="text-3xl font-bold mb-3" style={{ color: formData.text_color }}>
                    {formData.title || 'Banner Title'}
                  </h2>
                  {formData.description && (
                    <p className="text-sm mb-4 max-w-md" style={{ color: formData.text_color, opacity: 0.9 }}>
                      {formData.description}
                    </p>
                  )}
                  {formData.link_text && (
                    <div>
                      <span className="inline-block px-6 py-2 bg-white text-gray-900 rounded-full text-sm font-semibold">
                        {formData.link_text}
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Upload className="w-12 h-12 mx-auto mb-2" />
                  <p>Upload an image to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}