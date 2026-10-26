'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-toastify';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Store,
  Image as ImageIcon,
  Truck,
  LogOut,
  ArrowLeft,
  User,
  Sparkles,
  Boxes,
  Newspaper,
  Wrench,
} from 'lucide-react';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/skin-types', label: 'Skin Types', icon: Sparkles },
  { href: '/admin/stock', label: 'Stock', icon: Boxes },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/shipping', label: 'Shipping', icon: Truck },
  { href: '/admin/blog', label: 'Blog', icon: Newspaper },
  { href: '/admin/showrooms', label: 'Showrooms', icon: Store },
  { href: '/admin/banners', label: 'Banners', icon: ImageIcon },
  { href: '/admin/users', label: 'Users', icon: User },
  { href: '/admin/setup', label: 'Setup', icon: Wrench },
];

export default function Sidebar({ 
  fullName, 
  email 
}: { 
  fullName: string; 
  email: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to sign out?')) return;

    if (!supabase) {
      toast.error('Authentication is not configured');
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to logout');
    } else {
      toast.success('Logged out successfully');
      router.push('/');
      router.refresh();
    }
  };

  return (
    <aside className="w-72 min-h-screen bg-gray-900 border-r border-gray-800 fixed flex flex-col">
      {/* Logo Header */}
      <div className="p-8 border-b border-gray-800 bg-gray-950">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 bg-gradient-to-br from-red-500 via-red-700 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-xl shadow-red-500/40 transition-transform group-hover:scale-110">
            <span className="text-white font-bold text-3xl tracking-tighter">S</span>
          </div>
          <div>
            <p className="text-3xl font-semibold text-white tracking-tighter">Sally&apos;s</p>
            <p className="text-[10px] text-red-400 font-medium -mt-1 tracking-[2px]">ADMINISTRATOR</p>
          </div>
        </Link>
      </div>



      {/* Navigation */}
      <nav className="flex-1 px-4 py-10 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3.5 px-6 py-4 rounded-2xl text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-red-600 text-white shadow-md shadow-red-500/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
              }`}
            >
              <Icon 
                className={`w-5 h-5 transition-colors ${
                  active ? 'text-white' : 'text-gray-500 group-hover:text-red-400'
                }`} 
              />
              {item.label}
              {active && (
                <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full ring-2 ring-red-300 animate-pulse" />
              )}
            </Link>
          );
        })}

        {/* Back to Store */}
        <div className="pt-8 mt-8 border-t border-gray-800 px-2">
          <Link
            href="/"
            className="flex items-center gap-3.5 px-6 py-4 rounded-2xl text-gray-400 hover:bg-gray-800 hover:text-white transition-all text-sm font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Store
          </Link>
        </div>
      </nav>

      {/* Logout Button */}
      <div className="p-6 border-t border-gray-800 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-4 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-400 hover:text-red-300 rounded-2xl font-medium transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}