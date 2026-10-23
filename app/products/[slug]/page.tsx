// app/products/[slug]/page.tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ProductDetails } from '@/components/products/ProductDetails';
import { getProductBySlug, getRelatedProducts } from '@/lib/data/store';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: 'Product not found' };

  return {
    title: product.name,
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
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const relatedProducts = await getRelatedProducts(product, 4);

  return <ProductDetails product={product} relatedProducts={relatedProducts} />;
}
