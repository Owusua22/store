// components/admin/ProductForm.tsx
// Single skincare-aware form used by /admin/products/new and /admin/products/[id]/edit.
'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import { ImagePlus, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import {
  AdminButton,
  AdminCard,
  Field,
  Input,
  Select,
  Textarea,
} from '@/components/admin/ui';
import { formatCedis } from '@/lib/utils';
import type { SkinTypeRow } from '@/lib/data/skin-types';

export interface ProductFormValues {
  name: string;
  brand: string;
  category_id: string;
  short_description: string;
  description: string;
  price: number | string;
  compare_at_price: number | string | null;
  /** What the shop pays the supplier. Admin only — never rendered on the storefront. */
  cost_price: number | string | null;
  /** Shown on the product page as "Who it is for". */
  who_for: string;
  sku: string;
  stock_quantity: number | string;
  low_stock_threshold: number | string;
  weight_grams: number | string | null;
  skin_types: string[];
  concerns: string[];
  sizes: string[];
  ingredients: string;
  how_to_use: string;
  benefits: string;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  seo_title: string;
  seo_description: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface BrandOption {
  id: string;
  name: string;
}

export const emptyProductValues: ProductFormValues = {
  name: '',
  brand: 'Glow-Up',
  category_id: '',
  short_description: '',
  description: '',
  price: '',
  compare_at_price: '',
  cost_price: '',
  who_for: '',
  sku: '',
  stock_quantity: 0,
  low_stock_threshold: 10,
  weight_grams: '',
  skin_types: [],
  concerns: [],
  sizes: [],
  ingredients: '',
  how_to_use: '',
  benefits: '',
  images: [],
  is_active: true,
  is_featured: false,
  seo_title: '',
  seo_description: '',
};

const CONCERNS = [
  { value: 'dryness', label: 'Dryness' },
  { value: 'acne', label: 'Acne & breakouts' },
  { value: 'dark-spots', label: 'Dark spots' },
  { value: 'dullness', label: 'Dullness' },
  { value: 'uneven-tone', label: 'Uneven tone' },
  { value: 'sensitivity', label: 'Sensitivity' },
  { value: 'ageing', label: 'Fine lines & ageing' },
  { value: 'sun-protection', label: 'Sun protection' },
];

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function ProductForm({
  mode,
  productId,
  initialValues,
  categories,
  brands = [],
  skinTypes,
  demoMode,
}: {
  mode: 'create' | 'edit';
  productId?: string;
  initialValues?: Partial<ProductFormValues>;
  categories: CategoryOption[];
  brands?: BrandOption[];
  skinTypes: SkinTypeRow[];
  demoMode: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sizeDraft, setSizeDraft] = useState('');

  const { register, handleSubmit, control, watch, setValue, formState } =
    useForm<ProductFormValues>({
      defaultValues: { ...emptyProductValues, ...initialValues },
    });

  const images = watch('images');
  const price = toNumber(watch('price'));
  const compareAt = toNumber(watch('compare_at_price'));
  const cost = toNumber(watch('cost_price')) ?? 0;
  const sellingPrice = price ?? 0;
  const margin = sellingPrice > 0 ? ((sellingPrice - cost) / sellingPrice) * 100 : 0;
  const stock = toNumber(watch('stock_quantity')) ?? 0;

  const discount = useMemo(() => {
    if (!price || !compareAt || compareAt <= price) return null;
    return Math.round(((compareAt - price) / compareAt) * 100);
  }, [price, compareAt]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        const body = new FormData();
        body.append('file', file);
        const response = await fetch('/api/upload', { method: 'POST', body });
        const payload = await response.json();
        if (!payload.success) throw new Error(payload.error ?? 'Upload failed');
        const url = payload.data?.url ?? payload.url;
        setValue('images', [...(images ?? []), url], { shouldDirty: true });
      }
      toast.success('Image uploaded to Cloudflare R2');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onSubmit = async (values: ProductFormValues) => {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        brand: values.brand || null,
        category_id: values.category_id || null,
        short_description: values.short_description || null,
        description: values.description || null,
        price: toNumber(values.price) ?? 0,
        compare_at_price: toNumber(values.compare_at_price),
        cost_price: toNumber(values.cost_price) ?? 0,
        who_for: values.who_for || null,
        sku: values.sku || null,
        stock_quantity: toNumber(values.stock_quantity) ?? 0,
        low_stock_threshold: toNumber(values.low_stock_threshold) ?? 10,
        weight_grams: toNumber(values.weight_grams),
        skin_types: values.skin_types,
        concerns: values.concerns,
        sizes: values.sizes,
        ingredients: values.ingredients || null,
        how_to_use: values.how_to_use || null,
        benefits: values.benefits || null,
        images: values.images,
        thumbnail: values.images[0] ?? null,
        is_active: values.is_active,
        is_featured: values.is_featured,
        seo_title: values.seo_title || null,
        seo_description: values.seo_description || null,
      };

      const endpoint =
        mode === 'create' ? '/api/admin/products' : `/api/admin/products/${productId}`;

      const response = await fetch(endpoint, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? 'Could not save the product');
      }

