/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { cn } from '@/lib/utils';
import { AuthModal } from '@/components/auth/AuthModal';
import { toast } from 'react-toastify';
import { Truck } from 'lucide-react';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Shop' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

const MOBILE_BOTTOM_LINKS = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/wishlist', label: 'Saved', icon: 'heart' },
  { href: '/profile', label: 'Account', icon: 'user' },
] as const;

const CONTACT_NUMBER = '0549455367';
const CONTACT_NUMBER_RAW = '0549455367';


const POPULAR_SEARCHES = [
  'Summer dresses',
  'Linen shirts',
  'Wide-leg trousers',
  'Maxi skirts',
  'Blazers',
];

// ─────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────

const Icons = {
  Logo: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  Menu: ({ className }: { className?: string }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Search: ({ size = 17, className }: { size?: number; className?: string }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Bag: ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  ),
  Heart: ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  ),
  User: ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Home: ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Package: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  Dashboard: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  Logout: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Phone: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 15z" />
    </svg>
  ),
  WhatsApp: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  ),
  ChevronDown: ({ className }: { className?: string }) => (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  ChevronRight: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  X: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Sparkle: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  ),
  Info: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  Mail: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22 6 12 13 2 6" />
    </svg>
  ),
  Truck: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <Truck />
    </svg>
  ),
};

function MobileIcon({ icon }: { icon: string }) {
  const size = 22;
  switch (icon) {
    case 'home':  return <Icons.Home size={size} />;
    case 'shop':  return <Icons.Bag size={size} />;
    case 'heart': return <Icons.Heart size={size} />;
    case 'user':  return <Icons.User size={size} />;
    default:      return null;
  }
}

// ─────────────────────────────────────────────
// Announcement Bar - REDUCED HEIGHT ON MOBILE
// ─────────────────────────────────────────────

