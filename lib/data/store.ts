// lib/data/store.ts
// Server-side data access for the storefront.
// Uses Supabase when configured, and transparently falls back to the bundled
// demo catalogue so pages never crash or render empty during local previews.

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
}

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
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }
}

function filterDemoProducts(query: ProductQuery): Product[] {
  let products = [...demoProducts];

  if (query.categorySlug) {
    const category = findDemoCategory(query.categorySlug);
    if (category) {
      products = products.filter((p) => p.category_id === category.id);
    }
  }

  const ids = query.categoryId
    ? [query.categoryId]
    : query.categoryIds ?? [];

  if (ids.length > 0) {
    products = products.filter(
      (p) => p.category_id !== null && ids.includes(p.category_id)
    );
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
          (p.description ?? '').toLowerCase().includes(term) ||
          (p.category?.name ?? '').toLowerCase().includes(term)
      );
    }
  }

  products = sortProducts(products, query.sort);

  return query.limit ? products.slice(0, query.limit) : products;
}

/** Attach the demo category object to products so cards can show labels. */
export function withCategories(products: Product[]): Product[] {
  return products.map((product) => ({
    ...product,
    category:
      product.category ??
      demoCategories.find((c) => c.id === product.category_id),
  }));
}

export async function getCategories(): Promise<DemoCategory[]> {
  if (isSupabaseConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .eq('archived', false)
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as DemoCategory[];
      }
    } catch (error) {
      console.error('getCategories: falling back to demo data', error);
    }
  }

  return demoCategories;
}

export async function getCategoryBySlug(
  slug: string
): Promise<DemoCategory | null> {
  if (isSupabaseConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .eq('archived', false)
        .maybeSingle();

      if (!error && data) return data as DemoCategory;
    } catch (error) {
      console.error('getCategoryBySlug: falling back to demo data', error);
    }
  }

  return findDemoCategory(slug);
}

export async function getBanners() {
  if (isSupabaseConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .eq('archived', false)
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (error) {
      console.error('getBanners: falling back to demo data', error);
    }
  }

  return demoBanners;
}

export async function getProducts(
  query: ProductQuery = {}
): Promise<Product[]> {
  if (isSupabaseConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      let request = supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('is_active', true)
        .eq('archived', false);

      const ids = query.categoryId
        ? [query.categoryId]
        : query.categoryIds ?? [];

      if (ids.length === 1) {
        request = request.eq('category_id', ids[0]);
      } else if (ids.length > 1) {
        request = request.in('category_id', ids);
      }

      if (query.excludeId) {
        request = request.neq('id', query.excludeId);
      }

      if (query.dealsOnly) {
        request = request
          .not('compare_at_price', 'is', null)
          .gt('compare_at_price', 0);
      }

      if (query.featuredOnly) {
        request = request.eq('is_featured', true);
      }

      if (query.skinType) {
        request = request.contains('skin_types', [query.skinType]);
      }

      if (query.search) {
        request = request.ilike('name', `%${query.search.trim()}%`);
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

      if (query.limit) {
        request = request.limit(query.limit);
      }

      const { data, error } = await request;

      if (!error && data && data.length > 0) {
        let products = data as Product[];
        if (query.categorySlug) {
          products = products.filter(
            (p) => p.category?.slug === query.categorySlug
          );
        }
        return withCategories(products);
      }
    } catch (error) {
      console.error('getProducts: falling back to demo data', error);
    }
  }

  return withCategories(filterDemoProducts(query));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isSupabaseConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from('products')
        .select(
          '*, category:categories(*), variants:product_variants(*)'
        )
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) return data as Product;
    } catch (error) {
      console.error('getProductBySlug: falling back to demo data', error);
    }
  }

  return findDemoProduct(slug);
}

export async function getRelatedProducts(
  product: Product,
  limit = 4
): Promise<Product[]> {
  const products = await getProducts({
    categoryId: product.category_id ?? undefined,
    excludeId: product.id,
    limit,
  });

  if (products.length > 0) return products;

  return getProducts({ excludeId: product.id, limit });
}

export async function getDealProducts(limit = 8) {
  const deals = await getProducts({ dealsOnly: true, limit });
  if (deals.length > 0) return deals;
  return getProducts({ limit });
}

export interface HomeData {
  banners: Awaited<ReturnType<typeof getBanners>>;
  categories: DemoCategory[];
  hotArrivals: Product[];
  topPicks: Product[];
  hotSellers: Product[];
  showrooms: Array<
    (typeof demoShowrooms)[number] & { products: Product[] }
  >;
}

export async function getHomeData(): Promise<HomeData> {
  const [banners, categories, hotArrivals, topPicks, hotSellers, deals, newIn] =
    await Promise.all([
      getBanners(),
      getCategories(),
      getProducts({ limit: 10 }),
      getProducts({ sort: 'price_desc', limit: 8 }),
      getProducts({ dealsOnly: true, limit: 8 }),
      getDealProducts(6),
      getProducts({ limit: 6 }),
    ]);

  return {
    banners,
    categories,
    hotArrivals,
    topPicks,
    hotSellers,
    showrooms: [
      { ...demoShowrooms[0], products: deals },
      { ...demoShowrooms[1], products: newIn },
    ],
  };
}
