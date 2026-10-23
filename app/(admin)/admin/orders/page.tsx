// app/(admin)/admin/orders/page.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, Eye, Package, Loader2, X } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'react-toastify';

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  total_amount: number;
  subtotal: number;
  shipping_amount: number;
  payment_status: string;
  payment_method: string;
  shipping_address: {
    full_name: string;
    email: string;
    city: string;
    country: string;
  };
  created_at: string;
  profile?: {
    full_name: string;
    email: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

const PAYMENT_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['refunded'],
  cancelled: ['refunded'],
  refunded: [],
};

interface StatusModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (orderId: string, newStatus: string) => Promise<void>;
}

function StatusUpdateModal({ order, isOpen, onClose, onStatusChange }: StatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !order) return null;

  const availableStatuses = STATUS_TRANSITIONS[order.status] || [];

  const handleUpdate = async () => {
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }

    setIsUpdating(true);
    try {
      await onStatusChange(order.id, selectedStatus);
      setSelectedStatus('');
      onClose();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-sm w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Update Order Status</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isUpdating}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Order: <span className="font-semibold text-indigo-600">{order.order_number}</span></p>
            <p className="text-sm text-gray-600">Current Status: <span className={`font-semibold capitalize ${STATUS_COLORS[order.status]?.split(' ')[1]}`}>{order.status}</span></p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">New Status</label>
            <div className="space-y-2">
              {availableStatuses.length > 0 ? (
                availableStatuses.map((status) => (
                  <label key={status} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="status"
                      value={status}
                      checked={selectedStatus === status}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 capitalize">{status}</p>
                      <p className="text-xs text-gray-500">
                        {status === 'delivered' && '✅ Will restock inventory'}
                        {status === 'cancelled' && '♻️ Will restock inventory'}
                        {status === 'refunded' && '💰 Order refunded'}
                        {!['delivered', 'cancelled', 'refunded'].includes(status) && 'Update order status'}
                      </p>
                    </div>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No status transitions available</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={!selectedStatus || isUpdating}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Status'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const limit = 20;
  const initialized = useRef(false);
  const prevFilter = useRef(statusFilter);
  const prevPage = useRef(page);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/orders?${params}`);

      if (!res.ok) {
        console.error('Orders API error:', res.status);
        return;
      }

      const text = await res.text();
      if (!text) return;

      const data = JSON.parse(text);

      if (data.success) {
        setOrders(data.data ?? []);
        setTotalOrders(data.total ?? 0);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      fetchOrders();
      return;
    }

    if (prevFilter.current !== statusFilter || prevPage.current !== page) {
      prevFilter.current = statusFilter;
      prevPage.current = page;
      fetchOrders();
    }
  }, [statusFilter, page, fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          new_status: newStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      // Update local state
      setOrders(orders.map((o) =>
        o.id === orderId ? { ...o, status: newStatus } : o
      ));

      toast.success(`Order status updated to ${newStatus}`);
      if (data.message) {
        toast.info(data.message);
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setStatusModalOpen(true);
  };

  const totalPages = Math.ceil(totalOrders / limit);

  const filteredOrders = searchQuery
    ? orders.filter(
        (o) =>
          o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.shipping_address?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.shipping_address?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : orders;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stats = {
    total: totalOrders,
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing' || o.status === 'confirmed').length,
    revenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-1">Manage and process customer orders</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Orders', value: stats.total, icon: '📦', color: 'from-indigo-500 to-indigo-600' },
          { label: 'Pending', value: stats.pending, icon: '⏳', color: 'from-yellow-500 to-amber-500' },
          { label: 'Processing', value: stats.processing, icon: '🔄', color: 'from-blue-500 to-indigo-500' },
          { label: 'Revenue', value: formatPrice(stats.revenue), icon: '💰', color: 'from-green-500 to-emerald-500' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-xl`}>
                {icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                statusFilter === status ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={
                statusFilter === status
                  ? { background: 'linear-gradient(135deg, #4F46E5, #7C3AED, #EC4899)' }
                  : undefined
              }
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-sm text-indigo-600">{order.order_number}</p>
                      <p className="text-xs text-gray-400 capitalize">{order.payment_method || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-sm text-gray-900">
                        {order.profile?.full_name || order.shipping_address?.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.profile?.email || order.shipping_address?.email || ''}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-sm text-gray-900">{formatPrice(order.total_amount)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          PAYMENT_COLORS[order.payment_status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {order.status}
                        </span>
                        <button
                          onClick={() => openStatusModal(order)}
                          className="text-gray-400 hover:text-indigo-600 transition-colors"
                          title="Update status"
                        >
                          ✎
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalOrders)} of {totalOrders}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-700">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      <StatusUpdateModal
        order={selectedOrder}
        isOpen={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setSelectedOrder(null);
        }}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}