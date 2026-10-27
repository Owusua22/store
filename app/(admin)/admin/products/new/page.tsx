import { getCategories } from '@/lib/data/store';
import { getSkinTypes } from '@/lib/data/skin-types';
import { getBrands } from '@/lib/data/brands';
import { isDemoMode } from '@/lib/supabase/config';
import ProductForm from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const [categories, skinTypes, brands] = await Promise.all([
    getCategories(),
    getSkinTypes(),
    getBrands(),
  ]);

  return (
    <ProductForm
      mode="create"
      categories={categories.map((category) => ({ id: category.id, name: category.name }))}
      brands={brands.map((brand) => ({ id: brand.id, name: brand.name }))}
      skinTypes={skinTypes}
      demoMode={isDemoMode}
    />
  );
}
