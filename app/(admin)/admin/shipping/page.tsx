'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Tag,
  Truck,
  Copy,
  Check,
  Save,
  X,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
// Define the DiscountType
type DiscountType = 'free_shipping' | 'fixed_amount' | 'percentage';


/* ----------------------------- Types ----------------------------- */

interface ShippingZone {
  id: string;
  name: string;
  country: string; // 'Ghana'
  region: string; // Ghana region (from fixed list)
  town: string; // manually entered town/city
  postal_code_prefix: string | null;
  shipping_fee: number;
  estimated_days_min: number;
  estimated_days_max: number;
  free_shipping_threshold: number | null;
  is_active: boolean;
  sort_order: number;
  updated_at?: string;
  created_at?: string;
}

interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'free_shipping' | 'fixed_amount' | 'percentage';
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  regions: string[]; // optional scope by Ghana region(s)
  updated_at?: string;
  created_at?: string;
}

type EditingZone = ShippingZone | null;
type EditingCode = DiscountCode | null;

/* ------------------------- Constants ---------------------------- */

// All 16 regions in Ghana (fixed dropdown source)
const GHANA_REGIONS = [
  'Ahafo',
  'Ashanti',
  'Bono',
  'Bono East',
  'Central',
  'Eastern',
  'Greater Accra',
  'North East',
  'Northern',
  'Oti',
  'Savannah',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Western North',
] as const;

/* ------------------------- Component ---------------------------- */

