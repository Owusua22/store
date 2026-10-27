'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Loader2, Pencil, Plus, Tag, Trash2, X } from 'lucide-react';

import {
  AdminButton,
  AdminCard,
  AdminPageHeader,
  Badge,
  DemoNotice,
  EmptyState,
  Field,
  Input,
  Select,
  Textarea,
} from '@/components/admin/ui';

export interface BrandWithCount {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  country: string | null;
  sort_order: number;
  is_active: boolean;
  product_count: number;
}

interface FormState {
  name: string;
  country: string;
  website_url: string;
  logo_url: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

const EMPTY_FORM: FormState = {
  name: '',
  country: '',
  website_url: '',
  logo_url: '',
  description: '',
  sort_order: 99,
  is_active: true,
};

export default function BrandsClient({
  brands,
  demoMode,
  usingDefaults = false,
  schemaMissing = false,
}: {
  brands: BrandWithCount[];
  demoMode: boolean;
  usingDefaults?: boolean;
  schemaMissing?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<BrandWithCount | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, sort_order: brands.length + 1 });
    setShowForm(true);
  };

  const openEdit = (brand: BrandWithCount) => {
    setEditing(brand);
    setForm({
      name: brand.name,
      country: brand.country ?? '',
      website_url: brand.website_url ?? '',
      logo_url: brand.logo_url ?? '',
      description: brand.description ?? '',
      sort_order: brand.sort_order,
      is_active: brand.is_active,
    });
    setShowForm(true);
  };

  const guard = () => {
    if (demoMode) {
      toast.info('Demo mode: connect Supabase to save brands.');
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!guard()) return;
    if (form.name.trim().length < 2) {
      toast.error('Give the brand a name');
      return;
    }

    setBusy(true);
    try {
      const response = await fetch('/api/admin/brands', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editing ? { id: editing.id } : {}),
          name: form.name,
          description: form.description || null,
          logo_url: form.logo_url || null,
          website_url: form.website_url || null,
          country: form.country || null,
          sort_order: Number(form.sort_order) || 99,
          is_active: form.is_active,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error ?? 'Save failed');

      toast.success(editing ? 'Brand updated' : 'Brand created');
      setShowForm(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (brand: BrandWithCount) => {
    if (!guard()) return;
    try {
      const response = await fetch('/api/admin/brands', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: brand.id, is_active: !brand.is_active }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error ?? 'Update failed');
      toast.success(brand.is_active ? 'Hidden from storefront' : 'Visible on storefront');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    }
  };

  const remove = async (brand: BrandWithCount) => {
    if (!guard()) return;
    if (
      !confirm(
        `Delete "${brand.name}"? ${brand.product_count} product(s) will keep the brand name but lose the link.`
      )
    ) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/brands?id=${brand.id}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error ?? 'Delete failed');
      toast.success('Brand deleted');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Brands"
        description="The brands you stock — Nivea, Vaseline, Johnson's Baby, Dove… Customers filter by brand and every product can be tagged with one. You can also type a new brand straight into the product form."
        action={
          <AdminButton onClick={openCreate}>
            <Plus className="h-4 w-4" /> New brand
          </AdminButton>
        }
      />

      {demoMode ? <DemoNotice /> : null}

      {schemaMissing ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-900">
          <strong className="font-bold">The brands table is missing.</strong> Re-run{' '}
          <code>supabase/schema.sql</code> in the Supabase SQL editor (it adds{' '}
          <code>public.brands</code> and <code>products.brand_id</code> without touching your
          data), then reload this page. Copy the SQL from{' '}
          <Link href="/admin/setup" className="font-bold underline">
            /admin/setup
          </Link>
          .
        </div>
      ) : null}

      {usingDefaults ? (
        <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-[12.5px] text-sky-900">
          <strong className="font-bold">Built-in defaults.</strong> Your <code>brands</code> table is
          empty, so common brands (Nivea, Vaseline, Johnson&apos;s Baby…) are shown from the app. Add
          your own below, or run <code>supabase/seed.sql</code> to store them in the database.
        </div>
      ) : null}

      {showForm ? (
        <AdminCard className="mb-6 border-red-100 bg-red-50/30">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold text-gray-900">
              {editing ? `Edit “${editing.name}”` : 'New brand'}
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md p-1 text-gray-500 hover:bg-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Brand name">
              <Input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Nivea"
              />
            </Field>
            <Field label="Country of origin" hint="Optional — shown on the brand page.">
              <Input
                value={form.country}
                onChange={(event) => setForm({ ...form, country: event.target.value })}
                placeholder="Germany"
              />
            </Field>
            <Field label="Logo URL" hint="Paste an R2 or any https image URL.">
              <Input
                value={form.logo_url}
                onChange={(event) => setForm({ ...form, logo_url: event.target.value })}
                placeholder="https://…/nivea-logo.png"
              />
            </Field>
            <Field label="Website" hint="Optional link to the brand's site.">
              <Input
                value={form.website_url}
                onChange={(event) => setForm({ ...form, website_url: event.target.value })}
                placeholder="https://www.nivea.com"
              />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea
                rows={2}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="German skin and body care since 1911."
              />
            </Field>
            <Field label="Sort order">
              <Input
                type="number"
                value={form.sort_order}
                onChange={(event) =>
                  setForm({ ...form, sort_order: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Visibility">
              <Select
                value={form.is_active ? 'active' : 'hidden'}
                onChange={(event) =>
                  setForm({ ...form, is_active: event.target.value === 'active' })
                }
              >
                <option value="active">Visible on storefront</option>
                <option value="hidden">Hidden</option>
              </Select>
            </Field>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <AdminButton variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </AdminButton>
            <AdminButton onClick={submit} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editing ? 'Save changes' : 'Create brand'}
            </AdminButton>
          </div>
        </AdminCard>
      ) : null}

      {brands.length === 0 ? (
        <EmptyState
          title="No brands yet"
          hint="Add Nivea, Vaseline or your own house brand to start tagging products."
        />
      ) : (
        <AdminCard padded={false}>
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-3 font-bold">Brand</th>
                <th className="px-5 py-3 font-bold">Slug</th>
                <th className="px-5 py-3 font-bold">Products</th>
                <th className="px-5 py-3 font-bold">Status</th>
                <th className="px-5 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {brands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50/60">
                  <td className="px-5 py-3.5">
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-100 bg-white">
                        {brand.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={brand.logo_url}
                            alt=""
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Tag className="h-4 w-4 text-gray-400" />
                        )}
                      </span>
                      <div>
                        <p className="font-bold text-gray-900">{brand.name}</p>
                        <p className="mt-0.5 max-w-md text-[11.5px] text-gray-500">
                          {[brand.country, brand.description].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[11.5px] text-gray-500">
                    {brand.slug}
                  </td>
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/admin/products`}
                      className="font-bold text-red-600 hover:underline"
                    >
                      {brand.product_count} tagged
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    {brand.is_active ? <Badge tone="green">Visible</Badge> : <Badge tone="gray">Hidden</Badge>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1.5">
                      <AdminButton size="sm" variant="secondary" onClick={() => toggleActive(brand)}>
                        {brand.is_active ? 'Hide' : 'Show'}
                      </AdminButton>
                      <AdminButton size="sm" variant="secondary" onClick={() => openEdit(brand)}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </AdminButton>
                      <AdminButton size="sm" variant="danger" onClick={() => remove(brand)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </AdminButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminCard>
      )}
    </div>
  );
}
