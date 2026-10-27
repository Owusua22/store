import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CategoryContent } from '@/components/categories/CategoriesContent';
import {
  getCategories,
  getCategoryBySlug,
  getProducts,
} from '@/lib/data/store';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema, categorySchema, itemListSchema } from '@/lib/seo/jsonld';
import type { Category, Product } from '@/types';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) return { title: 'Category not found' };

  return {
    title: `${category.name} — shop in Ghana`,
    description:
      category.description ??
      `Shop authentic ${category.name.toLowerCase()} at Glow-Up. Fast delivery across Ghana.`,
    openGraph: {
      title: category.name,
      description: category.description ?? undefined,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) notFound();

  const [allCategories, products] = await Promise.all([
    getCategories(),
    getProducts({ categorySlug: slug }),
  ]);

  const subcategories = allCategories.filter(
    (candidate) => candidate.parent_id === category.id
  );

  return (
    <>
      <JsonLd
        id="category"
        data={[
          categorySchema(category as Category, products as Product[]),
          itemListSchema(products as Product[], {
            name: category.name,
            url: `/categories/${category.slug}`,
            description: category.description ?? undefined,
          }),
          breadcrumbSchema([
            { name: 'Home', href: '/' },
            { name: 'Shop', href: '/products' },
            { name: category.name, href: `/categories/${category.slug}` },
          ]),
        ]}
      />
      <CategoryContent
        category={category as Category}
        subcategories={subcategories}
        products={products as Product[]}
        allCategories={allCategories as Category[]}
      />
    </>
  );
}
