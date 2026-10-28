// components/layout/Navbar.tsx
'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { cn, formatCedis } from '@/lib/utils';
import { useAuthModal } from '@/stores/authModalStore';
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
  { href: '/products?sort=newest', label: 'New in' },
  { href: '/products?sort=popular', label: 'Bestsellers' },
  { href: '/products?deals=1', label: 'Reduced' },
  { href: '/blog', label: 'Journal' },
] as const;

function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex shrink-0 items-baseline gap-2" aria-label={site.nameFull}>
      <span
        className={cn(
          'font-serif leading-none tracking-[-0.02em] text-ink transition-colors group-hover:text-sage-deep',
          compact ? 'text-[23px]' : 'text-[25px] sm:text-[30px]'
        )}
      >
        Glow<span className="text-sage-deep">-</span>Up
      </span>
      <span className="hidden flex-col leading-none sm:flex">
        <span className="text-[8px] font-bold uppercase tracking-[0.28em] text-muted">
          Skincare
        </span>
        <span className="mt-1 text-[8px] font-bold uppercase tracking-[0.28em] text-muted">
          Mother care
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
  const openAuthModal = useAuthModal((state) => state.openAuth);

  const accountRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
    setSearchOpen(false);
    setCategoriesOpen(false);
    setAccountOpen(false);
  }

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (accountRef.current && !accountRef.current.contains(target)) setAccountOpen(false);
      if (categoryRef.current && !categoryRef.current.contains(target)) setCategoriesOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const openAuth = useCallback(
    (mode: 'login' | 'register') => {
      openAuthModal({ view: mode, redirectTo: pathname || '/' });
      setMobileOpen(false);
      setAccountOpen(false);
    },
    [openAuthModal, pathname]
  );

  const handleSignOut = async () => {
    setAccountOpen(false);
    setMobileOpen(false);
    await signOut();
  };

  const displayName =
    profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0] || 'Account';

  return (
    <>
      {/* ── Thin notice line ──────────────────────────────────── */}
      <div className="border-b border-line bg-paper-deep">
        <div className="container-page flex h-8 items-center justify-between gap-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          <p className="truncate">
            Free delivery over {formatCedis(site.freeDeliveryThreshold)}
            <span className="mx-2 hidden text-line sm:inline">/</span>
            <span className="hidden sm:inline">{site.hoursSummary}</span>
          </p>
          <div className="flex shrink-0 items-center gap-4">
            <a href={`tel:${site.phone}`} className="hover:text-sage-deep">
              {site.phoneDisplay}
            </a>
            <Link href="/orders" className="hidden hover:text-sage-deep sm:inline">
              Track an order
            </Link>
            <Link href="/contact" className="hidden hover:text-sage-deep md:inline">
              Help
            </Link>
          </div>
        </div>
      </div>

      {/* ── Masthead ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
        <div className="container-page">
          <div className="flex h-16 items-center gap-3 sm:h-[74px] sm:gap-7">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="-ml-1.5 flex h-9 w-9 items-center justify-center text-ink lg:hidden"
              aria-label="Open menu"
            >
              <span className="flex flex-col gap-[5px]" aria-hidden="true">
                <span className="block h-px w-5 bg-current" />
                <span className="block h-px w-5 bg-current" />
                <span className="block h-px w-3 bg-current" />
              </span>
            </button>

            <Wordmark />

            {/* Desktop search — a ruled line, not a box */}
            <form
              action="/products"
              role="search"
              className="ml-2 hidden flex-1 items-center border-b border-line pb-1 focus-within:border-sage-deep md:flex"
            >
              <input
                name="q"
                type="search"
                placeholder="Bodyspray, shea, diapers, shampoo…"
                aria-label="Search products"
                className="h-8 w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-gray-400"
              />
              <button
                type="submit"
                className="shrink-0 pl-3 text-[10px] font-bold uppercase tracking-[0.14em] text-sage-deep hover:text-sage-ink"
              >
                Search
              </button>
            </form>

            <div className="ml-auto flex items-center gap-4 sm:gap-6">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink md:hidden"
                aria-label="Search"
              >
                Search
              </button>

              {/* Account */}
              <div ref={accountRef} className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setAccountOpen((value) => !value)}
                  className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink hover:text-sage-deep"
                  aria-expanded={accountOpen}
                >
                  {mounted && isAuthenticated ? displayName : 'Sign in'}
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-[calc(100%+14px)] w-56 border border-line bg-white">
                    {!authLoading && isAuthenticated ? (
                      <>
                        <div className="border-b border-line px-4 py-3">
                          <p className="truncate font-serif text-[14px] text-ink">
                            {profile?.full_name || displayName}
                          </p>
                          <p className="truncate text-[10.5px] text-muted">{profile?.email}</p>
                        </div>
                        <div className="py-1.5">
                          {[
                            { href: '/account', label: 'My account' },
                            { href: '/orders', label: 'My orders' },
                            { href: '/profile', label: 'Saved items' },
                            { href: '/admin/dashboard', label: 'Shop dashboard' },
                          ].map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="block px-4 py-2 text-[12px] text-gray-700 hover:bg-sage-wash hover:text-sage-deep"
                            >
                              {item.label}
                            </Link>
                          ))}
                          <button
                            type="button"
                            onClick={handleSignOut}
                            className="block w-full px-4 py-2 text-left text-[12px] text-gray-700 hover:bg-sage-wash hover:text-sage-deep"
                          >
                            Sign out
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-4">
                        <p className="mb-3 text-[11.5px] leading-relaxed text-muted">
                          Sign in to see your orders and check out faster.
                        </p>
                        <button
                          type="button"
                          onClick={() => openAuth('login')}
                          className="btn-brand h-9 w-full text-[11px] uppercase tracking-[0.1em]"
                        >
                          Sign in
                        </button>
                        <button
                          type="button"
                          onClick={() => openAuth('register')}
                          className="mt-1.5 h-9 w-full border border-line text-[11px] font-bold uppercase tracking-[0.1em] text-ink hover:border-sage-deep"
                        >
                          Create account
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bag */}
              <button
                type="button"
                onClick={toggleCart}
                className="flex items-baseline gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink hover:text-sage-deep"
                aria-label={`Open bag, ${totalItems} items`}
              >
                Bag
                <span className="text-sage-deep tabular-nums">
                  {totalItems.toString().padStart(2, '0')}
                </span>
                <span className="hidden text-[10px] font-medium normal-case tracking-normal text-muted lg:inline">
                  {formatCedis(totalPrice)}
                </span>
              </button>
            </div>
          </div>

          {/* Mobile search */}
          <form action="/products" role="search" className="pb-2.5 md:hidden">
            <div className="flex items-center border-b border-line">
              <input
                name="q"
                type="search"
                placeholder="Search the shelves"
                aria-label="Search products"
                className="h-8 w-full bg-transparent text-[13px] outline-none placeholder:text-gray-400"
              />
            </div>
          </form>
        </div>

        {/* ── Departments ─────────────────────────────────────── */}
        <div className="hidden border-t border-line bg-paper lg:block">
          <div className="container-page flex h-11 items-center gap-6">
            <div ref={categoryRef} className="relative">
              <button
                type="button"
                onClick={() => setCategoriesOpen((value) => !value)}
                className="flex h-11 items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-sage-deep"
                aria-expanded={categoriesOpen}
              >
                All departments
                <span aria-hidden="true" className="text-[9px]">
                  {categoriesOpen ? '−' : '+'}
                </span>
              </button>

              {categoriesOpen && (
                <div className="absolute left-0 top-full z-50 grid w-[560px] grid-cols-2 gap-px border border-line bg-line">
                  {NAV_CATEGORIES.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/categories/${category.slug}`}
                      className="group bg-white px-4 py-3 hover:bg-sage-wash"
                    >
                      <span className="block font-serif text-[15px] text-ink group-hover:text-sage-deep">
                        {category.name}
                      </span>
                      <span className="mt-0.5 block line-clamp-1 text-[10.5px] text-muted">
                        {category.blurb}
                      </span>
                    </Link>
                  ))}
                  <Link
                    href="/products"
                    className="col-span-2 bg-paper px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-sage-deep hover:bg-sage-wash"
                  >
                    Every product in the shop
                  </Link>
                </div>
              )}
            </div>

            <nav className="flex items-center gap-6">
              {PRIMARY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-gray-700 transition-colors hover:text-sage-deep"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <a
              href={`https://wa.me/${site.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-[10.5px] font-semibold uppercase tracking-[0.14em] text-sage-deep underline decoration-sage/40 underline-offset-4 hover:decoration-sage-deep"
            >
              Ask on WhatsApp
            </a>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ─────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-paper">
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <Wordmark compact />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted"
                aria-label="Close menu"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-muted">
                Departments
              </p>
              <div className="mt-2 border-t border-line">
                {NAV_CATEGORIES.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/categories/${category.slug}`}
                    className="flex items-baseline justify-between border-b border-line py-2.5"
                  >
                    <span className="font-serif text-[16px] text-ink">{category.name}</span>
                    <span aria-hidden="true" className="text-[11px] text-muted">
                      →
                    </span>
                  </Link>
                ))}
              </div>

              <p className="mt-6 text-[9.5px] font-bold uppercase tracking-[0.2em] text-muted">
                Elsewhere
              </p>
              <div className="mt-2 border-t border-line">
                {[
                  { href: '/products', label: 'Everything' },
                  { href: '/products?deals=1', label: 'Reduced' },
                  { href: '/orders', label: 'Track my order' },
                  { href: '/about', label: 'About the shop' },
                  { href: '/contact', label: 'Contact' },
                  { href: '/sitemap', label: 'Sitemap' },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block border-b border-line py-2.5 text-[13px] text-gray-700"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-2">
                {mounted && isAuthenticated ? (
                  <>
                    <Link
                      href="/account"
                      className="btn-brand h-10 text-[11px] uppercase tracking-[0.12em]"
                    >
                      My account
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="h-10 border border-line text-[11px] font-bold uppercase tracking-[0.12em] text-ink"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => openAuth('login')}
                      className="btn-brand h-10 text-[11px] uppercase tracking-[0.12em]"
                    >
                      Sign in
                    </button>
                    <button
                      type="button"
                      onClick={() => openAuth('register')}
                      className="h-10 border border-line text-[11px] font-bold uppercase tracking-[0.12em] text-ink"
                    >
                      Create account
                    </button>
                  </>
                )}
              </div>

              <a
                href={`tel:${site.phone}`}
                className="mt-6 block border-t border-line pt-3 text-[11px] uppercase tracking-[0.13em] text-sage-deep"
              >
                Call the shop · {site.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      )}

      {searchOpen && <SearchOverlay key="search" open onClose={() => setSearchOpen(false)} />}

      {/* ── Mobile bottom bar ─────────────────────────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid grid-cols-4">
          {[
            { href: '/', label: 'Home' },
            { href: '/products', label: 'Shop' },
            { href: '/categories/bath-body-care', label: 'Shelves' },
          ].map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'py-2.5 text-center text-[9.5px] font-bold uppercase tracking-[0.13em]',
                  active ? 'text-sage-deep' : 'text-muted'
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={toggleCart}
            className="relative py-2.5 text-center text-[9.5px] font-bold uppercase tracking-[0.13em] text-muted"
          >
            Bag
            {totalItems > 0 && (
              <span className="ml-1 text-sage-deep tabular-nums">{totalItems}</span>
            )}
          </button>
        </div>
      </nav>
    </>
  );
}

/* ── Search overlay ─────────────────────────────────────────── */

function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 80);
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, [open]);

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
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 bg-ink/45"
        onClick={onClose}
      />
      <div className="relative mx-auto mt-[10vh] w-[94%] max-w-xl border border-line bg-paper shadow-2xl">
        <form onSubmit={submit} className="flex items-center gap-3 border-b border-line px-4 py-3">
          <input
            ref={inputRef}
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search the shelves"
            className="h-9 flex-1 bg-transparent font-serif text-[17px] outline-none placeholder:font-sans placeholder:text-[13px] placeholder:text-gray-400"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted"
          >
            Close
          </button>
        </form>

        <div className="max-h-[58vh] overflow-y-auto p-4">
          {term.trim().length < 2 ? (
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted">
                People look for
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {POPULAR_SEARCHES.map((keyword) => (
                  <button
                    key={keyword}
                    type="button"
                    onClick={() => setTerm(keyword)}
                    className="border border-line px-2.5 py-1 text-[11.5px] text-gray-700 hover:border-sage-deep hover:text-sage-deep"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>
          ) : loading ? (
            <p className="py-6 text-center text-[12px] text-muted">Looking…</p>
          ) : results.length === 0 ? (
            <div className="py-6 text-center">
              <p className="font-serif text-[16px] text-ink">Nothing under “{term}”</p>
              <p className="mt-1 text-[11.5px] text-muted">
                We may still have it in the shop — ask us on WhatsApp.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={`/products/${result.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-3 py-2 hover:bg-white"
                >
                  <span className="relative h-11 w-11 shrink-0 overflow-hidden bg-paper-deep">
                    {result.thumbnail && (
                      <Image
                        src={result.thumbnail}
                        alt={result.name}
                        fill
                        className="object-cover"
                        sizes="44px"
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] text-ink">{result.name}</span>
                    <span className="block text-[11.5px] font-semibold text-sage-deep tabular-nums">
                      {formatCedis(result.price ?? 0)}
                      {result.compare_at_price ? (
                        <span className="ml-2 font-normal text-gray-400 line-through">
                          {formatCedis(result.compare_at_price)}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
