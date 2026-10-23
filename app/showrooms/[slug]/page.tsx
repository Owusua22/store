// app/showrooms/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ShowroomContent } from '@/components/showrooms/ShowroomContent';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

interface ShowroomProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  thumbnail: string | null;
  stock_quantity: number;
  is_active: boolean;
  sizes: string[];
  colors: string[];
  description: string | null;
  category_id: string | null;
}

interface ShowroomProductJoin {
  sort_order: number;
  product: ShowroomProduct | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: showroom } = await supabase
    .from('showrooms')
    .select('name, description, icon')
    .eq('slug', slug)
    .eq('is_active', true)
    .eq('archived', false)
    .single();

  if (!showroom) return { title: 'Showroom Not Found' };

  return {
    title: `${showroom.icon || ''} ${showroom.name} | Sally's Clothing & More`,
    description: showroom.description ?? `Browse our ${showroom.name} collection`,
  };
}

export default async function ShowroomPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch showroom
  const { data: showroom } = await supabase
    .from('showrooms')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .eq('archived', false)
    .single();

  if (!showroom) notFound();

  // Fetch products based on showroom type
  let products: ShowroomProduct[] = [];

  if (showroom.type === 'manual') {
    const { data } = await supabase
      .from('showroom_products')
      .select('sort_order, product:products(id, name, slug, price, compare_at_price, thumbnail, stock_quantity, is_active, sizes, colors, description, category_id)')
      .eq('showroom_id', showroom.id)
      .order('sort_order', { ascending: true });

    const joined = (data ?? []) as unknown as ShowroomProductJoin[];
    products = joined
      .map((sp) => sp.product)
      .filter((p): p is ShowroomProduct => p !== null && p.is_active);

  } else if (showroom.type === 'auto_new') {
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, compare_at_price, thumbnail, stock_quantity, is_active, sizes, colors, description, category_id')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(showroom.max_products || 24);

    products = (data ?? []) as ShowroomProduct[];

  } else if (showroom.type === 'auto_deals') {
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, compare_at_price, thumbnail, stock_quantity, is_active, sizes, colors, description, category_id')
      .eq('is_active', true)
      .not('compare_at_price', 'is', null)
      .order('created_at', { ascending: false })
      .limit(showroom.max_products || 24);

    products = (data ?? []) as ShowroomProduct[];

  } else if (showroom.type === 'auto_bestselling') {
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, compare_at_price, thumbnail, stock_quantity, is_active, sizes, colors, description, category_id')
      .eq('is_active', true)
      .order('stock_quantity', { ascending: true })
      .limit(showroom.max_products || 24);

    products = (data ?? []) as ShowroomProduct[];
  }

  // Fetch all showrooms for sidebar
  const { data: allShowrooms } = await supabase
    .from('showrooms')
    .select('id, name, slug, icon, type')
    .eq('is_active', true)
    .eq('archived', false)
    .order('sort_order', { ascending: true });

  return (
    <ShowroomContent
      showroom={showroom}
      products={products}
      allShowrooms={allShowrooms ?? []}
    />
  );
}