'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  ClipboardList,
  Receipt,
  Wallet,
  Newspaper,
  Wrench,
  Tag,
  MessageSquareQuote,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navGroups = [
  {
    label: 'Trading',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/admin/products', label: 'Products', icon: Package },
      { href: '/admin/categories', label: 'Categories', icon: FolderTree },
      { href: '/admin/brands', label: 'Brands', icon: Tag },
      { href: '/admin/skin-types', label: 'Skin types', icon: Sparkles },
    ],
  },
  {
    label: 'Back of house',
    items: [
      { href: '/admin/stock', label: 'Stock', icon: Boxes },
      { href: '/admin/purchases', label: 'Purchases', icon: ClipboardList },
      { href: '/admin/suppliers', label: 'Suppliers', icon: Truck },
      { href: '/admin/expenses', label: 'Expenses', icon: Receipt },
      { href: '/admin/accounting', label: 'Accounting', icon: Wallet },
      { href: '/admin/shipping', label: 'Shipping', icon: Truck },
    ],
  },
  {
    label: 'Storefront',
    items: [
      { href: '/admin/reviews', label: 'Reviews', icon: MessageSquareQuote },
      { href: '/admin/banners', label: 'Banners', icon: ImageIcon },
      { href: '/admin/showrooms', label: 'Collections', icon: Store },
      { href: '/admin/blog', label: 'Journal', icon: Newspaper },
      { href: '/admin/users', label: 'Customers', icon: User },
      { href: '/admin/setup', label: 'Setup', icon: Wrench },
    ],
  },
];

export default function Sidebar({ fullName, email }: { fullName: string; email: string }) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const handleLogout = async () => {
    if (!confirm('Sign out of the shop dashboard?')) return;
    try {
      await signOut();
    } catch {
      toast.error('Could not sign out. Please try again.');
    }
  };

  return (
    <aside className="fixed flex min-h-screen w-64 flex-col bg-ink">
      <div className="border-b border-white/10 px-6 py-6">
        <Link href="/" className="block">
          <p className="font-serif text-[24px] leading-none text-paper">
            Glow<span className="text-sage-pale">-</span>Up
          </p>
          <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.26em] text-sage-pale/70">
            Shop desk
          </p>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[0.22em] text-white/35">
              {group.label}
            </p>
            <div className="space-y-px">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 text-[12.5px] transition-colors ${
                      active
                        ? 'bg-sage-deep text-paper'
                        : 'text-white/65 hover:bg-white/5 hover:text-paper'
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.6} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <Link
          href="/"
          className="flex items-center gap-3 border-t border-white/10 px-3 pt-4 text-[12px] text-white/50 hover:text-paper"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.6} />
          Back to the shop
        </Link>
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <p className="truncate text-[12px] font-semibold text-paper">{fullName || 'Shop admin'}</p>
        <p className="truncate text-[10.5px] text-white/45">{email}</p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 border border-white/15 py-2 text-[10.5px] font-bold uppercase tracking-[0.12em] text-white/70 transition-colors hover:border-sage-pale hover:text-sage-pale"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
