// app/showrooms/[slug]/page.tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { ShowroomContent } from '@/components/showrooms/ShowroomContent';
import { getAllShowrooms, getShowroomBySlug } from '@/lib/data/store';
import { site } from '@/lib/site';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const showroom = await getShowroomBySlug(slug);

  if (!showroom) return { title: 'Showroom not found' };

  return {
    title: `${showroom.name} | ${site.nameFull}`,
    description:
      showroom.description ?? `Browse the ${showroom.name} collection at ${site.nameFull}.`,
  };
}

export default async function ShowroomPage({ params }: Props) {
  const { slug } = await params;

  const [showroom, allShowrooms] = await Promise.all([
    getShowroomBySlug(slug),
    getAllShowrooms(),
  ]);

  if (!showroom) notFound();

  return (
    <ShowroomContent
      showroom={{
        id: showroom.id,
        name: showroom.name,
        slug: showroom.slug,
        description: showroom.description,
        icon: showroom.icon,
        type: showroom.type,
        max_products: showroom.max_products,
      }}
      products={showroom.products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        compare_at_price: product.compare_at_price,
        thumbnail: product.thumbnail,
        stock_quantity: product.stock_quantity,
        is_active: product.is_active,
        sizes: product.sizes ?? [],
        colors: product.colors ?? [],
        description: product.description,
        category_id: product.category_id,
      }))}
      allShowrooms={allShowrooms}
    />
  );
}
