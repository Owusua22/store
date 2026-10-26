// lib/data/store.ts
// Server-side data access for the storefront.
//
// Live mode (Supabase configured) is AUTHORITATIVE: every read comes from
// Postgres and an empty catalogue renders as empty. The bundled demo catalogue
// is only used when no Supabase project is configured, so a real store never
// shows sample products by accident.

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import {
  demoBanners,
  demoCategories,
  demoProducts,
  demoShowrooms,
  findDemoCategory,
  findDemoProduct,
  type DemoCategory,
} from '@/lib/demo/catalog';
import type { Product } from '@/types';

export type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'name';

export interface ProductQuery {
  categoryId?: string;
  categoryIds?: string[];
  categorySlug?: string;
  search?: string;
  limit?: number;
  sort?: SortKey;
  dealsOnly?: boolean;
  excludeId?: string;
  /** e.g. 'dry' | 'oily' | 'sensitive' — matches products flagged for that skin type */
  skinType?: string;
  featuredOnly?: boolean;
  inStockOnly?: boolean;
}

export interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  image_url: string;
  link_url: string | null;
  link_text: string | null;
  text_color?: string | null;
  overlay_opacity?: number | null;
  sort_order: number;
  is_active: boolean;
}

export interface StoreShowroom {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  type: string;
  sort_order: number;
  show_on_homepage: boolean;
  max_products: number;
  products: Product[];
}

const LIVE = isSupabaseConfigured;

function sortProducts(products: Product[], sort: SortKey = 'newest') {
  const list = [...products];

  switch (sort) {
    case 'price_asc':
      return list.sort((a, b) => a.price - b.price);
    case 'price_desc':
      return list.sort((a, b) => b.price - a.price);
    case 'name':
      return list.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return list.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }
}

/** Escapes a value for use inside a PostgREST `or=(…)` filter. */
function escapeFilter(value: string) {
  return value.replace(/[,()*]/g, ' ').replace(/\s+/g, ' ').trim();
}

function filterDemoProducts(query: ProductQuery): Product[] {
  let products = [...demoProducts];

  if (query.categorySlug) {
    const category = findDemoCategory(query.categorySlug);
    if (category) {
      products = products.filter((p) => p.category_id === category.id);
    }
  }

  const ids = query.categoryId ? [query.categoryId] : query.categoryIds ?? [];

  if (ids.length > 0) {
    products = products.filter((p) => p.category_id !== null && ids.includes(p.category_id));
  }

  if (query.excludeId) {
    products = products.filter((p) => p.id !== query.excludeId);
  }

  if (query.dealsOnly) {
    products = products.filter(
      (p) => p.compare_at_price !== null && p.compare_at_price > p.price
    );
  }

  if (query.featuredOnly) {
    products = products.filter((p) => p.is_featured);
  }

  if (query.inStockOnly) {
    products = products.filter((p) => p.stock_quantity > 0);
  }

  if (query.skinType) {
    products = products.filter(
      (p) =>
        (p.skin_types ?? []).length === 0 ||
        (p.skin_types ?? []).includes(query.skinType as string)
    );
  }

  if (query.search) {
    const term = query.search.trim().toLowerCase();
    if (term.length > 0) {
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.brand ?? '').toLowerCase().includes(term) ||
          (p.description ?? '').toLowerCase().includes(term) ||
          (p.category?.name ?? '').toLowerCase().includes(term)
      );
    }
  }

  products = sortProducts(products, query.sort);

  return query.limit ? products.slice(0, query.limit) : products;
}

/** Attach a category object to products (demo catalogue helper). */
export function withCategories(products: Product[]): Product[] {
  return products.map((product) => ({
    ...product,
    category: product.category ?? demoCategories.find((c) => c.id === product.category_id),
  }));
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export async function getCategories(): Promise<DemoCategory[]> {
  if (!LIVE) return demoCategories;

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .eq('archived', false)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('getCategories failed:', error.message);
      return [];
    }

    return (data ?? []) as DemoCategory[];
  } catch (error) {
    console.error('getCategories failed:', error);
    return [];
  }
}

