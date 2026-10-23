'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { Upload, X, Plus, Trash2, Pencil, Check, XCircle } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string;
  parent_id: string | null;
  archived: boolean;
}

// Frontend form state uses strings for inputs
interface Variant {
  size: string;
  color: string;
  price: string;
  compare_at_price: string;
  stock_quantity: string;
  sku: string;
}

// Backend API returns numbers
interface ApiVariant {
  size: string;
  color: string;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  sku: string | null;
}

const EMPTY_VARIANT: Variant = {
  size: '',
  color: '',
  price: '',
  compare_at_price: '',
  stock_quantity: '0',
  sku: '',
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

  const [variants, setVariants] = useState<Variant[]>([]);
  const [newVariant, setNewVariant] = useState<Variant>(EMPTY_VARIANT);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const parentCategories = categories.filter((c) => !c.parent_id && !c.archived);
  const subCategories = categories.filter((c) => c.parent_id && !c.archived);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/admin/categories');
        const data = await res.json();
        if (data.success) setCategories(data.data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const fetchProduct = async () => {
      try {
        const productId = (params as { id: string }).id;
        if (!productId) {
          router.push('/admin/products');
          return;
        }

        const res = await fetch(`/api/admin/products/${productId}`);
        const data = await res.json();

        if (data.success) {
          const product = data.data;
          setFormData({
            name: product.name || '',
            description: product.description || '',
            price: product.price?.toString() || '',
            compare_at_price: product.compare_at_price?.toString() || '',
            stock_quantity: product.stock_quantity?.toString() || '',
            category_id: product.category_id || '',
            thumbnail: product.thumbnail || '',
            images: product.images || [],
            is_active: product.is_active ?? true,
          });

          // ✅ FIXED: Use ApiVariant instead of any
          if (product.variants && product.variants.length > 0) {
            setVariants(
              (product.variants as ApiVariant[]).map((v: ApiVariant) => ({
                size: v.size,
                color: v.color,
                price: v.price.toString(),
                compare_at_price: v.compare_at_price?.toString() || '',
                stock_quantity: v.stock_quantity.toString(),
                sku: v.sku || '',
              }))
            );
          }
        } else {
          toast.error('Product not found');
          router.push('/admin/products');
        }
      } catch {
        toast.error('Failed to load product');
        router.push('/admin/products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [params, router]);

  const addOrUpdateVariant = () => {
    if (!newVariant.size || !newVariant.color || !newVariant.price) {
      toast.error('Size, color, and price are required');
      return;
    }

    const exists = variants.some((v, i) => {
      if (editingIndex !== null && i === editingIndex) return false;
      return v.size === newVariant.size && v.color === newVariant.color;
    });

    if (exists) {
      toast.error('This size/color combination already exists');
      return;
    }

    if (editingIndex !== null) {
      setVariants((prev) =>
        prev.map((v, i) => (i === editingIndex ? { ...newVariant } : v))
      );
      toast.success('Variant updated');
      setEditingIndex(null);
    } else {
      setVariants((prev) => [...prev, { ...newVariant }]);
      toast.success('Variant added');
    }

    setNewVariant(EMPTY_VARIANT);
  };

  const handleEditVariant = (index: number) => {
    setEditingIndex(index);
    setNewVariant({ ...variants[index] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setNewVariant(EMPTY_VARIANT);
  };

  const removeVariant = (index: number) => {
    if (editingIndex === index) {
      handleCancelEdit();
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      const url = data.data?.url || data.url;
      
      if (!formData.thumbnail) {
        setFormData((prev) => ({ ...prev, thumbnail: url }));
      } else {
        setFormData((prev) => ({ ...prev, images: [...prev.images, url] }));
      }
      toast.success('Image uploaded!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number, isThumbnail: boolean = false) => {
    if (isThumbnail) {
      setFormData((prev) => ({ ...prev, thumbnail: '' }));
    } else {
      setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const productId = (params as { id: string }).id;
    const selectedCat = categories.find((c) => c.id === formData.category_id);

    const variantsData = variants.map((v) => ({
      size: v.size,
      color: v.color,
      price: parseFloat(v.price),
      compare_at_price: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
      stock_quantity: parseInt(v.stock_quantity) || 0,
      sku: v.sku || undefined,
    }));

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
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
          sizes: variants.length > 0 ? [...new Set(variantsData.map((v) => v.size))] : [],
          colors: variants.length > 0 ? [...new Set(variantsData.map((v) => v.color))] : [],
          variants: variantsData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Product updated successfully!');
        router.push('/admin/products');
      } else {
        toast.error(data.error || 'Failed to update');
      }
    } catch {
      toast.error('Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const totalStock = variants.reduce((sum, v) => sum + (parseInt(v.stock_quantity) || 0), 0);
  const minPrice = variants.length > 0 ? Math.min(...variants.map((v) => parseFloat(v.price) || 0)) : 0;
  const uniqueSizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];
  const uniqueColors = [...new Set(variants.map((v) => v.color).filter(Boolean))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-500 mt-1">Update product details, images, and variants</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>

            {variants.length === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                  <input type="number" name="price" value={formData.price} onChange={handleChange} required step="0.01" min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                  <input type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} required min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select name="category_id" value={formData.category_id} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
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
          </div>

          <div className="border-t border-gray-200 pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="hidden" id="image-upload" />
            <label htmlFor="image-upload"
              className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors">
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">{isUploading ? 'Uploading...' : 'Click to upload image'}</p>
              </div>
            </label>
            
            {(formData.thumbnail || formData.images.length > 0) && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {formData.thumbnail && (
                  <div className="relative group">
                    <img src={formData.thumbnail} alt="Thumbnail" className="w-full h-32 object-cover rounded-lg border-2 border-red-500" />
                    <span className="absolute top-1 left-1 px-2 py-0.5 bg-red-600 text-white text-xs rounded shadow-sm">Thumbnail</span>
                    <button type="button" onClick={() => removeImage(0, true)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {formData.images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img} alt={`Image ${i + 1}`} className="w-full h-32 object-cover rounded-lg border border-gray-200" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Size / Color Variants</h3>
                <p className="text-sm text-gray-500">Manage specific combinations of size and color</p>
              </div>
              {variants.length > 0 && (
                <div className="text-right text-sm text-gray-500">
                  <p>{uniqueSizes.length} sizes · {uniqueColors.length} colors · {totalStock} total stock</p>
                  <p className="font-medium text-gray-900">Price from {minPrice > 0 ? `$${minPrice.toFixed(2)}` : '—'}</p>
                </div>
              )}
            </div>

            <div className={`bg-gray-50 rounded-xl p-4 mb-4 border ${editingIndex !== null ? 'border-red-400 ring-1 ring-red-100' : 'border-transparent'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Size *</label>
                  <input type="text" value={newVariant.size} onChange={(e) => setNewVariant((p) => ({ ...p, size: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="e.g., M" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Color *</label>
                  <input type="text" value={newVariant.color} onChange={(e) => setNewVariant((p) => ({ ...p, color: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="e.g., Blue" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Price *</label>
                  <input type="number" step="0.01" value={newVariant.price} onChange={(e) => setNewVariant((p) => ({ ...p, price: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Compare Price</label>
                  <input type="number" step="0.01" value={newVariant.compare_at_price} onChange={(e) => setNewVariant((p) => ({ ...p, compare_at_price: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Stock</label>
                  <input type="number" value={newVariant.stock_quantity} onChange={(e) => setNewVariant((p) => ({ ...p, stock_quantity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="0" />
                </div>
                <div className="flex items-end gap-2">
                  <button type="button" onClick={addOrUpdateVariant}
                    className="flex-1 px-3 py-2 text-sm font-medium text-white rounded-lg flex items-center justify-center gap-1 transition-all"
                    style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED, #EC4899)' }}>
                    {editingIndex !== null ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {editingIndex !== null ? 'Update' : 'Add'}
                  </button>
                  
                  {editingIndex !== null && (
                    <button type="button" onClick={handleCancelEdit}
                      className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center">
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {editingIndex !== null && (
                <p className="mt-2 text-xs text-red-600 font-medium">
                  Editing variant #{editingIndex + 1}. Make changes and click Update.
                </p>
              )}
            </div>

            {variants.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Size</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Color</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Compare</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {variants.map((v, i) => (
                        <tr key={i} className={`hover:bg-gray-50 transition-colors ${editingIndex === i ? 'bg-red-50/50' : ''}`}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{v.size}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full border border-gray-200 shadow-sm flex-shrink-0" style={{ backgroundColor: v.color.toLowerCase() }} />
                              <span className="truncate max-w-[100px]">{v.color}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">${parseFloat(v.price || '0').toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {v.compare_at_price ? `$${parseFloat(v.compare_at_price).toFixed(2)}` : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              parseInt(v.stock_quantity) > 5 ? 'bg-green-100 text-green-800' : 
                              parseInt(v.stock_quantity) > 0 ? 'bg-orange-100 text-orange-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {v.stock_quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button type="button" onClick={() => handleEditVariant(i)} className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors" title="Edit Variant">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button type="button" onClick={() => removeVariant(i)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors" title="Delete Variant">
                                <Trash2 className="w-4 h-4" />
                              </button>
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

          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-3">
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={handleChange}
                  className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 border-gray-300 appearance-none cursor-pointer checked:right-0 checked:border-red-600 transition-all duration-200 ease-in-out right-5" />
                <label htmlFor="is_active" className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer checked:bg-red-600 transition-colors"></label>
              </div>
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                Product is Active (Visible on store)
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => router.back()}
              className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSaving || isUploading}
              className="px-6 py-2.5 text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md transition-all"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED, #EC4899)' }}>
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}