'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';

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

export interface SkinTypeWithCount {
  id: string;
  slug: string;
  label: string;
  emoji: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  product_count: number;
}

interface FormState {
  label: string;
  emoji: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

const EMPTY_FORM: FormState = {
  label: '',
  emoji: '✨',
  description: '',
  sort_order: 99,
  is_active: true,
};

export default function SkinTypesClient({
  skinTypes,
  demoMode,
  usingDefaults = false,
}: {
  skinTypes: SkinTypeWithCount[];
  demoMode: boolean;
  usingDefaults?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<SkinTypeWithCount | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, sort_order: skinTypes.length + 1 });
    setShowForm(true);
  };

  const openEdit = (skinType: SkinTypeWithCount) => {
    setEditing(skinType);
    setForm({
      label: skinType.label,
      emoji: skinType.emoji ?? '✨',
      description: skinType.description ?? '',
      sort_order: skinType.sort_order,
      is_active: skinType.is_active,
    });
    setShowForm(true);
  };

  const guard = () => {
    if (demoMode) {
      toast.info('Demo mode: connect Supabase to save skin types.');
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!guard()) return;
    if (form.label.trim().length < 2) {
      toast.error('Give the skin type a name');
      return;
    }

    setBusy(true);
    try {
      const response = await fetch('/api/admin/skin-types', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editing ? { id: editing.id } : {}),
          label: form.label,
          emoji: form.emoji || '✨',
          description: form.description || null,
          sort_order: Number(form.sort_order) || 99,
          is_active: form.is_active,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error ?? 'Save failed');

      toast.success(editing ? 'Skin type updated' : 'Skin type created');
      setShowForm(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (skinType: SkinTypeWithCount) => {
    if (!guard()) return;
    try {
      const response = await fetch('/api/admin/skin-types', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: skinType.id, is_active: !skinType.is_active }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error ?? 'Update failed');
      toast.success(skinType.is_active ? 'Hidden from storefront' : 'Visible on storefront');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    }
  };

  const remove = async (skinType: SkinTypeWithCount) => {
    if (!guard()) return;
    if (
      !confirm(
        `Delete "${skinType.label}"? It will be removed from ${skinType.product_count} product(s).`
      )
    ) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/skin-types?id=${skinType.id}`, {
        method: 'DELETE',
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error ?? 'Delete failed');
      toast.success('Skin type deleted');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Skin types"
        description="The vocabulary customers use to filter products. Add your own (eczema-prone, teen skin…) and tag products from the product form."
        action={
          <AdminButton onClick={openCreate}>
            <Plus className="h-4 w-4" /> New skin type
          </AdminButton>
        }
      />

      {demoMode ? <DemoNotice /> : null}

      {usingDefaults ? (
        <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-[12.5px] text-sky-900">
          <strong className="font-bold">Built-in defaults.</strong> Your{' '}
          <code>skin_types</code> table is empty, so these six values are shown from the app.
          They already match seeded products — add your own below, or run{' '}
          <code>supabase/seed.sql</code> to store them in the database.
        </div>
      ) : null}

      {showForm ? (
        <AdminCard className="mb-6 border-red-100 bg-red-50/30">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold text-gray-900">
              {editing ? `Edit “${editing.label}”` : 'New skin type'}
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
            <Field label="Name">
              <Input
                value={form.label}
                onChange={(event) => setForm({ ...form, label: event.target.value })}
                placeholder="Eczema-prone"
              />
            </Field>
            <Field label="Emoji" hint="Shown on the storefront filter chip.">
              <Input
                value={form.emoji}
                onChange={(event) => setForm({ ...form, emoji: event.target.value })}
                placeholder="🩹"
              />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea
                rows={2}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Skin that flares up with fragrance or harsh soaps."
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
              {editing ? 'Save changes' : 'Create skin type'}
            </AdminButton>
          </div>
        </AdminCard>
      ) : null}

      {skinTypes.length === 0 ? (
        <EmptyState title="No skin types yet" hint="Create one to power the storefront filter." />
      ) : (
        <AdminCard padded={false}>
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-3 font-bold">Skin type</th>
                <th className="px-5 py-3 font-bold">Slug</th>
                <th className="px-5 py-3 font-bold">Products</th>
                <th className="px-5 py-3 font-bold">Status</th>
                <th className="px-5 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {skinTypes.map((skinType) => (
                <tr key={skinType.id} className="hover:bg-gray-50/60">
                  <td className="px-5 py-3.5">
                    <div className="flex items-start gap-2.5">
                      <span className="text-lg leading-none">{skinType.emoji ?? '✨'}</span>
                      <div>
                        <p className="font-bold text-gray-900">{skinType.label}</p>
                        {skinType.description ? (
                          <p className="mt-0.5 max-w-md text-[11.5px] text-gray-500">
                            {skinType.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[11.5px] text-gray-500">
                    {skinType.slug}
                  </td>
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/admin/products?skin=${skinType.slug}`}
                      className="font-bold text-red-600 hover:underline"
                    >
                      {skinType.product_count} tagged
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    {skinType.is_active ? (
                      <Badge tone="green">Visible</Badge>
                    ) : (
                      <Badge tone="gray">Hidden</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1.5">
                      <AdminButton size="sm" variant="secondary" onClick={() => toggleActive(skinType)}>
                        {skinType.is_active ? 'Hide' : 'Show'}
                      </AdminButton>
                      <AdminButton size="sm" variant="secondary" onClick={() => openEdit(skinType)}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </AdminButton>
                      <AdminButton size="sm" variant="danger" onClick={() => remove(skinType)}>
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