function AnnouncementBar() {
  const [isClient, setIsClient] = useState(false);
  const [visible, setVisible] = useState(true);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDismiss = useCallback(() => {
    setAnimating(true);
    setTimeout(() => setVisible(false), 350);
  }, []);

  if (!visible) return null;

  return (
    <div className={cn(
      "relative overflow-hidden transition-all duration-300 ease-out",
      "bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900",
      "h-8 sm:h-10", // REDUCED: was h-11, now h-8 on mobile
      animating && "h-0 opacity-0"
    )}>
      {isClient && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
      )}
      
      {/* Mobile layout - COMPACT */}
      <div className="flex items-center justify-center gap-1.5 px-2 h-8 relative z-10 sm:hidden">
        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
          <Icons.Truck size={10} />
        NATIONWIDE DELIVERY
        </span>
        <div className="w-px h-3 bg-white/20" />
        <a 
          href={`tel:${CONTACT_NUMBER_RAW}`} 
          className="inline-flex items-center gap-1 text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/20 hover:bg-white/10 transition-colors"
        >
          <Icons.Phone size={10} />
          <span>{CONTACT_NUMBER}</span>
        </a>
        <a 
          href={`https://wa.me/${CONTACT_NUMBER_RAW}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-green-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-green-400/30 hover:bg-green-400/10 transition-colors"
        >
          <Icons.WhatsApp size={10} />
          <span>WhatsApp</span>
        </a>
      </div>

      {/* Desktop layout */}
      <div className="hidden sm:flex items-center justify-between max-w-6xl mx-auto px-7 h-10 relative z-10">
        <div className="flex items-center justify-center gap-3 flex-1">
          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-black px-2 py-1 rounded uppercase tracking-wider shadow-lg">
            <Icons.Sparkle />
          NATIONWIDE DELIVERY
          </span>
       
          <div className="w-px h-3.5 bg-white/20" />
          <span className="text-white/60 text-xs font-bold">Call or WhatsApp us</span>
          <div className="w-px h-3.5 bg-white/20" />
          <a 
            href={`tel:${CONTACT_NUMBER_RAW}`} 
            className="inline-flex items-center gap-1 text-white text-xs font-bold px-2 py-1 rounded border border-white/20 hover:bg-white/10 transition-colors"
          >
            <Icons.Phone size={12} />
            <span>{CONTACT_NUMBER}</span>
          </a>
          <a 
            href={`https://wa.me/${CONTACT_NUMBER_RAW}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-green-400 text-xs font-bold px-2 py-1 rounded border border-green-400/30 hover:bg-green-400/10 transition-colors"
          >
            <Icons.WhatsApp size={12} />
            <span>WhatsApp</span>
          </a>
        </div>
        <button 
          onClick={handleDismiss} 
          className="flex items-center justify-center p-1.5 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Dismiss"
        >
          <Icons.X size={13} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Mobile Menu Component
// ─────────────────────────────────────────────

function MobileMenu({ 
  open, 
  onClose, 
  isAuthenticated, 
  profile, 
  userInitial, 
  onSignOut, 
  onOpenAuth 
}: {
  open: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  profile: any;
  userInitial: string;
  onSignOut: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (open && typeof window !== 'undefined') {
      document.body.style.overflow = 'hidden';
    } else if (typeof window !== 'undefined') {
      document.body.style.overflow = '';
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (typeof window !== 'undefined') {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[90vw] bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
              <Icons.Logo />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-black text-gray-900">Sally&rsquo;s</span>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Menu</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Icons.X size={18} />
          </button>
        </div>

        {/* User Section */}
        {isAuthenticated && profile && (
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-lg font-black rounded-xl">
                {userInitial}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {profile?.full_name ?? 'Welcome back!'}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {profile?.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <div className="p-4 space-y-2">
          <div className="space-y-1">
            {/* Main Navigation */}
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all",
                    isActive 
                      ? "text-indigo-600 bg-indigo-50 border border-indigo-200" 
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  <span className="w-5 h-5 flex items-center justify-center">
                    {label === 'Home' && <Icons.Home size={18} />}
                    {label === 'Shop' && <Icons.Bag size={18} />}
                    {label === 'About' && <Icons.Info size={18} />}
                    {label === 'Contact' && <Icons.Mail size={18} />}
                  </span>
                  <span className="flex-1">{label}</span>
                  {isActive && <div className="w-2 h-2 bg-indigo-500 rounded-full" />}
                </Link>
              );
            })}
          </div>

          {/* Authenticated User Links */}
          {isAuthenticated && (
            <>
              <div className="h-px bg-gray-200 my-4" />
              <div className="space-y-1">
                <Link
                  href="/profile"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <Icons.User size={18} />
                  <span className="flex-1">My Profile</span>
                  <Icons.ChevronRight size={14} />
                </Link>
                <Link
                  href="/orders"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <Icons.Package />
                  <span className="flex-1">My Orders</span>
                  <Icons.ChevronRight size={14} />
                </Link>
                <Link
                  href="/wishlist"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <Icons.Heart size={18} />
                  <span className="flex-1">Wishlist</span>
                  <Icons.ChevronRight size={14} />
                </Link>
              </div>
            </>
          )}

          {/* Auth Buttons for Non-authenticated Users */}
          {!isAuthenticated && (
            <>
              <div className="h-px bg-gray-200 my-4" />
              <div className="space-y-2">
                <button 
                  onClick={() => { onOpenAuth('login'); onClose(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  <Icons.User size={16} />
                  Sign In
                </button>
                <button 
                  onClick={() => { onOpenAuth('register'); onClose(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Get Started
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {isAuthenticated && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
            <button 
              onClick={() => { onSignOut(); onClose(); }}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <Icons.Logout />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Search Overlay
// ─────────────────────────────────────────────

function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  type SearchProduct = {
    id: string;
    name: string;
    slug: string;
    thumbnail: string | null;
    price: number | string | null;
    compare_at_price: number | string | null;
    category: string | null;
    stock_quantity: number | null;
  };

  const SEARCH_MIN_LENGTH = 2;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const formatPrice = useCallback((value: number | string | null) => {
    const amount = Number(value);

    if (!Number.isFinite(amount)) return '';

    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount);
  }, []);

  const getProductHref = useCallback((slug: string) => {
    return `/products/${encodeURIComponent(slug)}`;
  }, []);

  const handleProductClick = useCallback(
    (slug: string) => {
      router.push(getProductHref(slug));
      onClose();
    },
    [router, getProductHref, onClose]
  );

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setLoading(false);
      setSearchError(null);

      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }

      return;
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 80);

    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    const searchTerm = query.trim();

    if (!open || searchTerm.length < SEARCH_MIN_LENGTH) {
      setResults([]);
      setLoading(false);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        setSearchError(null);

        const response = await fetch(
          `/api/products/search?q=${encodeURIComponent(searchTerm)}&limit=8`,
          {
            method: 'GET',
            signal: controller.signal,
            headers: {
              Accept: 'application/json',
            },
          }
        );

        const payload = (await response.json()) as {
          success: boolean;
          data?: SearchProduct[];
          error?: string;
        };

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to search products');
        }

        setResults(payload.data ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;

        setResults([]);
        setSearchError(
          error instanceof Error ? error.message : 'Failed to search products'
        );
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const searchTerm = query.trim();

    if (!searchTerm) return;

    router.push(`/products?search=${encodeURIComponent(searchTerm)}`);
    onClose();
  };

  if (!open) return null;

  const hasSearchQuery = query.trim().length >= SEARCH_MIN_LENGTH;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16 sm:pt-20">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Search products
          </span>

          <button
            onClick={onClose}
            className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900"
          >
            <Icons.X size={12} />
            <span>ESC</span>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 border-b border-gray-100 px-3 py-1"
        >
          <div className="flex flex-1 items-center gap-2.5 px-1 py-3">
            <Icons.Search size={18} className="text-gray-400" />

            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products by name, category..."
              className="flex-1 border-0 bg-transparent text-base text-gray-900 outline-0 placeholder:text-gray-400"
              autoComplete="off"
            />

            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  setSearchError(null);
                  inputRef.current?.focus();
                }}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
              >
                <Icons.X size={10} />
              </button>
            )}
          </div>

          {query.trim() && (
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Search
            </button>
          )}
        </form>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {!hasSearchQuery && (
            <>
              <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                Popular searches
              </p>

              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((searchTerm) => (
                  <button
                    key={searchTerm}
                    type="button"
                    onClick={() => {
                      setQuery(searchTerm);
                      inputRef.current?.focus();
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <Icons.Search size={10} />
                    {searchTerm}
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                Start typing at least 2 characters to search products from the
                database.
              </div>
            </>
          )}

          {hasSearchQuery && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Results for{' '}
                  <span className="text-gray-900">&ldquo;{query.trim()}&rdquo;</span>
                </p>

                {!loading && results.length > 0 && (
                  <span className="text-xs font-semibold text-gray-400">
                    {results.length} found
                  </span>
                )}
              </div>

              {loading && (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex animate-pulse items-center gap-3 rounded-xl border border-gray-100 p-2"
                    >
                      <div className="h-14 w-14 rounded-lg bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-2/3 rounded bg-gray-200" />
                        <div className="h-3 w-1/3 rounded bg-gray-100" />
                      </div>
                      <div className="h-4 w-14 rounded bg-gray-200" />
                    </div>
                  ))}
                </div>
              )}

              {!loading && searchError && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600">
                  {searchError}
                </div>
              )}

              {!loading && !searchError && results.length === 0 && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
                    <Icons.Search size={20} />
                  </div>

                  <p className="text-sm font-bold text-gray-900">
                    No products found
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Try searching with another product name or category.
                  </p>
                </div>
              )}

              {!loading && !searchError && results.length > 0 && (
                <div className="space-y-2">
                  {results.map((product) => {
                    const price = Number(product.price);
                    const compareAtPrice = Number(product.compare_at_price);
                    const hasDiscount =
                      Number.isFinite(compareAtPrice) &&
                      Number.isFinite(price) &&
                      compareAtPrice > price;

                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleProductClick(product.slug)}
                        className="group flex w-full items-center gap-3 rounded-xl border border-gray-100 p-2 text-left transition-all hover:border-indigo-200 hover:bg-indigo-50/60"
                      >
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                          {product.thumbnail ? (
                            <img
                              src={product.thumbnail}
                              alt={product.name}
                              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                          ) : (
                            <Icons.Bag size={20} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-gray-900 group-hover:text-indigo-700">
                            {product.name}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {product.category && (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500 group-hover:bg-white">
                                {product.category}
                              </span>
                            )}

                            {typeof product.stock_quantity === 'number' &&
                              product.stock_quantity <= 0 && (
                                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                                  Out of stock
                                </span>
                              )}
                          </div>
                        </div>

                        <div className="flex flex-shrink-0 flex-col items-end">
                          <span className="text-sm font-black text-gray-900">
                            {formatPrice(product.price)}
                          </span>

                          {hasDiscount && (
                            <span className="text-xs font-semibold text-gray-400 line-through">
                              {formatPrice(product.compare_at_price)}
                            </span>
                          )}
                        </div>

                        <span className="flex-shrink-0 text-gray-300 transition-colors group-hover:text-indigo-500">
                          <Icons.ChevronRight size={16} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Dropdown Link
// ─────────────────────────────────────────────

function DropdownLink({ 
  href, 
  icon, 
  label, 
  highlight = false, 
  badge 
}: {
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  highlight?: boolean; 
  badge?: string;
}) {
  return (
    <Link 
      href={href} 
      className={cn(
        "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
        highlight 
          ? "text-purple-700 hover:bg-purple-50" 
          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <span className={cn(
        "flex-shrink-0",
        highlight ? "text-purple-500" : "text-gray-400"
      )}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {badge && (
        <span className={cn(
          "px-2 py-0.5 text-xs font-bold rounded-full",
          highlight 
            ? "bg-purple-100 text-purple-700" 
            : "bg-indigo-100 text-indigo-700"
        )}>
          {badge}
        </span>
      )}
    </Link>
  );
}

// ─────────────────────────────────────────────
// User Dropdown
// ─────────────────────────────────────────────

function UserDropdown({ 
  profile, 
  isAdmin, 
  userInitial, 
  onSignOut 
}: {
  profile: any; 
  isAdmin: boolean; 
  userInitial: string; 
  onSignOut: () => void;
}) {
  return (
    <div className="absolute right-0 top-full mt-2.5 w-68 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-b border-gray-100">
        <div className="relative flex-shrink-0">
          <span className="flex items-center justify-center w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-lg font-black rounded-xl">
            {userInitial}
          </span>
          <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-20 rounded-xl -z-10" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">
            {profile?.full_name ?? 'Welcome back!'}
          </p>
          <p className="text-xs text-gray-600 truncate">
            {profile?.email}
          </p>
        </div>
      </div>

      <div className="p-2">
        <DropdownLink href="/profile" icon={<Icons.User size={15} />} label="My Profile" />
        <DropdownLink href="/orders" icon={<Icons.Package />} label="My Orders" />
        <DropdownLink href="/wishlist" icon={<Icons.Heart size={15} />} label="Wishlist" />
        {isAdmin && (
          <>
            <div className="h-px bg-gray-100 my-1.5" />
            <DropdownLink 
              href="/admin/dashboard" 
              icon={<Icons.Dashboard />} 
              label="Admin Dashboard" 
              highlight 
              badge="Admin" 
            />
          </>
        )}
      </div>

      <div className="p-2 border-t border-gray-100 bg-gray-50">
        <button 
          onClick={onSignOut}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
        >
          <Icons.Logout />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Navbar Component
// ─────────────────────────────────────────────

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isAdmin, profile, signOut } = useAuth();
  const { totalItems, toggleCart, setCart } = useCart();

  const [mounted, setMounted] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const prevPathname = useRef(pathname);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;
    setUserMenuOpen(false);
    setSearchOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mounted) return;
    
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted]);

  useEffect(() => {
    if (!userMenuOpen || !mounted) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (!userMenuRef.current?.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [userMenuOpen, mounted]);

  useEffect(() => {
    if (!mounted) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
        setSearchOpen(false);
        setMobileMenuOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mounted]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      setCart(null);
      toast.success('Signed out successfully');
      router.push('/');
    } catch {
      toast.error('Failed to sign out. Please try again.');
    } finally {
      setUserMenuOpen(false);
    }
  }, [signOut, setCart, router]);

  const openAuth = useCallback((mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  }, []);

  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const userInitial = profile?.full_name?.[0]?.toUpperCase() ?? 
                     profile?.email?.[0]?.toUpperCase() ?? 'U';
  const userName = profile?.full_name?.split(' ')[0] ?? 
                  profile?.email?.split('@')[0] ?? 'Account';

  return (
    <>
      {/* FIXED NAVBAR CONTAINER */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* ANNOUNCEMENT BAR */}
        <div>
          <AnnouncementBar />
        </div>

        {/* MAIN NAVBAR */}
        <header className={cn(
          "bg-white/95 border-b border-gray-200 transition-all duration-300",
          scrolled && "bg-white/90 backdrop-blur-xl shadow-lg border-gray-300"
        )}>
          <nav className="mx-auto px-1 lg:px-18 h-12 flex items-center justify-between ">
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <Icons.Menu />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5  rounded-xl hover:bg-gray-50 transition-colors group">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:rotate-6 group-hover:scale-105 transition-transform duration-200">
                <Icons.Logo />
              </div>
              <div className="flex flex-col leading-none mr-12">
                <span className="text-lg font-black text-gray-900 font-serif tracking-tight">
                  Sally&rsquo;s
                </span>
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                  Clothing &amp; More
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ href, label }) => {
                const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                      isActive 
                        ? "text-indigo-600 bg-indigo-50 font-bold" 
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    {label}
                    {isActive && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Search Button */}
              <button 
                onClick={() => setSearchOpen(true)} 
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors"
              >
                <Icons.Search size={14} />
                <span className="hidden sm:block">I am looking for...</span>
              </button>

              {/* Cart Button (Desktop only) */}
              <button
                onClick={toggleCart}
                className="hidden md:flex items-center justify-center w-10 h-8 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors relative"
              >
                <Icons.Bag size={18} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shadow-lg">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </button>

              {/* User Menu / Authentication */}
              {mounted && isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(prev => !prev)}
                    className={cn(
                      "flex items-center gap-2 px-1 pr-2 py-1 rounded-lg border transition-colors",
                      userMenuOpen 
                        ? "bg-gray-100 border-gray-300" 
                        : "border-transparent hover:bg-gray-100 hover:border-gray-200"
                    )}
                  >
                    <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-bold rounded-lg flex items-center justify-center shadow-md">
                      {userInitial}
                    </span>
                    <span className="hidden lg:block text-sm font-semibold text-gray-700">
                      {userName}
                    </span>
                    <Icons.ChevronDown className={cn(
                      "hidden lg:block text-gray-400 transition-transform duration-200",
                      userMenuOpen && "rotate-180"
                    )} />
                  </button>
                  {userMenuOpen && (
                    <UserDropdown 
                      profile={profile} 
                      isAdmin={isAdmin} 
                      userInitial={userInitial} 
                      onSignOut={handleSignOut} 
                    />
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5">
                  <button 
                    onClick={() => openAuth('login')} 
                    className="px-3 py-1.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => openAuth('register')} 
                    className="px-3 py-1.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </nav>
          
          {/* Progress indicator */}
          {scrolled && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
          )}
        </header>
      </div>

      {/* CONTENT SPACER - REDUCED HEIGHT */}
      <div className="h-[80px] sm:h-[88px]" />

      {/* Mobile Menu */}
      <MobileMenu 
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isAuthenticated={isAuthenticated}
        profile={profile}
        userInitial={userInitial}
        onSignOut={handleSignOut}
        onOpenAuth={openAuth}
      />

      {/* Search Overlay */}
      <SearchOverlay open={searchOpen} onClose={closeSearch} />

      {/* Mobile Bottom Navigation - FIXED */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-lg pb-safe">
        <div className="flex items-stretch h-16 px-2 gap-0.5">
          {MOBILE_BOTTOM_LINKS.map(({ href, label, icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            const needsAuth = (href === '/wishlist' || href === '/profile') && !isAuthenticated;

            if (href === '/profile' && mounted && isAuthenticated) {
              return (
                <Link 
                  key={href} 
                  href={href} 
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all duration-200 relative",
                    isActive 
                      ? "text-indigo-600 bg-gradient-to-b from-indigo-50 to-transparent" 
                      : "text-gray-500 hover:text-gray-700 active:bg-gray-100"
                  )}
                >
                  {isActive && (
                    <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-b-full" />
                  )}
                  <span className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold rounded-lg flex items-center justify-center shadow-md">
                    {userInitial}
                  </span>
                  <span className="text-xs font-semibold">{userName}</span>
                </Link>
              );
            }

            if (needsAuth) {
              return (
                <button 
                  key={href} 
                  onClick={() => openAuth('login')} 
                  className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-gray-500 hover:text-gray-700 active:bg-gray-100 transition-all duration-200"
                >
                  <span className="w-6 h-6 flex items-center justify-center">
                    <MobileIcon icon={icon} />
                  </span>
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              );
            }

            return (
              <Link 
                key={href} 
                href={href} 
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all duration-200 relative",
                  isActive 
                    ? "text-indigo-600 bg-gradient-to-b from-indigo-50 to-transparent" 
                    : "text-gray-500 hover:text-gray-700 active:bg-gray-100"
                )}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-b-full" />
                )}
                <span className={cn(
                  "w-6 h-6 flex items-center justify-center transition-transform duration-200",
                  isActive && "-translate-y-0.5"
                )}>
                  <MobileIcon icon={icon} />
                </span>
                <span className="text-xs font-semibold">{label}</span>
              </Link>
            );
          })}

          {/* Cart Tab (Mobile only) */}
          <button
            onClick={toggleCart}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-gray-500 hover:text-gray-700 active:bg-gray-100 transition-all duration-200 relative"
          >
            <span className="w-6 h-6 flex items-center justify-center relative">
              <Icons.Bag size={22} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 border-2 border-white">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </span>
            <span className="text-xs font-semibold">Cart</span>
          </button>
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        defaultView={authModalMode} 
      />
    </>
  );
}