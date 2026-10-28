// app/(admin)/admin/orders/[id]/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Mail,
  Phone,
  User,
  CreditCard,
  Loader2,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'react-toastify';

interface OrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  selected_size: string | null;    // ✅ Added
  selected_color: string | null;   // ✅ Added
}

interface Customer {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
}

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  total_amount: number;
  subtotal: number;
  shipping_amount: number;
  tax_amount: number;
  payment_status: string;
  payment_method: string;
  
  notes: string | null;
  shipping_address: {
    full_name: string;
    email: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  customer: Customer | null;
}

const STATUS_STEPS = [
  { key: 'pending', label: 'Pending', icon: Clock, color: 'text-yellow-600' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'text-blue-600' },
  { key: 'processing', label: 'Processing', icon: Package, color: 'text-red-600' },
  { key: 'shipped', label: 'Shipped', icon: Truck, color: 'text-red-700' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'text-green-600' },
];

const PAYMENT_LABELS: Record<string, string> = {
  cod: '💵 Cash on pickup / delivery',
  momo: '📱 MTN MoMo Pay',
  mpesa: '📱 Mobile money',
  card: '💳 Card',
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const initialized = useRef(false);

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (initialized.current || !orderId) return;
    initialized.current = true;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`);
        const data = await res.json();

        if (data.success) {
          setOrder(data.data);
        } else {
          toast.error('Order not found');
          router.push('/admin/orders');
        }
      } catch {
        toast.error('Failed to load order');
        router.push('/admin/orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  const updateOrder = async (updates: Record<string, unknown>) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Order updated!');
        // Refresh order data
        setOrder((prev) => prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } as Order : null);
      } else {
        toast.error(data.error || 'Failed to update');
      }
    } catch {
      toast.error('Failed to update order');
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order?.status);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (!order) return null;

  const isCancelled = order.status === 'cancelled' || order.status === 'refunded';

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Order{' '}
              <span className="bg-gradient-to-r from-red-600 via-red-700 to-rose-600 bg-clip-text text-transparent">
                {order.order_number}
              </span>
            </h1>
            <p className="text-gray-500 mt-1">{formatDate(order.created_at)}</p>
          </div>
          <div className="flex items-center gap-3">
            {!isCancelled && order.status !== 'delivered' && (
              <button
                onClick={() => updateOrder({ status: 'cancelled' })}
                disabled={isUpdating}
                className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-medium disabled:opacity-50"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Progress */}
      {!isCancelled && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-6">Order Progress</h3>
          <div className="flex items-center justify-between mb-6">
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted ? 'text-white' : 'bg-gray-100 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-red-100' : ''}`}
                      style={isCompleted ? { background: 'linear-gradient(135deg, #4F46E5, #7C3AED, #EC4899)' } : undefined}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`mt-2 text-xs font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${index < currentStepIndex ? 'bg-red-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
            {STATUS_STEPS.map((step) => (
              <button
                key={step.key}
                onClick={() => updateOrder({ status: step.key })}
                disabled={isUpdating || order.status === step.key}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 ${
                  order.status === step.key
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={
                  order.status === step.key
                    ? { background: 'linear-gradient(135deg, #4F46E5, #7C3AED, #EC4899)' }
                    : undefined
                }
              >
                {step.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cancelled Banner */}
      {isCancelled && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 flex items-center gap-4">
          <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800">Order {order.status === 'refunded' ? 'Refunded' : 'Cancelled'}</p>
            <p className="text-sm text-red-600">This order has been {order.status}.</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Order Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
    {/* Items */}
<div className="bg-white rounded-2xl border border-gray-200 p-6">
  <h3 className="font-semibold text-gray-900 mb-4">Items ({order.items.length})</h3>
  <div className="divide-y divide-gray-100">
    {order.items.map((item) => (
      <div key={item.id} className="flex items-center gap-4 py-4">
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border">
          {item.product_image ? (
            <Image src={item.product_image} alt={item.product_name} fill className="object-cover" sizes="64px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">📷</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900">{item.product_name}</p>

          {/* ✅ Display size and color */}
          {(item.selected_size || item.selected_color) && (
            <div className="flex items-center gap-2 mt-1">
              {item.selected_size && (
                <span className="text-xs px-2 py-0.5 bg-red-50 text-red-700 rounded-md font-medium">
                  Size: {item.selected_size}
                </span>
              )}
              {item.selected_color && (
                <span className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-gray-200"
                    style={{ backgroundColor: item.selected_color.toLowerCase() }}
                  />
                  {item.selected_color}
                </span>
              )}
            </div>
          )}

          <p className="text-sm text-gray-500 mt-0.5">
            {formatPrice(item.unit_price)} × {item.quantity}
          </p>
        </div>
        <p className="font-semibold text-gray-900">{formatPrice(item.total_price)}</p>
      </div>
    ))}
  </div>
  <div className="pt-4 border-t border-gray-100 space-y-2">
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">Subtotal</span>
      <span className="font-medium">{formatPrice(order.subtotal)}</span>
    </div>
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">Shipping</span>
      <span className="font-medium">{formatPrice(order.shipping_amount)}</span>
    </div>
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">Tax</span>
      <span className="font-medium">{formatPrice(order.tax_amount)}</span>
    </div>
    <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-100">
      <span>Total</span>
      <span>{formatPrice(order.total_amount)}</span>
    </div>
  </div>


</div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Customer Notes</h3>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}

          {/* Payment Update */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Status</h3>
            <div className="flex flex-wrap gap-2">
              {['pending', 'paid', 'failed', 'refunded'].map((ps) => (
                <button
                  key={ps}
                  onClick={() => updateOrder({ payment_status: ps })}
                  disabled={isUpdating || order.payment_status === ps}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all disabled:opacity-40 ${
                    order.payment_status === ps
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={
                    order.payment_status === ps
                      ? { background: 'linear-gradient(135deg, #4F46E5, #7C3AED, #EC4899)' }
                      : undefined
                  }
                >
                  {ps}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Customer & Shipping */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Customer</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">{order.customer?.full_name || order.shipping_address.full_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <a href={`mailto:${order.customer?.email || order.shipping_address.email}`} className="text-sm text-red-600 hover:text-red-700">
                  {order.customer?.email || order.shipping_address.email}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">{order.customer?.phone || order.shipping_address.phone}</span>
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Shipping Address</h3>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-900">{order.shipping_address.full_name}</p>
                <p>{order.shipping_address.address_line1}</p>
                {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
                <p>{order.shipping_address.country}</p>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payment</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">{PAYMENT_LABELS[order.payment_method] || order.payment_method}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                  order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                  order.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.payment_status}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Order placed</p>
                  <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                </div>
              </div>
              {order.updated_at !== order.created_at && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-600 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last updated</p>
                    <p className="text-xs text-gray-500">{formatDate(order.updated_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}