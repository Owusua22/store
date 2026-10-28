'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Loader2, Pencil, Phone, Plus, Trash2, Truck, X } from 'lucide-react';

import {
  AdminButton,
  AdminCard,
  AdminPageHeader,
  Badge,
  DemoNotice,
  EmptyState,
  Field,
  Input,
  Textarea,
} from '@/components/admin/ui';
import { formatCedis } from '@/lib/utils';
import type { SupplierBalance } from '@/lib/data/accounting';

interface FormState {
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  payment_terms: string;
  notes: string;
  is_active: boolean;
}

const EMPTY: FormState = {
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  payment_terms: '',
  notes: '',
  is_active: true,
};

const PAYMENT_TERMS = ['Cash on delivery', 'Paid upfront', '50% deposit', '30 days credit', 'Consignment'];

export default function SuppliersClient({
  suppliers,
  demoMode,
}: {
  suppliers: SupplierBalance[];
  demoMode: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SupplierBalance | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setShowForm(true);
  };

  const openEdit = (supplier: SupplierBalance) => {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      contact_person: supplier.contact_person ?? '',
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      address: supplier.address ?? '',
      payment_terms: supplier.payment_terms ?? '',
      notes: supplier.notes ?? '',
      is_active: supplier.is_active,
    });
    setShowForm(true);
  };

  const submit = async () => {
    if (demoMode) {
      toast.info('Demo mode — connect Supabase to manage real suppliers.');
      return;
    }
    if (form.name.trim().length < 2) {
      toast.error('Enter the supplier name');
      return;
    }

    setBusy(true);
    try {
      const response = await fetch('/api/admin/suppliers', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editing ? { id: editing.id } : {}),
          name: form.name.trim(),
          contact_person: form.contact_person.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          address: form.address.trim() || null,
          payment_terms: form.payment_terms.trim() || null,
          notes: form.notes.trim() || null,
          is_active: form.is_active,
        }),
      });
      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? 'Could not save the supplier');
      }
      toast.success(editing ? 'Supplier updated' : 'Supplier added');
      setForm(EMPTY);
      setEditing(null);
      setShowForm(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save the supplier');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this supplier? Past purchases stay in your books without a supplier name.')) {
      return;
    }
    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/suppliers?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? 'Could not delete the supplier');
      }
      toast.success('Supplier deleted');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete the supplier');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Suppliers"
        description="Who you buy from, what you owe them, and how they want to be paid."
        action={
          <AdminButton onClick={showForm ? () => setShowForm(false) : openCreate}>
            {showForm ? (
              <>
                <X className="h-4 w-4" /> Close
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Add supplier
              </>
            )}
          </AdminButton>
        }
      />

      {demoMode ? <DemoNotice>Sample suppliers until you connect Supabase.</DemoNotice> : null}

      {showForm ? (
        <AdminCard className="mb-6">
          <h2 className="mb-4 text-[15px] font-bold text-gray-900">
            {editing ? `Edit ${editing.name}` : 'New supplier'}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Supplier name">
              <Input
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
                placeholder="e.g. Nsawam Wholesale Cosmetics"
              />
            </Field>
            <Field label="Contact person">
              <Input
                value={form.contact_person}
                onChange={(event) => update('contact_person', event.target.value)}
                placeholder="Who you speak to"
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(event) => update('phone', event.target.value)}
                placeholder="024 000 0000"
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
                placeholder="optional"
              />
            </Field>
            <Field label="Address / where you meet">
              <Input
                value={form.address}
                onChange={(event) => update('address', event.target.value)}
                placeholder="Nsawam Market, shop 12"
              />
            </Field>
            <Field label="Payment terms">
              <Input
                list="supplier-payment-terms"
                value={form.payment_terms}
                onChange={(event) => update('payment_terms', event.target.value)}
                placeholder="Cash on delivery"
              />
              <datalist id="supplier-payment-terms">
                {PAYMENT_TERMS.map((term) => (
                  <option key={term} value={term} />
                ))}
              </datalist>
            </Field>
            <Field label="Notes" className="md:col-span-2">
              <Textarea
                value={form.notes}
                onChange={(event) => update('notes', event.target.value)}
                placeholder="Minimum order, delivery days, what they stock…"
              />
            </Field>
          </div>
          <label className="mt-4 flex items-center gap-3 text-[12.5px] text-gray-600">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => update('is_active', event.target.checked)}
              className="h-4 w-4 accent-red-600"
            />
            Still buying from this supplier
          </label>
          <div className="mt-5 flex justify-end gap-2">
            <AdminButton variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </AdminButton>
            <AdminButton onClick={submit} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
              {editing ? 'Save changes' : 'Add supplier'}
            </AdminButton>
          </div>
        </AdminCard>
      ) : null}

      {suppliers.length === 0 ? (
        <EmptyState
          title="No suppliers yet"
          hint="Add the people you buy Nivea, Vaseline, baby wipes and your glow-up range from."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {suppliers.map((supplier) => (
            <AdminCard key={supplier.id}>
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-[14px] font-bold text-gray-900">{supplier.name}</h3>
                  {supplier.contact_person ? (
                    <p className="text-[12px] text-gray-500">{supplier.contact_person}</p>
                  ) : null}
                </div>
                <Badge tone={supplier.is_active ? 'green' : 'gray'}>
                  {supplier.is_active ? 'Active' : 'Paused'}
                </Badge>
              </div>

              {supplier.phone ? (
                <a
                  href={`tel:${supplier.phone.replace(/\s+/g, '')}`}
                  className="mb-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-red-600 hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" /> {supplier.phone}
                </a>
              ) : null}

              {supplier.address ? (
                <p className="mb-2 text-[12px] text-gray-500">{supplier.address}</p>
              ) : null}

              {supplier.payment_terms ? (
                <p className="mb-3 text-[12px] text-gray-500">Terms: {supplier.payment_terms}</p>
              ) : null}

              {supplier.balance_owed > 0 ? (
                <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700">
                  <strong className="font-bold">{formatCedis(supplier.balance_owed)}</strong> still owed
                  {supplier.total_purchases > 0 ? (
                    <span className="block text-[11px] text-red-500">
                      {formatCedis(supplier.total_paid)} paid of{' '}
                      {formatCedis(supplier.total_purchases)}
                    </span>
                  ) : null}
                </div>
              ) : null}

              {supplier.notes ? (
                <p className="mb-3 line-clamp-3 text-[12px] text-gray-500">{supplier.notes}</p>
              ) : null}

              <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
                <AdminButton size="sm" variant="secondary" onClick={() => openEdit(supplier)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </AdminButton>
                <AdminButton
                  size="sm"
                  variant="danger"
                  onClick={() => remove(supplier.id)}
                  disabled={deleting === supplier.id || demoMode}
                >
                  {deleting === supplier.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Delete
                </AdminButton>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
