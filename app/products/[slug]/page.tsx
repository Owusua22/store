// app/products/[slug]/page.tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ProductDetails } from '@/components/products/ProductDetails';
import { getProductBySlug, getRelatedProducts } from '@/lib/data/store';
import { ReviewFeed } from '@/components/reviews/ReviewFeed';
import { getProductReviews } from '@/lib/data/reviews';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema, productSchema } from '@/lib/seo/jsonld';

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

  const [relatedProducts, reviews] = await Promise.all([
    getRelatedProducts(product, 4),
    getProductReviews(product.id, 12),
  ]);

  return (
    <>
      <JsonLd
        id="product"
        data={[
          productSchema(product),
          breadcrumbSchema([
            { name: 'Home', href: '/' },
            { name: 'Shop', href: '/products' },
            ...(product.category
              ? [{ name: product.category.name, href: `/categories/${product.category.slug}` }]
              : []),
            { name: product.name, href: `/products/${product.slug}` },
          ]),
        ]}
      />
      <ProductDetails product={product} relatedProducts={relatedProducts} />

      <div className="border-t border-line">
        <ReviewFeed
          initialReviews={reviews}
          products={[{ id: product.id, name: product.name, slug: product.slug }]}
        />
      </div>
    </>
  );
}
