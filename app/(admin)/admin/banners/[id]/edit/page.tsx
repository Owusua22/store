// app/(admin)/admin/banners/[id]/edit/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { Upload, X } from 'lucide-react';

export default function EditBannerPage() {
  const router = useRouter();
  const params = useParams();
  const bannerId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
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
    archived: false,
  });

  useEffect(() => {
    if (initialized.current || !bannerId) return;
    initialized.current = true;

    const fetchBanner = async () => {
      try {
        const res = await fetch(`/api/admin/banners/${bannerId}`);
        const data = await res.json();

        if (data.success) {
          const b = data.data;
          setFormData({
            title: b.title || '',
            subtitle: b.subtitle || '',
            description: b.description || '',
            image_url: b.image_url || '',
            link_url: b.link_url || '',
            link_text: b.link_text || 'Shop Now',
            text_color: b.text_color || '#FFFFFF',
            overlay_opacity: b.overlay_opacity?.toString() || '0.4',
            sort_order: b.sort_order?.toString() || '0',
            is_active: b.is_active ?? true,
            archived: b.archived ?? false,
          });
        } else {
          toast.error('Banner not found');
          router.push('/admin/banners');
        }
      } catch {
        toast.error('Failed to load banner');
        router.push('/admin/banners');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanner();
  }, [bannerId, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        throw new Error(data.error);
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
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/banners/${bannerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          overlay_opacity: parseFloat(formData.overlay_opacity),
          sort_order: parseInt(formData.sort_order),
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Banner updated!');
        router.push('/admin/banners');
      } else {
        toast.error(data.error || 'Failed to update');
      }
    } catch {
      toast.error('Failed to update');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    const newArchived = !formData.archived;
    if (!confirm(newArchived ? 'Archive this banner?' : 'Restore this banner?')) return;

    try {
      const res = await fetch('/api/admin/banners/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bannerId, archived: newArchived }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(newArchived ? 'Banner archived' : 'Banner restored');
        router.push('/admin/banners');
      } else {
        toast.error(data.error || 'Failed');
      }
    } catch {
      toast.error('Failed');
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Banner</h1>
        <p className="text-gray-500 mt-1">Update banner details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {formData.archived && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between">
              <p className="text-sm font-medium text-orange-800">This banner is archived</p>
              <button type="button" onClick={handleArchive}
                className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                Restore
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
            <input type="text" name="subtitle" value={formData.subtitle} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload}
              disabled={isUploading} className="hidden" id="banner-upload" />
            {formData.image_url ? (
              <div className="relative rounded-lg overflow-hidden border border-gray-200">
                <img src={formData.image_url} alt="Banner" className="w-full h-48 object-cover" />
                <label htmlFor="banner-upload"
                  className="absolute bottom-2 right-2 px-3 py-1 bg-white/90 text-sm rounded-lg cursor-pointer hover:bg-white font-medium">
                  {isUploading ? 'Uploading...' : 'Replace'}
                </label>
              </div>
            ) : (
              <label htmlFor="banner-upload"
                className="flex items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500">
                <div className="text-center">
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">{isUploading ? 'Uploading...' : 'Upload image'}</p>
                </div>
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
              <input type="text" name="link_url" value={formData.link_url} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
              <input type="text" name="link_text" value={formData.link_text} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
              <div className="flex gap-2 items-center">
                <input type="color" name="text_color" value={formData.text_color} onChange={handleChange}
                  className="w-10 h-10 rounded border cursor-pointer" />
                <input type="text" value={formData.text_color}
                  onChange={(e) => setFormData(p => ({ ...p, text_color: e.target.value }))}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Overlay</label>
              <input type="range" name="overlay_opacity" min="0" max="1" step="0.1"
                value={formData.overlay_opacity} onChange={handleChange} className="w-full mt-2" />
              <p className="text-xs text-gray-500 text-center">{Math.round(parseFloat(formData.overlay_opacity) * 100)}%</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input type="number" name="sort_order" value={formData.sort_order} onChange={handleChange} min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={handleChange}
              className="w-4 h-4 text-indigo-600 rounded" />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-3">
              <button type="submit" disabled={isSubmitting || isUploading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium">
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => router.back()}
                className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
            </div>
            {!formData.archived && (
              <button type="button" onClick={handleArchive}
                className="px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-lg font-medium">Archive</button>
            )}
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
                    <span className="inline-block px-6 py-2 bg-white text-gray-900 rounded-full text-sm font-semibold w-fit">
                      {formData.link_text}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <p>Upload an image to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}