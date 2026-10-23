// src/app/(admin)/dashboard/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import SalesTrendChart from '@/components/admin/SalesTrendChart';

export default async function AdminDashboard() {
  const supabase = await createServerSupabaseClient();

  const [{ count: productCount }, { count: orderCount }, { data: revenue }] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('total_amount').eq('status', 'delivered'),
  ]);

  const totalRevenue = revenue?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

  const { data: lowStock } = await supabase
    .from('products')
    .select('name, stock_quantity')
    .lt('stock_quantity', 10)
    .limit(5);

  // Get recent orders for transaction table
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, total_amount, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  // Get top products by stock
  const { data: topProducts } = await supabase
    .from('products')
    .select('name, stock_quantity, price')
    .order('stock_quantity', { ascending: false })
    .limit(3);

  // Fetch last 30 days of orders for the sales trend chart
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: salesData } = await supabase
    .from('orders')
    .select('total_amount, status, created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true });

  // Aggregate into daily buckets
  const dailyMap: Record<string, { revenue: number; orders: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dailyMap[key] = { revenue: 0, orders: 0 };
  }

  salesData?.forEach((order) => {
    const key = new Date(order.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    if (dailyMap[key]) {
      dailyMap[key].orders += 1;
      if (order.status === 'delivered') {
        dailyMap[key].revenue += order.total_amount || 0;
      }
    }
  });

  // Thin out x-axis labels to avoid crowding
  const chartData = Object.entries(dailyMap).map(([date, vals], i) => ({
    date: i % 3 === 0 ? date : '',
    fullDate: date,
    ...vals,
  }));

  const thirtyDayRevenue = chartData.reduce((s, d) => s + d.revenue, 0);
  const thirtyDayOrders = chartData.reduce((s, d) => s + d.orders, 0);

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">
          Hi, Admin.{' '}
          <span className="text-base font-normal text-gray-500">
            here&apos;s what&apos;s happening with your store today.
          </span>
        </h1>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products/new"
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + Add Product
          </Link>
          <Link
            href="/admin/orders"
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            View Orders
          </Link>
        </div>
      </div>

      <div className="p-8">
        {/* Row 1: Revenue banner + accent cards */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div
            className="col-span-2 rounded-2xl p-8 relative overflow-hidden flex flex-col justify-between"
            style={{
              background: 'linear-gradient(135deg, #1a73e8 0%, #0d47a1 60%, #1565c0 100%)',
              minHeight: '220px',
            }}
          >
            <div className="absolute right-0 top-0 w-64 h-64 rounded-full opacity-10 bg-white" style={{ transform: 'translate(30%, -30%)' }} />
            <div className="absolute right-24 bottom-0 w-48 h-48 rounded-full opacity-10 bg-white" style={{ transform: 'translateY(30%)' }} />
            <div className="relative z-10">
              <p className="text-blue-200 text-sm font-medium mb-1">Total Revenue</p>
              <p className="text-white text-4xl font-bold mb-1">{formatPrice(totalRevenue)}</p>
              <p className="text-blue-300 text-sm flex items-center gap-1">
                <span className="text-green-400">▲</span> from completed orders
              </p>
            </div>
            <div className="flex gap-12 relative z-10 mt-6">
              <div>
                <p className="text-blue-300 text-xs mb-1">Total Products</p>
                <p className="text-white text-xl font-bold">{productCount || 0}</p>
              </div>
              <div>
                <p className="text-blue-300 text-xs mb-1">Total Orders</p>
                <p className="text-white text-xl font-bold">{orderCount || 0}</p>
              </div>
            </div>
            <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-30 text-8xl select-none">🛍️</div>
          </div>

          <div className="flex flex-col gap-6">
            <div
              className="rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #ff7043 0%, #f4511e 100%)', minHeight: '95px' }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Total Orders</p>
                  <p className="text-white text-3xl font-bold mt-1">{orderCount || 0}</p>
                </div>
                <div className="text-3xl opacity-40">🛒</div>
              </div>
              <div className="mt-2">
                <div className="h-1 bg-orange-300 rounded-full opacity-50 mb-1">
                  <div className="h-1 bg-white rounded-full" style={{ width: '60%' }} />
                </div>
                <p className="text-orange-200 text-xs">View report →</p>
              </div>
            </div>

            <div
              className="rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #ab47bc 0%, #7b1fa2 100%)', minHeight: '95px' }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-purple-200 text-sm font-medium">Low Stock Items</p>
                  <p className="text-white text-3xl font-bold mt-1">{lowStock?.length || 0}</p>
                </div>
                <div className="text-3xl opacity-40">⚠️</div>
              </div>
              <div className="mt-2">
                <div className="h-1 bg-purple-300 rounded-full opacity-50 mb-1">
                  <div className="h-1 bg-white rounded-full" style={{ width: '30%' }} />
                </div>
                <p className="text-purple-200 text-xs">Needs attention →</p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Metric cards */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          {[
            { label: 'Total Products', value: productCount || 0, icon: '📦', color: 'bg-indigo-50', sub: '▲ In your catalog', subColor: 'text-green-500' },
            { label: 'Completed Orders', value: revenue?.length || 0, icon: '✅', color: 'bg-green-50', sub: '▲ Fulfilled successfully', subColor: 'text-green-500' },
            { label: 'Total Revenue', value: formatPrice(totalRevenue), icon: '💰', color: 'bg-emerald-50', sub: '▲ Lifetime earnings', subColor: 'text-green-500', green: true },
            { label: 'All Orders', value: orderCount || 0, icon: '🛒', color: 'bg-orange-50', sub: lowStock?.length ? `▼ ${lowStock.length} low stock` : '✓ Stock looks good', subColor: lowStock?.length ? 'text-orange-500' : 'text-green-500' },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-500 text-sm">{card.label}</p>
                <div className={`w-9 h-9 rounded-lg ${card.color} flex items-center justify-center text-lg`}>{card.icon}</div>
              </div>
              <p className={`text-3xl font-bold ${card.green ? 'text-green-600' : 'text-gray-900'}`}>{card.value}</p>
              <p className={`text-xs mt-1 font-medium ${card.subColor}`}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Row 3: Sales Analytics Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Sales Analytics</h2>
              <p className="text-gray-400 text-xs mt-0.5">Daily revenue &amp; order volume — last 30 days</p>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="text-xs text-gray-500">Revenue:</span>
                <span className="text-xs font-bold text-blue-600">{formatPrice(thirtyDayRevenue)}</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="text-xs text-gray-500">Orders:</span>
                <span className="text-xs font-bold text-emerald-600">{thirtyDayOrders}</span>
              </div>
            </div>
          </div>
          <SalesTrendChart data={chartData} />
        </div>

        {/* Row 4: Bestseller + Low Stock + Transactions */}
        <div className="grid grid-cols-3 gap-6">
          {/* Bestseller */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Bestseller</h2>
                <p className="text-gray-400 text-xs">Top products in your store</p>
              </div>
              <Link href="/admin/products" className="text-emerald-500 text-sm font-medium hover:underline">See All</Link>
            </div>
            <div className="space-y-4">
              {topProducts && topProducts.length > 0 ? (
                topProducts.map((product, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">📦</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-emerald-500 font-semibold">TOP SALES</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{product.stock_quantity}</p>
                      <p className="text-xs text-gray-400">in stock</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm text-center py-4">No products found</p>
              )}
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">⚠️ Low Stock Alert</h2>
                <p className="text-gray-400 text-xs">Items needing restock</p>
              </div>
              <Link href="/admin/products" className="text-emerald-500 text-sm font-medium hover:underline">See All</Link>
            </div>
            <div className="space-y-3">
              {lowStock && lowStock.length > 0 ? (
                lowStock.map((product, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-400" />
                      <span className="text-sm text-gray-700">{product.name}</span>
                    </div>
                    <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
                      {product.stock_quantity} left
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-gray-500 text-sm">All items well stocked!</p>
                </div>
              )}
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Transaction</h2>
                <p className="text-gray-400 text-xs">Latest transaction history</p>
              </div>
              <Link href="/admin/orders" className="text-emerald-500 text-sm font-medium hover:underline">See All</Link>
            </div>
            <div className="grid grid-cols-3 text-xs font-semibold text-gray-400 uppercase mb-3 pb-2 border-b border-gray-100">
              <span>No</span>
              <span>Status</span>
              <span className="text-right">Amount</span>
            </div>
            <div className="space-y-3">
              {recentOrders && recentOrders.length > 0 ? (
                recentOrders.map((order, i) => (
                  <div key={order.id} className="grid grid-cols-3 items-center">
                    <span className="text-sm font-medium text-gray-900">#{i + 1}</span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${
                        order.status === 'completed'
                          ? 'bg-green-100 text-green-600'
                          : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {order.status}
                    </span>
                    <span className="text-sm font-bold text-gray-900 text-right">
                      {formatPrice(order.total_amount || 0)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm text-center py-4">No orders yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}