export async function getCategoryBySlug(slug: string): Promise<DemoCategory | null> {
  if (!LIVE) return findDemoCategory(slug);

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .eq('archived', false)
      .maybeSingle();

    if (error) {
      console.error('getCategoryBySlug failed:', error.message);
      return null;
    }

    return (data as DemoCategory | null) ?? null;
  } catch (error) {
    console.error('getCategoryBySlug failed:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------
export async function getBanners(): Promise<Banner[]> {
  if (!LIVE) return demoBanners as Banner[];

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .eq('archived', false)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('getBanners failed:', error.message);
      return [];
    }

    return (data ?? []) as Banner[];
  } catch (error) {
    console.error('getBanners failed:', error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
export async function getProducts(query: ProductQuery = {}): Promise<Product[]> {
  if (!LIVE) return withCategories(filterDemoProducts(query));

  try {
    const supabase = await createServerSupabaseClient();

    // Resolve a category slug to its id so filtering happens in Postgres.
    let categoryIds = query.categoryId ? [query.categoryId] : query.categoryIds ?? [];

    if (query.categorySlug) {
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', query.categorySlug)
        .maybeSingle();

      if (!category) return [];
      categoryIds = [category.id];
    }

    let request = supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_active', true)
      .eq('archived', false);

    if (categoryIds.length === 1) {
      request = request.eq('category_id', categoryIds[0]);
    } else if (categoryIds.length > 1) {
      request = request.in('category_id', categoryIds);
    }

    if (query.excludeId) request = request.neq('id', query.excludeId);
    if (query.dealsOnly) request = request.not('compare_at_price', 'is', null);
    if (query.featuredOnly) request = request.eq('is_featured', true);
    if (query.inStockOnly) request = request.gt('stock_quantity', 0);
    if (query.skinType) request = request.contains('skin_types', [query.skinType]);

    const term = escapeFilter(query.search?.trim() ?? '');
    if (term.length >= 2) {
      request = request.or(
        `name.ilike.%${term}%,brand.ilike.%${term}%,description.ilike.%${term}%`
      );
    }

    switch (query.sort) {
      case 'price_asc':
        request = request.order('price', { ascending: true });
        break;
      case 'price_desc':
        request = request.order('price', { ascending: false });
        break;
      case 'name':
        request = request.order('name', { ascending: true });
        break;
      default:
        request = request.order('created_at', { ascending: false });
    }

    if (query.limit) request = request.limit(query.limit);

    const { data, error } = await request;

    if (error) {
      console.error('getProducts failed:', error.message);
      return [];
    }

    let products = (data ?? []) as Product[];

    // Only show genuine markdowns: compare_at_price must beat the selling price.
    if (query.dealsOnly) {
      products = products.filter(
        (product) =>
          product.compare_at_price !== null && product.compare_at_price > product.price
      );
    }

    return products;
  } catch (error) {
    console.error('getProducts failed:', error);
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!LIVE) return findDemoProduct(slug);

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*), variants:product_variants(*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('getProductBySlug failed:', error.message);
      return null;
    }

    return (data as Product | null) ?? null;
  } catch (error) {
    console.error('getProductBySlug failed:', error);
    return null;
  }
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const sameCategory = await getProducts({
    categoryId: product.category_id ?? undefined,
    excludeId: product.id,
    limit,
  });

  if (sameCategory.length > 0) return sameCategory;

  return getProducts({ excludeId: product.id, limit });
}

export async function getDealProducts(limit = 8) {
  const deals = await getProducts({ dealsOnly: true, limit });
  if (deals.length > 0) return deals;
  return getProducts({ sort: 'price_desc', limit });
}

// ---------------------------------------------------------------------------
// Showrooms
// ---------------------------------------------------------------------------
export async function getShowrooms(options: { homepageOnly?: boolean } = {}): Promise<
  StoreShowroom[]
> {
  if (!LIVE) {
    const [deals, newIn] = await Promise.all([
      getDealProducts(8),
      getProducts({ limit: 8 }),
    ]);
    return demoShowrooms.map((showroom, index) => ({
      ...showroom,
      products: index === 0 ? deals : newIn,
    })) as StoreShowroom[];
  }

  try {
    const supabase = await createServerSupabaseClient();
    let request = supabase
      .from('showrooms')
      .select('*, items:showroom_products(product:products(*))')
      .eq('is_active', true)
      .eq('archived', false)
      .order('sort_order', { ascending: true });

    if (options.homepageOnly) request = request.eq('show_on_homepage', true);

    const { data, error } = await request;

    if (error) {
      console.error('getShowrooms failed:', error.message);
      return [];
    }

    const rows = (data ?? []) as Array<
      Omit<StoreShowroom, 'products'> & {
        items: Array<{ product: Product | null }> | null;
        max_products?: number;
      }
    >;

    const autoProducts = new Map<string, Product[]>();

    const resolveProducts = async (showroom: (typeof rows)[number]) => {
      const limit = showroom.max_products ?? 8;

      if (showroom.type === 'manual') {
        return (showroom.items ?? [])
          .map((item) => item.product)
          .filter((product): product is Product => Boolean(product?.is_active))
          .slice(0, limit);
      }

      const cacheKey = `${showroom.type}:${limit}`;
      if (!autoProducts.has(cacheKey)) {
        let products: Product[] = [];
        if (showroom.type === 'auto_deals') {
          products = await getProducts({ dealsOnly: true, limit });
        } else if (showroom.type === 'auto_bestselling') {
          const supabaseClient = await createServerSupabaseClient();
          const { data: bestsellers } = await supabaseClient
            .from('products')
            .select('*, category:categories(*)')
            .eq('is_active', true)
            .eq('archived', false)
            .order('sold_count', { ascending: false })
            .limit(limit);
          products = (bestsellers ?? []) as Product[];
        } else {
          products = await getProducts({ limit });
        }
        autoProducts.set(cacheKey, products);
      }
      return autoProducts.get(cacheKey) ?? [];
    };

    const showrooms: StoreShowroom[] = [];
    for (const row of rows) {
      const products = await resolveProducts(row);
      if (products.length === 0) continue;
      showrooms.push({ ...row, products, max_products: row.max_products ?? 8 });
    }

    return showrooms;
  } catch (error) {
    console.error('getShowrooms failed:', error);
    return [];
  }
}

/** Single showroom with its resolved products (live or demo). */
export async function getShowroomBySlug(slug: string): Promise<StoreShowroom | null> {
  if (!LIVE) {
    const showroom = demoShowrooms.find((item) => item.slug === slug);
    if (!showroom) return null;

    const products =
      showroom.type === 'auto_deals'
        ? await getDealProducts(showroom.max_products)
        : await getProducts({ limit: showroom.max_products });

    return { ...showroom, products } as StoreShowroom;
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: showroom, error } = await supabase
      .from('showrooms')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .eq('archived', false)
      .maybeSingle();

    if (error) {
      console.error('getShowroomBySlug failed:', error.message);
      return null;
    }
    if (!showroom) return null;

    const limit = showroom.max_products ?? 24;
    let products: Product[] = [];

    if (showroom.type === 'manual') {
      const { data: items } = await supabase
        .from('showroom_products')
        .select('sort_order, product:products(*, category:categories(*))')
        .eq('showroom_id', showroom.id)
        .order('sort_order', { ascending: true });

      products = ((items ?? []) as unknown as Array<{ product: Product | null }>)
        .map((item) => item.product)
        .filter((product): product is Product => Boolean(product?.is_active && !product.archived))
        .slice(0, limit);
    } else if (showroom.type === 'auto_deals') {
      products = await getProducts({ dealsOnly: true, limit });
    } else if (showroom.type === 'auto_bestselling') {
      const { data } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('is_active', true)
        .eq('archived', false)
        .order('sold_count', { ascending: false })
        .limit(limit);
      products = (data ?? []) as Product[];
    } else {
      products = await getProducts({ limit });
    }

    return { ...showroom, products } as StoreShowroom;
  } catch (error) {
    console.error('getShowroomBySlug failed:', error);
    return null;
  }
}