      toast.success(mode === 'create' ? 'Product created' : 'Product updated');
      router.push('/admin/products');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save the product');
    } finally {
      setSaving(false);
    }
  };

  const saveAsDemo = () => {
    toast.info(
      'Demo mode: connect Supabase (.env.local) to save products to the live catalogue.'
    );
  };

  return (
    <form onSubmit={handleSubmit(demoMode ? saveAsDemo : onSubmit)} className="pb-16">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-black tracking-tight text-gray-900">
            {mode === 'create' ? 'Add product' : 'Edit product'}
          </h1>
          <p className="mt-1 text-[13px] text-gray-500">
            Skin care attributes, pricing, stock and gallery — all in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AdminButton variant="secondary" onClick={() => router.push('/admin/products')}>
            Cancel
          </AdminButton>
          <AdminButton type="submit" disabled={saving || formState.isSubmitting}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {mode === 'create' ? 'Create product' : 'Save changes'}
          </AdminButton>
        </div>
      </div>

      {demoMode ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-800">
          <strong>Demo mode.</strong> Add your Supabase keys to <code>.env.local</code> to save
          changes to the live database.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <AdminCard>
            <h2 className="mb-4 text-[15px] font-extrabold text-gray-900">Basics</h2>
            <div className="grid gap-4">
              <Field label="Product name">
                <Input
                  {...register('name', { required: true })}
                  placeholder="Shea Butter Body Lotion 400ml"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Brand"
                  hint="Pick a stockist brand or type a new one — it is added to /admin/brands automatically."
                >
                  <Input
                    {...register('brand')}
                    list="product-brand-options"
                    placeholder="Nivea, Vaseline, Johnson's Baby…"
                    autoComplete="off"
                  />
                  <datalist id="product-brand-options">
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.name} />
                    ))}
                  </datalist>
                </Field>
                <Field label="Category">
                  <Select {...register('category_id')}>
                    <option value="">Uncategorised</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field label="Short tagline" hint="Shown on product cards (max ~90 characters).">
                <Input {...register('short_description')} placeholder="24-hour moisture for dry skin" />
              </Field>

              <Field
                label="Who it is for"
                hint="Shown on the product page, e.g. “Oily & blemish-prone skin” or “Newborns 0+ months”."
              >
                <Input
                  {...register('who_for')}
                  placeholder="Dry & very dry skin · pregnant mums · babies 0–12 months"
                />
              </Field>

              <Field label="Full description">
                <Textarea
                  {...register('description')}
                  rows={6}
                  placeholder="What it does, who it is for, texture and results…"
                />
              </Field>
            </div>
          </AdminCard>

          <AdminCard>
            <h2 className="mb-1 text-[15px] font-extrabold text-gray-900">Skin type & concerns</h2>
            <p className="mb-4 text-[12px] text-gray-500">
              Used by the storefront <em>skin type</em> filter. Leave empty if the product suits
              every skin type.
            </p>

            <Controller
              control={control}
              name="skin_types"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {skinTypes.map((type) => {
                    const active = field.value.includes(type.slug);
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() =>
                          field.onChange(
                            active
                              ? field.value.filter((value) => value !== type.slug)
                              : [...field.value, type.slug]
                          )
                        }
                        className={`rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                          active
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span className="mr-1">{type.emoji}</span>
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              )}
            />

            <div className="mt-6">
              <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.08em] text-gray-500">
                Concerns targeted
              </p>
              <Controller
                control={control}
                name="concerns"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {CONCERNS.map((concern) => {
                      const active = field.value.includes(concern.value);
                      return (
                        <button
                          key={concern.value}
                          type="button"
                          onClick={() =>
                            field.onChange(
                              active
                                ? field.value.filter((value) => value !== concern.value)
                                : [...field.value, concern.value]
                            )
                          }
                          className={`rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                            active
                              ? 'border-gray-900 bg-gray-900 text-white'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {concern.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
            </div>
          </AdminCard>

          <AdminCard>
            <h2 className="mb-4 text-[15px] font-extrabold text-gray-900">
              Ingredients & how to use
            </h2>
            <div className="grid gap-4">
              <Field label="Key ingredients">
                <Textarea
                  {...register('ingredients')}
                  rows={3}
                  placeholder="Shea butter, cocoa butter, vitamin E, glycerin"
                />
              </Field>
              <Field label="How to use">
                <Textarea
                  {...register('how_to_use')}
                  rows={3}
                  placeholder="Smooth over damp skin after bathing, morning and night."
                />
              </Field>
              <Field label="Benefits">
                <Textarea
                  {...register('benefits')}
                  rows={2}
                  placeholder="Deep hydration, softer skin, less ashiness"
                />
              </Field>
            </div>
          </AdminCard>

          <AdminCard>
            <h2 className="mb-4 text-[15px] font-extrabold text-gray-900">Gallery</h2>

            <div className="flex flex-wrap gap-3">
              {images.map((url) => (
                <div
                  key={url}
                  className="group relative h-24 w-24 overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                >
                  <Image src={url} alt="Product" fill sizes="96px" className="object-cover" />
                  <button
                    type="button"
                    onClick={() =>
                      setValue(
                        'images',
                        images.filter((image) => image !== url),
                        { shouldDirty: true }
                      )
                    }
                    className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {images[0] === url ? (
                    <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                      Main
                    </span>
                  ) : null}
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 transition-colors hover:border-red-300 hover:text-red-500 disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-[10.5px] font-bold">Upload</span>
                  </>
                )}
              </button>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => handleUpload(event.target.files)}
            />

            <p className="mt-3 text-[11.5px] text-gray-400">
              Images upload to your Cloudflare R2 bucket through <code>/api/upload</code>. The
              first image becomes the thumbnail.
            </p>
          </AdminCard>

          <AdminCard>
            <h2 className="mb-4 text-[15px] font-extrabold text-gray-900">SEO</h2>
            <div className="grid gap-4">
              <Field label="SEO title">
                <Input {...register('seo_title')} placeholder="Shea Butter Body Lotion | Glow-Up" />
              </Field>
              <Field label="SEO description">
                <Textarea {...register('seo_description')} rows={2} />
              </Field>
            </div>
          </AdminCard>
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">
          <AdminCard>
            <h2 className="mb-4 text-[15px] font-extrabold text-gray-900">Pricing</h2>
            <div className="grid gap-4">
              <Field label="Price (GH₵)">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('price', { required: true })}
                />
              </Field>
              <Field label="Compare-at price (GH₵)" hint="Shows a strike-through and % off tag.">
                <Input type="number" step="0.01" min="0" {...register('compare_at_price')} />
              </Field>
              <Field
                label="Cost price (GH₵)"
                hint="What you paid your supplier. Never shown to customers — used for profit."
              >
                <Input type="number" step="0.01" min="0" {...register('cost_price')} />
              </Field>
              <div className="rounded-lg bg-gray-50 px-3 py-2.5 text-[12px] text-gray-600">
                Selling at <strong className="text-gray-900">{formatCedis(price ?? 0)}</strong>
                {discount ? (
                  <span className="ml-1 font-bold text-red-600">· {discount}% off</span>
                ) : null}
                {cost > 0 && sellingPrice > 0 ? (
                  <span className="mt-1 block text-[11.5px] text-gray-500">
                    Profit per unit{' '}
                    <strong className={sellingPrice - cost > 0 ? 'text-emerald-600' : 'text-red-600'}>
                      {formatCedis(sellingPrice - cost)}
                    </strong>{' '}
                    · margin{' '}
                    <strong className={margin >= 25 ? 'text-emerald-600' : 'text-amber-600'}>
                      {margin.toFixed(0)}%
                    </strong>
                  </span>
                ) : null}
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <h2 className="mb-4 text-[15px] font-extrabold text-gray-900">Inventory</h2>
            <div className="grid gap-4">
              <Field label="Stock quantity">
                <Input type="number" min="0" {...register('stock_quantity')} />
              </Field>
              <Field label="Low stock alert at">
                <Input type="number" min="0" {...register('low_stock_threshold')} />
              </Field>
              <Field label="SKU">
                <Input {...register('sku')} placeholder="SAL-BODY-400" />
              </Field>
              <Field label="Weight (grams)">
                <Input type="number" min="0" {...register('weight_grams')} />
              </Field>
              <div className="text-[12px] text-gray-500">
                {stock <= 0 ? (
                  <span className="font-bold text-red-600">Out of stock</span>
                ) : stock <= (toNumber(watch('low_stock_threshold')) ?? 10) ? (
                  <span className="font-bold text-amber-600">Low stock · {stock} left</span>
                ) : (
                  <span className="font-bold text-emerald-600">{stock} in stock</span>
                )}
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <h2 className="mb-4 text-[15px] font-extrabold text-gray-900">Sizes / volumes</h2>
            <Controller
              control={control}
              name="sizes"
              render={({ field }) => (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {field.value.map((size) => (
                      <span
                        key={size}
                        className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11.5px] font-semibold text-gray-700"
                      >
                        {size}
                        <button
                          type="button"
                          onClick={() => field.onChange(field.value.filter((item) => item !== size))}
                          aria-label={`Remove ${size}`}
                        >
                          <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
                        </button>
                      </span>
                    ))}
                    {field.value.length === 0 ? (
                      <p className="text-[12px] text-gray-400">No sizes yet.</p>
                    ) : null}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Input
                      value={sizeDraft}
                      onChange={(event) => setSizeDraft(event.target.value)}
                      placeholder="400ml"
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          const value = sizeDraft.trim();
                          if (value && !field.value.includes(value)) {
                            field.onChange([...field.value, value]);
                            setSizeDraft('');
                          }
                        }
                      }}
                    />
                    <AdminButton
                      variant="secondary"
                      onClick={() => {
                        const value = sizeDraft.trim();
                        if (value && !field.value.includes(value)) {
                          field.onChange([...field.value, value]);
                          setSizeDraft('');
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </AdminButton>
                  </div>
                </>
              )}
            />
          </AdminCard>

          <AdminCard>
            <h2 className="mb-4 text-[15px] font-extrabold text-gray-900">Visibility</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-2.5 text-[13px] font-semibold text-gray-700">
                <input type="checkbox" {...register('is_active')} className="h-4 w-4 accent-red-600" />
                Visible in the store
              </label>
              <label className="flex items-center gap-2.5 text-[13px] font-semibold text-gray-700">
                <input
                  type="checkbox"
                  {...register('is_featured')}
                  className="h-4 w-4 accent-red-600"
                />
                Feature on the homepage
              </label>
            </div>
          </AdminCard>
        </div>
      </div>
    </form>
  );
}
