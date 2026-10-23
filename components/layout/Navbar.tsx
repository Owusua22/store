// components/layout/Navbar.tsx
'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  Grid2X2,
  Heart,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Phone,
  Search,
  ShoppingBag,
  Sparkles,
  Truck,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { cn, formatCedis } from '@/lib/utils';
import { AuthModal } from '@/components/auth/AuthModal';
import { NAV_CATEGORIES, POPULAR_SEARCHES, site } from '@/lib/site';

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  thumbnail: string | null;
  price: number | null;
  compare_at_price: number | null;
}

const PRIMARY_LINKS = [
  { href: '/products?sort=newest', label: 'New Arrivals' },
  { href: '/products?sort=popular', label: 'Best Sellers' },
  { href: '/categories/body-lotions', label: 'Body Care' },
  { href: '/categories/face-care', label: 'Face Care' },
  { href: '/categories/baby-care', label: 'Baby Care' },
] as const;

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0" aria-label={`${site.name} home`}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-sm sm:h-10 sm:w-10">
        <ShoppingBag className="h-5 w-5" strokeWidth={2.2} />
        <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-gold" />
      </span>
      <span className="leading-none">
        <span className="block text-[22px] font-extrabold tracking-tight text-brand sm:text-[26px]">
          {site.name.toLowerCase()}
        </span>
        <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.22em] text-muted sm:text-[10px]">
          {site.tagline}
        </span>
      </span>
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname() ?? '';

  const { isAuthenticated, profile, signOut, isLoading: authLoading } = useAuth();
  const { totalItems, totalPrice, toggleCart } = useCart();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const accountRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  // Track the previous pathname so client-side navigation closes every menu.
  // (React's documented "adjust state when props change" pattern.)
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
    setSearchOpen(false);
    setCategoriesOpen(false);
    setAccountOpen(false);
  }

  // Hydration-safe "mounted" flag: false while server-rendering and during the
  // first client render, true afterwards. Avoids auth/cart hydration mismatches.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (accountRef.current && !accountRef.current.contains(target)) {
        setAccountOpen(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(target)) {
        setCategoriesOpen(false);
      }
    };

    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const openAuth = useCallback((mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthOpen(true);
    setMobileOpen(false);
  }, []);

  const handleSignOut = async () => {
    setAccountOpen(false);
    setMobileOpen(false);
    await signOut();
  };

  const displayName =
    profile?.full_name?.split(' ')[0] ||
    profile?.email?.split('@')[0] ||
    'Account';
  const initial = (profile?.full_name || profile?.email || 'U')
    .charAt(0)
    .toUpperCase();

  return (
    <>
      {/* ── Utility strip ─────────────────────────────────────── */}
      <div className="hidden bg-[#f6f6f7] text-[11.5px] text-gray-600 md:block">
        <div className="container-page flex h-9 items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-brand" />
              Delivering across Ghana · Free over {formatCedis(site.freeDeliveryThreshold)}
            </span>
            <span className="h-3 w-px bg-gray-300" />
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-brand" />
              {site.phoneDisplay}
            </span>
          </div>

          <div className="flex items-center gap-5">
            <Link href="/orders" className="hover:text-brand">
              Track order
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-1 hover:text-brand">
              <HelpCircle className="h-3.5 w-3.5" />
              Help Center
            </Link>
            <Link href="/about" className="hover:text-brand">
              About us
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main header ───────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="container-page">
          <div className="flex h-16 items-center gap-3 sm:h-[72px] sm:gap-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="-ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-ink hover:bg-surface-soft lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Logo />

            {/* Desktop search */}
            <form
              action="/products"
              className="hidden flex-1 items-center md:flex"
              role="search"
            >
              <div className="flex h-11 w-full items-center rounded-lg border-2 border-brand/15 bg-surface-soft pl-3 focus-within:border-brand focus-within:bg-white">
                <Search className="h-4 w-4 shrink-0 text-gray-400" />
                <input
                  name="q"
                  type="search"
                  placeholder="Search lotions, serums, shampoo, diapers…"
                  className="h-full w-full bg-transparent px-2.5 text-[13.5px] outline-none placeholder:text-gray-400"
                  aria-label="Search products"
                />
                <button
                  type="submit"
                  className="m-1 flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-brand px-5 text-[13px] font-bold text-white transition-colors hover:bg-brand-dark"
                >
                  <Search className="h-3.5 w-3.5" />
                  Search
                </button>
              </div>
            </form>

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-surface-soft md:hidden"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Account */}
              <div ref={accountRef} className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  className="flex h-10 items-center gap-2 rounded-lg px-2 text-left hover:bg-surface-soft"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-soft text-ink">
                    {mounted && isAuthenticated ? (
                      <span className="text-xs font-extrabold text-brand">{initial}</span>
                    ) : (
                      <User className="h-[18px] w-[18px]" />
                    )}
                  </span>
                  <span className="hidden leading-tight lg:block">
                    <span className="block text-[10px] font-medium uppercase tracking-wide text-muted">
                      {mounted && isAuthenticated ? 'Welcome back' : 'Account'}
                    </span>
                    <span className="flex items-center gap-1 text-[13px] font-bold text-ink">
                      {mounted && isAuthenticated ? displayName : 'Sign in'}
                      <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                    </span>
                  </span>
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-60 overflow-hidden rounded-xl border border-line bg-white shadow-xl">
                    {!authLoading && isAuthenticated ? (
                      <>
                        <div className="border-b border-line bg-surface-soft px-4 py-3">
                          <p className="truncate text-[13px] font-bold text-ink">
                            {profile?.full_name || displayName}
                          </p>
                          <p className="truncate text-[11px] text-muted">{profile?.email}</p>
                        </div>
                        <div className="p-1.5">
                          <Link href="/account" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-gray-700 hover:bg-surface-soft">
                            <User className="h-4 w-4 text-brand" /> My account
                          </Link>
                          <Link href="/orders" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-gray-700 hover:bg-surface-soft">
                            <Package className="h-4 w-4 text-brand" /> My orders
                          </Link>
                          <Link href="/profile" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-gray-700 hover:bg-surface-soft">
                            <Heart className="h-4 w-4 text-brand" /> Saved items
                          </Link>
                          <Link href="/admin/dashboard" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-gray-700 hover:bg-surface-soft">
                            <LayoutDashboard className="h-4 w-4 text-brand" /> Dashboard
                          </Link>
                          <button
                            type="button"
                            onClick={handleSignOut}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-semibold text-red-600 hover:bg-red-50"
                          >
                            <LogOut className="h-4 w-4" /> Sign out
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-3">
                        <p className="mb-3 text-[12px] leading-relaxed text-muted">
                          Sign in for faster checkout, order tracking and exclusive deals.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setAccountOpen(false);
                            openAuth('login');
                          }}
                          className="btn-brand mb-2 h-9 w-full text-[13px]"
                        >
                          Sign in
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAccountOpen(false);
                            openAuth('register');
                          }}
                          className="h-9 w-full rounded-lg border border-line text-[13px] font-bold text-ink hover:bg-surface-soft"
                        >
                          Create account
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cart */}
              <button
                type="button"
                onClick={toggleCart}
                className="flex h-10 items-center gap-2 rounded-lg px-2 text-ink hover:bg-surface-soft"
                aria-label={`Open cart, ${totalItems} items`}
              >
                <span className="relative">
                  <ShoppingBag className="h-5 w-5" />
                  <span className="absolute -right-2 -top-2 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-extrabold text-white">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                </span>
                <span className="hidden text-left leading-tight lg:block">
                  <span className="block text-[10px] font-medium uppercase tracking-wide text-muted">
                    My cart
                  </span>
                  <span className="block text-[13px] font-bold text-ink">
                    {formatCedis(totalPrice)}
                  </span>
                </span>
              </button>
            </div>
          </div>

          {/* Mobile search row */}
          <form action="/products" className="pb-2.5 md:hidden" role="search">
            <div className="flex h-9 items-center rounded-lg border border-line bg-surface-soft pl-3">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                name="q"
                type="search"
                placeholder="Search skin care products…"
                className="h-full w-full bg-transparent px-2 text-[13px] outline-none placeholder:text-gray-400"
                aria-label="Search products"
              />
            </div>
          </form>
        </div>

        {/* ── Category navigation ───────────────────────────── */}
        <div className="hidden border-t border-line bg-white lg:block">
          <div className="container-page flex h-11 items-center gap-1">
            <div ref={categoryRef} className="relative">
              <button
                type="button"
                onClick={() => setCategoriesOpen((v) => !v)}
                className="flex h-8 items-center gap-2 rounded-md bg-brand px-3 text-[12.5px] font-bold uppercase tracking-wide text-white"
              >
                <Grid2X2 className="h-4 w-4" />
                All Categories
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', categoriesOpen && 'rotate-180')} />
              </button>

              {categoriesOpen && (
                <div className="absolute left-0 top-[calc(100%+8px)] z-50 grid w-[520px] grid-cols-2 gap-1 rounded-xl border border-line bg-white p-3 shadow-2xl">
                  {NAV_CATEGORIES.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/categories/${category.slug}`}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold text-gray-700 hover:bg-brand-soft hover:text-brand"
                    >
                      <span className="text-base">{category.icon}</span>
                      {category.name}
                      <ChevronRight className="ml-auto h-3.5 w-3.5 text-gray-300" />
                    </Link>
                  ))}
                  <Link
                    href="/products"
                    className="col-span-2 mt-1 flex items-center justify-between rounded-lg bg-surface-soft px-3 py-2 text-[12.5px] font-bold text-brand hover:bg-brand-soft"
                  >
                    Shop all products
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>

            <nav className="ml-2 flex items-center gap-0.5">
              {PRIMARY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-2 text-[12.5px] font-semibold text-gray-700 transition-colors hover:bg-brand-soft hover:text-brand"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/products?deals=1"
                className="ml-1 inline-flex items-center gap-1 rounded-md px-3 py-2 text-[12.5px] font-extrabold text-brand transition-colors hover:bg-brand-soft"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Deals
              </Link>
            </nav>

            <div className="ml-auto hidden items-center gap-1.5 text-[11.5px] font-semibold text-gray-500 xl:flex">
              <Truck className="h-4 w-4 text-brand" />
              Pay on delivery available in Accra & Kumasi
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile menu ───────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/45"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-surface-soft"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted">
                Shop by category
              </p>
              <div className="mb-5 grid grid-cols-2 gap-2">
                {NAV_CATEGORIES.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/categories/${category.slug}`}
                    className="flex items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-[12.5px] font-semibold text-gray-700"
                  >
                    <span>{category.icon}</span>
                    {category.name}
                  </Link>
                ))}
              </div>

              <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted">
                Quick links
              </p>
              <div className="mb-5 flex flex-col">
                {[
                  { href: '/', label: 'Home' },
                  { href: '/products', label: 'Shop all products' },
                  { href: '/orders', label: 'Track my order' },
                  { href: '/about', label: 'About us' },
                  { href: '/contact', label: 'Contact' },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between border-b border-line/70 py-2.5 text-[13.5px] font-semibold text-gray-800"
                  >
                    {link.label}
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </Link>
                ))}
              </div>

              {mounted && isAuthenticated ? (
                <div className="space-y-2">
                  <Link href="/account" className="btn-brand h-11 w-full text-sm">
                    My account
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="h-11 w-full rounded-lg border border-line text-sm font-bold text-gray-700"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => openAuth('login')}
                    className="btn-brand h-11 w-full text-sm"
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuth('register')}
                    className="h-11 w-full rounded-lg border border-line text-sm font-bold text-gray-700"
                  >
                    Create account
                  </button>
                </div>
              )}

              <a
                href={`tel:${site.phone}`}
                className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-surface-soft py-3 text-[12.5px] font-bold text-ink"
              >
                <Phone className="h-4 w-4 text-brand" />
                Call us: {site.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Search overlay ────────────────────────────────────── */}
      {searchOpen && (
        <SearchOverlay key="search" open onClose={() => setSearchOpen(false)} />
      )}

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultView={authMode}
      />

      {/* ── Mobile bottom nav ─────────────────────────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid grid-cols-4">
          {[
            { href: '/', label: 'Home', icon: Home },
            { href: '/products', label: 'Shop', icon: Search },
            { href: '/categories/body-lotions', label: 'Categories', icon: Grid2X2 },
          ].map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 text-[10.5px] font-semibold',
                  active ? 'text-brand' : 'text-gray-500'
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={toggleCart}
            className="relative flex flex-col items-center gap-0.5 py-2 text-[10.5px] font-semibold text-gray-500"
          >
            <ShoppingBag className="h-5 w-5" />
            Cart
            {totalItems > 0 && (
              <span className="absolute right-5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </nav>
    </>
  );
}

/* ────────────────────────────────────────────────────────────
   Search overlay with live results
   ──────────────────────────────────────────────────────────── */

function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // The overlay is mounted fresh each time it opens (keyed below), so state
  // starts empty — this effect only touches the DOM.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 80);
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, [open]);

  // Debounced live search. All setState calls happen inside the timeout
  // callback (an external event), never synchronously in the effect body.
  useEffect(() => {
    if (!open) return;

    const query = term.trim();
    if (query.length < 2) return;

    let active = true;

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/products/search?q=${encodeURIComponent(query)}&limit=6`,
          { cache: 'no-store' }
        );
        const json = await response.json();
        if (active) setResults((json.data ?? []) as SearchResult[]);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 220);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [term, open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!open) return null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const query = term.trim();
    onClose();
    router.push(query ? `/products?q=${encodeURIComponent(query)}` : '/products');
  };

  return (
    <div className="fixed inset-0 z-[70]">
      <button type="button" aria-label="Close search" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative mx-auto mt-[8vh] w-[94%] max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <form onSubmit={submit} className="flex items-center gap-2 border-b border-line px-4 py-3">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            ref={inputRef}
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search for body lotion, serum, baby diapers…"
            className="h-10 flex-1 bg-transparent text-[14px] outline-none placeholder:text-gray-400"
          />
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-soft"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </form>

        <div className="max-h-[60vh] overflow-y-auto p-3">
          {term.trim().length < 2 ? (
            <div>
              <p className="mb-2 px-1 text-[10.5px] font-bold uppercase tracking-[0.16em] text-muted">
                Popular searches
              </p>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SEARCHES.map((keyword) => (
                  <button
                    key={keyword}
                    type="button"
                    onClick={() => setTerm(keyword)}
                    className="rounded-full border border-line px-3 py-1.5 text-[12px] font-semibold text-gray-600 hover:border-brand hover:text-brand"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>
          ) : loading ? (
            <p className="px-2 py-6 text-center text-[12.5px] text-muted">Searching…</p>
          ) : results.length === 0 ? (
            <div className="px-2 py-6 text-center">
              <p className="text-[13px] font-semibold text-ink">No matches for “{term}”</p>
              <p className="mt-1 text-[12px] text-muted">Try a different product name or browse all products.</p>
              <Link href="/products" onClick={onClose} className="btn-brand mt-3 h-9 px-5 text-[12.5px]">
                Browse products
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={`/products/${result.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-surface-soft"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-soft">
                    {result.thumbnail && (
                      <Image src={result.thumbnail} alt={result.name} fill className="object-cover" sizes="48px" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{result.name}</p>
                    <p className="text-[12px] font-bold text-brand">
                      {formatCedis(result.price ?? 0)}
                      {result.compare_at_price ? (
                        <span className="ml-2 font-medium text-gray-400 line-through">
                          {formatCedis(result.compare_at_price)}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