/** Every active showroom (used by the showroom sidebar). */
export async function getAllShowrooms(): Promise<
  Array<{ id: string; name: string; slug: string; icon: string | null; type: string }>
> {
  if (!LIVE) {
    return demoShowrooms.map(({ id, name, slug, icon, type }) => ({ id, name, slug, icon, type }));
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from('showrooms')
      .select('id, name, slug, icon, type')
      .eq('is_active', true)
      .eq('archived', false)
      .order('sort_order', { ascending: true });

    return data ?? [];
  } catch (error) {
    console.error('getAllShowrooms failed:', error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Homepage aggregate
// ---------------------------------------------------------------------------
export interface HomeData {
  banners: Banner[];
  categories: DemoCategory[];
  hotArrivals: Product[];
  topPicks: Product[];
  hotSellers: Product[];
  showrooms: StoreShowroom[];
}

export async function getHomeData(): Promise<HomeData> {
  const [banners, categories, hotArrivals, topPicks, hotSellers, showrooms] = await Promise.all([
    getBanners(),
    getCategories(),
    getProducts({ limit: 10 }),
    getProducts({ sort: 'price_desc', limit: 8 }),
    getDealProducts(8),
    getShowrooms({ homepageOnly: true }),
  ]);

  return { banners, categories, hotArrivals, topPicks, hotSellers, showrooms };
}

// ---------------------------------------------------------------------------
// Admin/setup helpers
// ---------------------------------------------------------------------------
export interface CatalogCounts {
  products: number;
  categories: number;
  blogPosts: number;
  orders: number;
}

/** Live table counts, used by the admin dashboard setup checklist. */
export async function getCatalogCounts(): Promise<CatalogCounts | null> {
  if (!LIVE) return null;

  try {
    const supabase = await createServerSupabaseClient();
    const [products, categories, blogPosts, orders] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
    ]);

    return {
      products: products.count ?? 0,
      categories: categories.count ?? 0,
      blogPosts: blogPosts.count ?? 0,
      orders: orders.count ?? 0,
    };
  } catch (error) {
    console.error('getCatalogCounts failed:', error);
    return null;
  }
}
