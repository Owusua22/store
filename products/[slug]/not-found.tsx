// src/app/products/[slug]/not-found.tsx
import Link from 'next/link';

export default function ProductNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Not Found</h1>
        <p className="text-gray-500 mb-8">
          The product you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/products"
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}