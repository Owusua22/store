// app/(admin)/admin/showrooms/[id]/products/page.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import Image from 'next/image';
import { X, Plus, Search, ArrowLeft } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

interface ShowroomProduct {
  product_id: string;
  sort_order: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compare_at_price: number | null;
    thumbnail: string | null;
    stock_quantity: number;
    is_active: boolean;
  };
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  thumbnail: string | null;
  stock_quantity: number;
}

export default function ManageShowroomProductsPage() {
  const params = useParams();
  // ✅ Extract id directly from params (useParams returns a plain object in client components)
  const showroomId = params.id as string;

  const [showroom, setShowroom] = useState<{ name: string; icon: string } | null>(null);
  const [assignedProducts, setAssignedProducts] = useState<ShowroomProduct[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const initialized = useRef(false);

  // ✅ Memoize fetchData with useCallback
  const fetchData = useCallback(async () => {
    if (!showroomId) return;

    try {
      const [showroomRes, productsRes] = await Promise.all([
        fetch(`/api/admin/showrooms/${showroomId}`),
        fetch('/api/admin/products'),
      ]);

      const showroomData = await showroomRes.json();
      const productsData = await productsRes.json();

      if (showroomData.success) {
        setShowroom({ name: showroomData.data.name, icon: showroomData.data.icon });
        setAssignedProducts(showroomData.data.products ?? []);
      }

      if (productsData.success) {
        setAllProducts(productsData.data ?? []);
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [showroomId]);

  // ✅ Only run once on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    fetchData();
  }, [fetchData]);

  const addProduct = async (productId: string) => {
    if (!showroomId) return;
    setIsAdding(true);

    try {
      const res = await fetch(`/api/admin/showrooms/${showroomId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Product added!');
        await fetchData();
      } else {
        toast.error(data.error || 'Failed to add');
      }
    } catch {
      toast.error('Failed to add product');
    } finally {
      setIsAdding(false);
    }
  };

  const removeProduct = async (productId: string) => {
    if (!showroomId) return;

    // ✅ Optimistic update
    setAssignedProducts((prev) => prev.filter((p) => p.product_id !== productId));

    try {
      const res = await fetch(
        `/api/admin/showrooms/${showroomId}/products?productId=${productId}`,
        { method: 'DELETE' }
      );
      const data = await res.json();

      if (data.success) {
        toast.success('Product removed');
      } else {
        // Revert on failure
        await fetchData();
        toast.error(data.error || 'Failed to remove');
      }
    } catch {
      await fetchData();
      toast.error('Failed to remove');
    }
  };

  const assignedIds = new Set(assignedProducts.map((p) => p.product_id));

  const availableProducts = allProducts.filter(
    (p) =>
      !assignedIds.has(p.id) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/showrooms"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Showrooms
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          {showroom?.icon} {showroom?.name} — Products
        </h1>
        <p className="text-gray-500 mt-1">
          Add or remove products from this showroom
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assigned Products */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Assigned Products ({assignedProducts.length})
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {assignedProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p>No products assigned yet</p>
              </div>
            ) : (
              assignedProducts.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50"
                >
                  <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border">
                    {item.product?.thumbnail ? (
                      <Image
                        src={item.product.thumbnail}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        📷
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {item.product?.name}
                    </p>
                    <p className="text-sm text-red-600 font-medium">
                      {formatPrice(item.product?.price ?? 0)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeProduct(item.product_id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Available Products */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Available Products
          </h2>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {availableProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p>
                  {search
                    ? 'No matching products'
                    : 'All products are assigned'}
                </p>
              </div>
            ) : (
              availableProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50"
                >
                  <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border">
                    {product.thumbnail ? (
                      <Image
                        src={product.thumbnail}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        📷
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                  <button
                    onClick={() => addProduct(product.id)}
                    disabled={isAdding}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}