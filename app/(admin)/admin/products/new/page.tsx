'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Upload, X, Plus, Trash2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon?: string;
  is_active: boolean;
  parent_id: string | null;
  archived: boolean;
}

interface Variant {
  size: string;
  color: string;
  price: string;
  compare_at_price: string;
  stock_quantity: string;
  sku: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    compare_at_price: '',
    stock_quantity: '',
    category_id: '',
    thumbnail: '',
    images: [] as string[],
    is_active: true,
  });

  // Variants
  const [variants, setVariants] = useState<Variant[]>([]);
  const [newVariant, setNewVariant] = useState<Variant>({
    size: '', color: '', price: '', compare_at_price: '', stock_quantity: '0', sku: '',
  });

  const parentCategories = categories.filter((c) => !c.parent_id && !c.archived);
  const subCategories = categories.filter((c) => c.parent_id && !c.archived);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/admin/categories');
        const data = await res.json();
        if (data.success) setCategories(data.data.filter((c: Category) => c.is_active));
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const addVariant = () => {
    if (!newVariant.size || !newVariant.color || !newVariant.price) {
      toast.error('Size, color, and price are required');
      return;
    }
    const exists = variants.some((v) => v.size === newVariant.size && v.color === newVariant.color);
    if (exists) {
      toast.error('This size/color combination already exists');
      return;
    }
    setVariants((prev) => [...prev, { ...newVariant }]);
    setNewVariant({ size: '', color: '', price: '', compare_at_price: '', stock_quantity: '0', sku: '' });
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image'); return; }
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Upload failed');
      const url = data.data?.url || data.url;
      if (!formData.thumbnail) {
        setFormData((prev) => ({ ...prev, thumbnail: url }));
        toast.success('Thumbnail uploaded!');
      } else {
        setFormData((prev) => ({ ...prev, images: [...prev.images, url] }));
        toast.success('Image uploaded!');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const selectedCat = categories.find((c) => c.id === formData.category_id);

    // Build variants data
    const variantsData = variants.map((v) => ({
      size: v.size,
      color: v.color,
      price: parseFloat(v.price),
      compare_at_price: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
      stock_quantity: parseInt(v.stock_quantity) || 0,
      sku: v.sku || undefined,
    }));

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          category: selectedCat?.name || '',
          category_id: formData.category_id || null,
          price: variants.length > 0
            ? Math.min(...variantsData.map((v) => v.price))
            : parseFloat(formData.price),
          compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
          stock_quantity: variants.length > 0
            ? variantsData.reduce((sum, v) => sum + v.stock_quantity, 0)
            : parseInt(formData.stock_quantity),
          sizes: [...new Set(variantsData.map((v) => v.size))],
          colors: [...new Set(variantsData.map((v) => v.color))],
          variants: variantsData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Product created!');
        router.push('/admin/products');
      } else {
        toast.error(data.error || 'Failed to create');
      }
    } catch {
      toast.error('Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const removeImage = (index: number, isThumbnail: boolean = false) => {
    if (isThumbnail) setFormData((prev) => ({ ...prev, thumbnail: '' }));
    else setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  // Auto-calculate totals from variants
  const totalStock = variants.reduce((sum, v) => sum + (parseInt(v.stock_quantity) || 0), 0);
  const minPrice = variants.length > 0 ? Math.min(...variants.map((v) => parseFloat(v.price) || 0)) : 0;
  const uniqueSizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];
  const uniqueColors = [...new Set(variants.map((v) => v.color).filter(Boolean))];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
        <p className="text-gray-500 mt-1">Fill in the details to create a new product</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g., Classic White T-Shirt" />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Product description..." />
        </div>

        {/* Base Price & Stock (used when no variants) */}
        {variants.length === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} required step="0.01" min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
              <input type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} required min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0" />
            </div>
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select name="category_id" value={formData.category_id} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Select category</option>
            {parentCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.icon || '📁'} {cat.name}</option>
            ))}
            {subCategories.length > 0 && (
              <optgroup label="Subcategories">
                {subCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>&nbsp;&nbsp;{cat.icon || '📄'} {cat.name}</option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Images</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="hidden" id="image-upload" />
          <label htmlFor="image-upload"
            className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
            <div className="text-center">
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">{isUploading ? 'Uploading...' : 'Click to upload'}</p>
            </div>
          </label>
          {(formData.thumbnail || formData.images.length > 0) && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              {formData.thumbnail && (
                <div className="relative group">
                  <img src={formData.thumbnail} alt="Thumbnail" className="w-full h-32 object-cover rounded-lg border-2 border-indigo-500" />
                  <span className="absolute top-1 left-1 px-2 py-0.5 bg-indigo-600 text-white text-xs rounded">Thumbnail</span>
                  <button type="button" onClick={() => removeImage(0, true)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {formData.images.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} alt={`${i + 1}`} className="w-full h-32 object-cover rounded-lg border" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ✅ VARIANTS SECTION */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Size / Color Variants</h3>
              <p className="text-sm text-gray-500">Each size-color combination has its own price and stock</p>
            </div>
            {variants.length > 0 && (
              <div className="text-right text-sm text-gray-500">
                <p>{uniqueSizes.length} sizes · {uniqueColors.length} colors · {totalStock} total stock</p>
                <p className="font-medium text-gray-900">Starting from {minPrice > 0 ? `$${minPrice.toFixed(2)}` : '—'}</p>
              </div>
            )}
          </div>

          {/* Add Variant Form */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Size *</label>
                <input type="text" value={newVariant.size}
                  onChange={(e) => setNewVariant((p) => ({ ...p, size: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., M" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Color *</label>
                <input type="text" value={newVariant.color}
                  onChange={(e) => setNewVariant((p) => ({ ...p, color: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Blue" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Price *</label>
                <input type="number" step="0.01" value={newVariant.price}
                  onChange={(e) => setNewVariant((p) => ({ ...p, price: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Compare Price</label>
                <input type="number" step="0.01" value={newVariant.compare_at_price}
                  onChange={(e) => setNewVariant((p) => ({ ...p, compare_at_price: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Stock</label>
                <input type="number" value={newVariant.stock_quantity}
                  onChange={(e) => setNewVariant((p) => ({ ...p, stock_quantity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0" />
              </div>
              <div className="flex items-end">
                <button type="button" onClick={addVariant}
                  className="w-full px-3 py-2 text-sm font-medium text-white rounded-lg"
                  style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED, #EC4899)' }}>
                  <Plus className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          </div>

          {/* Variants Table */}
          {variants.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Compare</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {variants.map((v, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{v.size}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full border border-gray-200"
                            style={{ backgroundColor: v.color.toLowerCase() }} />
                          {v.color}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">${parseFloat(v.price || '0').toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {v.compare_at_price ? `$${parseFloat(v.compare_at_price).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${
                          parseInt(v.stock_quantity) > 5 ? 'text-green-600' :
                          parseInt(v.stock_quantity) > 0 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {v.stock_quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => removeVariant(i)}
                          className="p-1 text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <input type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={handleChange}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active (visible on store)</label>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t">
          <button type="submit" disabled={isLoading || isUploading}
            className="px-6 py-2 text-white rounded-lg disabled:opacity-50 font-medium"
            style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED, #EC4899)' }}>
            {isLoading ? 'Creating...' : 'Create Product'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
        </div>
      </form>
    </div>
  );
}