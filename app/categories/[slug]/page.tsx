import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CategoryContent } from '@/components/categories/CategoriesContent';
import type { Metadata } from 'next';
import type { Product, Category } from '@/types';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: category } = await supabase
    .from('categories')
    .select('name, description, icon')
    .eq('slug', slug)
    .eq('is_active', true)
    .eq('archived', false)
    .single();

  if (!category) return { title: 'Category Not Found' };

  return {
    title: `${category.icon || ''} ${category.name} | Sally's Clothing & More`.trim(),
    description: category.description ?? `Browse our ${category.name} collection`,
    openGraph: {
      title: `${category.name} | Sally's Clothing & More`,
      description: category.description ?? `Browse our ${category.name} collection`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .eq('archived', false)
    .single();

  if (!category) notFound();

  const [
    { data: subcategories },
    { data: allCategories },
  ] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('parent_id', category.id)
      .eq('is_active', true)
      .eq('archived', false)
      .order('sort_order', { ascending: true }),
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .eq('archived', false)
      .order('sort_order', { ascending: true }),
  ]);

  const categoryIds = [category.id, ...(subcategories?.map((s) => s.id) ?? [])];

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .in('category_id', categoryIds)
    .eq('is_active', true)
    .eq('archived', false)
    .order('created_at', { ascending: false });

  return (
    <CategoryContent
      category={category as Category}
      subcategories={(subcategories ?? []) as Category[]}
      products={(products ?? []) as Product[]}
      allCategories={(allCategories ?? []) as Category[]}
    />
  );
}