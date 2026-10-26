import { getCategories } from '@/lib/data/store';
import { getSkinTypes } from '@/lib/data/skin-types';
import { isDemoMode } from '@/lib/supabase/config';
import ProductForm from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const [categories, skinTypes] = await Promise.all([getCategories(), getSkinTypes()]);

  return (
    <ProductForm
      mode="create"
      categories={categories.map((category) => ({ id: category.id, name: category.name }))}
      skinTypes={skinTypes}
      demoMode={isDemoMode}
    />
  );
}
