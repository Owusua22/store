// app/products/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ProductDetails } from '@/components/products/ProductDetails';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: product } = await supabase
    .from('products')
    .select('name, description, thumbnail')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!product) return { title: 'Product Not Found' };

  return {
    title: `${product.name} | Sally's Clothing & More`,
    description: product.description ?? undefined,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      images: product.thumbnail ? [{ url: product.thumbnail }] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  // ✅ Added variants:product_variants(*)
  const { data: product } = await supabase
    .from('products')
    .select('*, category:categories(id, name, slug, icon, description), variants:product_variants(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!product) notFound();

  const { data: relatedProducts } = product.category_id
    ? await supabase
        .from('products')
        .select('id, name, slug, price, compare_at_price, thumbnail, stock_quantity')
        .eq('category_id', product.category_id)
        .eq('is_active', true)
        .neq('id', product.id)
        .limit(4)
    : { data: [] };

  return (
    <ProductDetails
      product={product}
      relatedProducts={relatedProducts ?? []}
    />
  );
}