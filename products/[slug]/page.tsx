import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ProductDetails } from '@/components/products/ProductDetails';
import type { Metadata } from 'next';
import type { Product, ProductVariant } from '@/types/database';

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

  if (!product) {
    return { title: 'Product Not Found' };
  }

  return {
    title: `${product.name} | Sally's Clothing & More`,
    description: product.description ?? undefined,
    openGraph: {
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  // ✅ Fetch main product by slug
  const { data: product, error: productError } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(
        id,
        name,
        slug,
        icon,
        description
      )
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (productError || !product) {
    notFound();
  }

  // ✅ Fetch variants separately to ensure they always come through correctly
  const { data: variants } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', product.id)
    .eq('is_active', true)
    .order('size', { ascending: true })
    .order('color', { ascending: true });

  // ✅ Merge product + variants
  const productWithVariants: Product = {
    ...(product as Product),
    variants: (variants ?? []) as ProductVariant[],
  };

  // ✅ Fetch related products
  const { data: relatedProducts } = product.category_id
    ? await supabase
        .from('products')
        .select(`
          id,
          name,
          slug,
          price,
          compare_at_price,
          thumbnail,
          stock_quantity
        `)
        .eq('category_id', product.category_id)
        .eq('is_active', true)
        .neq('id', product.id)
        .limit(4)
    : { data: [] };

  return (
    <ProductDetails
      product={productWithVariants}
      relatedProducts={relatedProducts ?? []}
    />
  );
}