export default function ShippingPage() {
  /* ------------------------- State ------------------------------ */
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'zones' | 'codes'>('zones');
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [showCodeForm, setShowCodeForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const initialized = useRef(false);

  // Editing targets
  const [editingZone, setEditingZone] = useState<EditingZone>(null);
  const [editingCode, setEditingCode] = useState<EditingCode>(null);

  // Forms
  const [zoneForm, setZoneForm] = useState({
    name: '',
    region: '' as string, // selected Ghana region
    town: '', // manual input
    postal_code_prefix: '',
    shipping_fee: '',
    estimated_days_min: '1',
    estimated_days_max: '5',
    free_shipping_threshold: '',
    is_active: true,
    sort_order: '0',
  });

  const [codeForm, setCodeForm] = useState({
    code: '',
    description: '',
    discount_type: 'free_shipping' as 'free_shipping' | 'fixed_amount' | 'percentage',
    discount_value: '0',
    min_order_amount: '0',
    max_uses: '',
    starts_at: '', // datetime-local
    expires_at: '', // datetime-local
    is_active: true,
    regions: [] as string[], // optional scope by region
  });

  // Copy helper
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  /* ----------------------- Resetters --------------------------- */
  const resetZoneForm = () => {
    setZoneForm({
      name: '',
      region: '',
      town: '',
      postal_code_prefix: '',
      shipping_fee: '',
      estimated_days_min: '1',
      estimated_days_max: '5',
      free_shipping_threshold: '',
      is_active: true,
      sort_order: '0',
    });
    setEditingZone(null);
    setShowZoneForm(false);
  };

  const resetCodeForm = () => {
    setCodeForm({
      code: '',
      description: '',
      discount_type: 'free_shipping' as 'free_shipping' | 'fixed_amount' | 'percentage',
      discount_value: '0',
      min_order_amount: '0',
      max_uses: '',
      starts_at: '',
      expires_at: '',
      is_active: true,
      regions: [],
    });
    setEditingCode(null);
    setShowCodeForm(false);
  };

  /* ------------------------ Data Fetch ------------------------- */
  const fetchData = useCallback(async () => {
    try {
      const [zonesRes, codesRes] = await Promise.all([
        fetch('/api/admin/shipping/zones'),
        fetch('/api/admin/shipping/codes'),
      ]);

      const [zonesData, codesData] = await Promise.all([
        zonesRes.json(),
        codesRes.json(),
      ]);

      if (zonesData.success) {
        setZones(zonesData.data ?? []);
      } else {
        toast.error(zonesData.error || 'Failed to load shipping zones');
      }

      if (codesData.success) {
        setCodes(codesData.data ?? []);
      } else {
        toast.error(codesData.error || 'Failed to load discount codes');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load shipping data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    fetchData();
  }, [fetchData]);

  /* ---------------------- Zone Actions ------------------------- */
  const openEditZone = (zone: ShippingZone) => {
    setEditingZone(zone);
    setZoneForm({
      name: zone.name,
      region: zone.region || '',
      town: zone.town || '',
      postal_code_prefix: zone.postal_code_prefix || '',
      shipping_fee: String(zone.shipping_fee),
      estimated_days_min: String(zone.estimated_days_min),
      estimated_days_max: String(zone.estimated_days_max),
      free_shipping_threshold: zone.free_shipping_threshold
        ? String(zone.free_shipping_threshold)
        : '',
      is_active: zone.is_active,
      sort_order: String(zone.sort_order),
    });
    setShowZoneForm(true);
  };

  const handleSaveZone = async () => {
    // Client-side validation

    if (!zoneForm.region) {
      toast.error('Please select a region');
      return;
    }
    if (!zoneForm.town.trim()) {
      toast.error('Town is required');
      return;
    }

    const fee = Number(zoneForm.shipping_fee);
    if (Number.isNaN(fee) || fee < 0) {
      toast.error('Shipping fee must be 0 or more');
      return;
    }

    const minD = Number(zoneForm.estimated_days_min);
    const maxD = Number(zoneForm.estimated_days_max);
    if (Number.isNaN(minD) || Number.isNaN(maxD) || minD < 1 || maxD < 1 || maxD < minD) {
      toast.error('Delivery days must be valid (max >= min and >= 1)');
      return;
    }

    const freeThresh = zoneForm.free_shipping_threshold
      ? Number(zoneForm.free_shipping_threshold)
      : null;
    if (freeThresh !== null && (Number.isNaN(freeThresh) || freeThresh < 0)) {
      toast.error('Free shipping threshold must be 0 or more');
      return;
    }

    const sortOrder = Number(zoneForm.sort_order) || 0;

    setIsSaving(true);
    try {
      const payload = {
        name: zoneForm.name.trim(),
        country: 'Ghana', // enforced
        region: zoneForm.region,
        town: zoneForm.town.trim(),
        postal_code_prefix: zoneForm.postal_code_prefix || null,
        shipping_fee: fee,
        estimated_days_min: minD,
        estimated_days_max: maxD,
        free_shipping_threshold: freeThresh,
        is_active: zoneForm.is_active,
        sort_order: sortOrder,
      };

      const url = editingZone
        ? `/api/admin/shipping/zones/${editingZone.id}`
        : '/api/admin/shipping/zones';
      const method = editingZone ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingZone ? 'Zone updated!' : 'Zone added!');
        resetZoneForm();
        fetchData();
      } else {
        toast.error(data.error || 'Failed to save zone');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save zone');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteZone = async (id: string) => {
    if (!confirm('Delete this shipping zone? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/shipping/zones/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Zone deleted');
        setZones((prev) => prev.filter((z) => z.id !== id));
      } else {
        toast.error(data.error || 'Failed to delete zone');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete zone');
    }
  };

  /* ---------------------- Code Actions ------------------------- */
  const openEditCode = (code: DiscountCode) => {
    setEditingCode(code);
    setCodeForm({
      code: code.code,
      description: code.description || '',
      discount_type: code.discount_type,
      discount_value: String(code.discount_value),
      min_order_amount: String(code.min_order_amount),
      max_uses: code.max_uses ? String(code.max_uses) : '',
      starts_at: code.starts_at ? new Date(code.starts_at).toISOString().slice(0, 16) : '',
      expires_at: code.expires_at ? new Date(code.expires_at).toISOString().slice(0, 16) : '',
      is_active: code.is_active,
      regions: code.regions || [],
    });
    setShowCodeForm(true);
  };

  const toggleCodeRegion = (region: string) => {
    setCodeForm((f) => ({
      ...f,
      regions: f.regions.includes(region)
        ? f.regions.filter((r) => r !== region)
        : [...f.regions, region],
    }));
  };

  const handleSaveCode = async () => {
    // Client-side validation
    const codeTrim = codeForm.code.trim();
    if (!codeTrim) {
      toast.error('Code is required');
      return;
    }

    if (codeForm.discount_type !== 'free_shipping') {
      const val = Number(codeForm.discount_value);
      if (Number.isNaN(val) || val <= 0) {
        toast.error('Discount value must be greater than 0');
        return;
      }
      if (codeForm.discount_type === 'percentage' && val > 100) {
        toast.error('Percentage cannot be more than 100');
        return;
      }
    }

    const minOrder = Number(codeForm.min_order_amount) || 0;
    if (minOrder < 0) {
      toast.error('Minimum order amount cannot be negative');
      return;
    }

    const maxUsesVal = codeForm.max_uses ? Number(codeForm.max_uses) : null;
    if (maxUsesVal !== null && (Number.isNaN(maxUsesVal) || maxUsesVal <= 0)) {
      toast.error('Max uses must be a positive number');
      return;
    }

    // Date validation (optional but nice)
    const startsAtISO = codeForm.starts_at ? new Date(codeForm.starts_at).toISOString() : null;
    const expiresAtISO = codeForm.expires_at ? new Date(codeForm.expires_at).toISOString() : null;
    if (startsAtISO && expiresAtISO && new Date(expiresAtISO) <= new Date(startsAtISO)) {
      toast.error('Expiry date must be after start date');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        code: codeTrim.toUpperCase().replace(/\s/g, ''),
        description: codeForm.description || null,
        discount_type: codeForm.discount_type,
        discount_value:
          codeForm.discount_type === 'free_shipping' ? 0 : Number(codeForm.discount_value),
        min_order_amount: minOrder,
        max_uses: maxUsesVal,
        starts_at: startsAtISO,
        expires_at: expiresAtISO,
        is_active: codeForm.is_active,
        regions: codeForm.regions, // optional region scope
      };

      const url = editingCode
        ? `/api/admin/shipping/codes/${editingCode.id}`
        : '/api/admin/shipping/codes';
      const method = editingCode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingCode ? 'Code updated!' : 'Code created!');
        resetCodeForm();
        fetchData();
      } else {
        toast.error(data.error || 'Failed to save code');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save code');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleCode = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/shipping/codes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      const data = await res.json();
      if (data.success) {
        setCodes((prev) =>
          prev.map((c) => (c.id === id ? { ...c, is_active: !currentActive } : c))
        );
        toast.success(currentActive ? 'Code deactivated' : 'Code activated');
      } else {
        toast.error(data.error || 'Failed to update code');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update code');
    }
  };

  const handleDeleteCode = async (id: string) => {
    if (!confirm('Delete this discount code?')) return;
    try {
      const res = await fetch(`/api/admin/shipping/codes/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Code deleted');
        setCodes((prev) => prev.filter((c) => c.id !== id));
      } else {
        toast.error(data.error || 'Failed to delete code');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete code');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Code copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  /* ------------------------ UI ------------------------- */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shipping & Delivery</h1>
          <p className="text-gray-500 mt-1">
            Manage Ghana shipping zones (region + town) and discount codes
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['zones', 'codes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? 'text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={
              activeTab === tab
                ? { background: 'linear-gradient(135deg, #4F46E5, #7C3AED, #EC4899)' }
                : undefined
            }
          >
            {tab === 'zones' ? '🚚 Shipping Zones' : '🏷️ Discount Codes'}
          </button>
        ))}
      </div>

      {/* ZONES TAB */}
      {activeTab === 'zones' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                resetZoneForm();
                setShowZoneForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED, #EC4899)',
              }}
            >
              <Plus className="w-4 h-4" /> Add Zone
            </button>
          </div>

          {/* Zone Form */}
          {showZoneForm && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  {editingZone ? 'Edit Shipping Zone' : 'New Shipping Zone'}
                </h3>
                <button
                  onClick={resetZoneForm}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Zone Name *
                  </label>
                  <input
                    type="text"
                    value={zoneForm.name}
                    onChange={(e) => setZoneForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="e.g., Accra Metro"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    value="Ghana"
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>

                {/* Region (dropdown) */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Region *
                  </label>
                  <select
                    value={zoneForm.region}
                    onChange={(e) => setZoneForm((p) => ({ ...p, region: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Select a region</option>
                    {GHANA_REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Town (manual) */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Town *
                  </label>
                  <input
                    type="text"
                    value={zoneForm.town}
                    onChange={(e) => setZoneForm((p) => ({ ...p, town: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="e.g., Accra, Kumasi, Takoradi"
                  />
                </div>

                {/* Postal prefix */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Postal Prefix
                  </label>
                  <input
                    type="text"
                    value={zoneForm.postal_code_prefix}
                    onChange={(e) =>
                      setZoneForm((p) => ({ ...p, postal_code_prefix: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="GA, AS, WS"
                  />
                </div>

                {/* Fee */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Shipping Fee (GHS) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={zoneForm.shipping_fee}
                    onChange={(e) => setZoneForm((p) => ({ ...p, shipping_fee: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="15.00"
                  />
                </div>

                {/* Delivery days */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Min Days *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={zoneForm.estimated_days_min}
                    onChange={(e) =>
                      setZoneForm((p) => ({ ...p, estimated_days_min: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Max Days *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={zoneForm.estimated_days_max}
                    onChange={(e) =>
                      setZoneForm((p) => ({ ...p, estimated_days_max: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                {/* Free threshold */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Free Ship Threshold (GHS)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={zoneForm.free_shipping_threshold}
                    onChange={(e) =>
                      setZoneForm((p) => ({ ...p, free_shipping_threshold: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="500"
                  />
                </div>

                {/* Sort order */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={zoneForm.sort_order}
                    onChange={(e) => setZoneForm((p) => ({ ...p, sort_order: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                {/* Active */}
                <div className="flex items-end">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={zoneForm.is_active}
                      onChange={(e) =>
                        setZoneForm((p) => ({ ...p, is_active: e.target.checked }))
                      }
                    />
                    <span className="text-xs font-medium text-gray-600">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleSaveZone}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #4F46E5, #7C3AED, #EC4899)',
                  }}
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : editingZone ? 'Update Zone' : 'Add Zone'}
                </button>
                <button
                  onClick={resetZoneForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Zones Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Zone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Location (Region / Town)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Delivery
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Free Above
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {zones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-sm text-gray-900">{zone.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex flex-col">
                        <span>
                          <span className="font-medium">{zone.region}</span> / {zone.town}
                        </span>
                        <span className="text-xs text-gray-400">Ghana</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatPrice(zone.shipping_fee)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {zone.estimated_days_min}–{zone.estimated_days_max} days
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {zone.free_shipping_threshold
                        ? formatPrice(zone.free_shipping_threshold)
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          zone.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {zone.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <button
                        onClick={() => openEditZone(zone)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteZone(zone.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {zones.length === 0 && (
              <div className="text-center py-12">
                <Truck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500">No shipping zones yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CODES TAB */}
      {activeTab === 'codes' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                resetCodeForm();
                setShowCodeForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED, #EC4899)',
              }}
            >
              <Plus className="w-4 h-4" /> Create Code
            </button>
          </div>

          {/* Code Form */}
          {showCodeForm && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  {editingCode ? 'Edit Discount Code' : 'New Discount Code'}
                </h3>
                <button
                  onClick={resetCodeForm}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Code */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    value={codeForm.code}
                    onChange={(e) =>
                      setCodeForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono uppercase"
                    placeholder="FREESHIP"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={codeForm.description}
                    onChange={(e) =>
                      setCodeForm((p) => ({ ...p, description: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Free shipping promo"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Type
                  </label>
                <select
  value={codeForm.discount_type}
  onChange={(e) => 
    setCodeForm((p) => ({
      ...p,
      discount_type: e.target.value as DiscountType // Explicit type casting
    }))
  }
  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
>
  <option value="free_shipping">Free Shipping</option>
  <option value="fixed_amount">Fixed Amount Off</option>
  <option value="percentage">Percentage Off</option>
</select>
                </div>

                {/* Value */}
                {codeForm.discount_type !== 'free_shipping' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Value {codeForm.discount_type === 'percentage' ? '(%)' : '(GHS)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={codeForm.discount_value}
                      onChange={(e) =>
                        setCodeForm((p) => ({ ...p, discount_value: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                )}

                {/* Min order */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Min Order (GHS)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={codeForm.min_order_amount}
                    onChange={(e) =>
                      setCodeForm((p) => ({ ...p, min_order_amount: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="0"
                  />
                </div>

                {/* Max uses */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Max Uses
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={codeForm.max_uses}
                    onChange={(e) =>
                      setCodeForm((p) => ({ ...p, max_uses: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Unlimited"
                  />
                </div>

                {/* Dates */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Starts At
                  </label>
                  <input
                    type="datetime-local"
                    value={codeForm.starts_at}
                    onChange={(e) =>
                      setCodeForm((p) => ({ ...p, starts_at: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Expires At
                  </label>
                  <input
                    type="datetime-local"
                    value={codeForm.expires_at}
                    onChange={(e) =>
                      setCodeForm((p) => ({ ...p, expires_at: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                {/* Active */}
                <div className="flex items-end">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={codeForm.is_active}
                      onChange={(e) =>
                        setCodeForm((p) => ({ ...p, is_active: e.target.checked }))
                      }
                    />
                    <span className="text-xs font-medium text-gray-600">Active</span>
                  </label>
                </div>
              </div>

              {/* Region scope (optional) */}
              <div className="mt-6">
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Optional: Limit code to specific Ghana regions (leave empty for all regions)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {GHANA_REGIONS.map((r) => (
                    <label key={r} className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={codeForm.regions.includes(r)}
                        onChange={() => toggleCodeRegion(r)}
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleSaveCode}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #4F46E5, #7C3AED, #EC4899)',
                  }}
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : editingCode ? 'Update Code' : 'Create Code'}
                </button>
                <button
                  onClick={resetCodeForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Codes List */}
          <div className="grid gap-4">
            {codes.map((code) => (
              <div
                key={code.id}
                className={`bg-white rounded-2xl border border-gray-200 p-5 ${
                  !code.is_active ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(79,70,229,0.1), rgba(236,72,153,0.1))',
                      }}
                    >
                      <Tag className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 font-mono text-lg">
                          {code.code}
                        </p>
                        <button
                          onClick={() => copyCode(code.code)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Copy"
                        >
                          {copiedCode === code.code ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      {code.description && (
                        <p className="text-sm text-gray-500">{code.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleCode(code.id, code.is_active)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        code.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {code.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => openEditCode(code)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCode(code.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                  <span>
                    Type:{' '}
                    <strong className="text-gray-700 capitalize">
                      {code.discount_type.replace('_', ' ')}
                    </strong>
                  </span>
                  {code.discount_type !== 'free_shipping' && (
                    <span>
                      Value:{' '}
                      <strong className="text-gray-700">
                        {code.discount_type === 'percentage'
                          ? `${code.discount_value}%`
                          : formatPrice(code.discount_value)}
                      </strong>
                    </span>
                  )}
                  {code.min_order_amount > 0 && (
                    <span>
                      Min order:{' '}
                      <strong className="text-gray-700">
                        {formatPrice(code.min_order_amount)}
                      </strong>
                    </span>
                  )}
                  <span>
                    Uses:{' '}
                    <strong className="text-gray-700">
                      {code.used_count}
                      {code.max_uses ? ` / ${code.max_uses}` : ' (unlimited)'}
                    </strong>
                  </span>
                  {code.expires_at && (
                    <span>
                      Expires:{' '}
                      <strong className="text-gray-700">
                        {new Date(code.expires_at).toLocaleDateString()}
                      </strong>
                    </span>
                  )}
                  {code.regions && code.regions.length > 0 && (
                    <span>
                      Regions:{' '}
                      <strong className="text-gray-700">
                        {code.regions.join(', ')}
                      </strong>
                    </span>
                  )}
                </div>
              </div>
            ))}

            {codes.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <Tag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500">No discount codes yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}