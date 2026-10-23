'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

export default function ArchiveButton({ productId, isActive }: { productId: string; isActive: boolean }) {
  const router = useRouter();

  const handleArchive = async () => {
    const action = isActive ? 'archive' : 'restore';
    if (!confirm(`Are you sure you want to ${action} this product?`)) return;

    try {
      const res = await fetch('/api/admin/products/archive', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, archive: isActive }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        router.refresh();
      } else {
        toast.error(data.error || 'Failed');
      }
    } catch {
      toast.error('Failed to update product');
    }
  };

  return (
    <button
      onClick={handleArchive}
      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
        isActive
          ? 'text-orange-600 hover:bg-orange-50'
          : 'text-green-600 hover:bg-green-50'
      }`}
    >
      {isActive ? 'Archive' : 'Restore'}
    </button>
  );
}