'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Tag,
  Truck,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { cn, formatCedis } from '@/lib/utils';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { clearDemoLines } from '@/lib/demo/cart';

type PaymentMethod = 'cod' | 'card' | 'mpesa';
type DeliveryMethod = 'delivery' | 'pickup';
type LocationStep = 'region' | 'town' | 'address';

interface ShippingAddress {
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  region: string;
  town: string;
}

interface ShippingZone {
  id: string;
  country: string;
  region: string;
  town: string;
  shipping_fee: number;
  estimated_days_min: number;
  estimated_days_max: number;
  free_shipping_threshold: number | null;
  is_active: boolean;
  sort_order: number;
}

interface DiscountCode {
  code_id: string;
  code: string;
  discount_type: 'free_shipping' | 'fixed_amount' | 'percentage';
  discount_value: number;
  description: string | null;
  regions?: string[];
}

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type FieldErrors = Partial<Record<keyof ShippingAddress | 'location', string>>;

const SHIPPING_ZONE_ENDPOINTS = ['/api/shipping/zones', '/api/admin/shipping/zones'];

function isValidEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

function getUniqueSorted(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
}

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
        {icon}
      </div>

      <div>
        <h2 className="text-base font-bold text-gray-950">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
        )}
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
}

export default function CheckoutPage() {
  const router = useRouter();

  const {
    items,
    totalItems,
    totalPrice,
    checkoutIssues,
    isSyncing,
    fetchCart,
    setCart,
    toggleCart,
  } = useCart();

  const {
    isAuthenticated,
    profile,
    isLoading: authLoading,
  } = useAuth();

  const initialized = useRef(false);
  const contactRef = useRef<HTMLDivElement>(null);
  const deliveryRef = useRef<HTMLDivElement>(null);
  const termsRef = useRef<HTMLDivElement>(null);

  const [bootstrapped, setBootstrapped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>('delivery');

  const [notes, setNotes] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [shipping, setShipping] = useState<ShippingAddress>({
    full_name: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    region: '',
    town: '',
  });

  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);

  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] =
    useState<DiscountCode | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<LocationStep>('region');
  const [tempRegion, setTempRegion] = useState('');
  const [tempTown, setTempTown] = useState('');
  const [tempAddressLine1, setTempAddressLine1] = useState('');
  const [tempAddressLine2, setTempAddressLine2] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const effectiveShipping = useMemo<ShippingAddress>(
    () => ({
      ...shipping,
      full_name: shipping.full_name || profile?.full_name || '',
      email: shipping.email || profile?.email || '',
      phone: shipping.phone || profile?.phone || '',
    }),
    [profile?.email, profile?.full_name, profile?.phone, shipping]
  );

  const hasCheckoutIssues = checkoutIssues.length > 0;
  const placeOrderDisabled =
    isSubmitting || isSyncing || items.length === 0 || hasCheckoutIssues;

  const loadShippingZones = useCallback(async () => {
    setZonesLoading(true);

    let lastError = 'Failed to load shipping zones';

    try {
      for (const endpoint of SHIPPING_ZONE_ENDPOINTS) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            cache: 'no-store',
          });

          if (!response.ok) {
            lastError = `Failed to load zones from ${endpoint}`;
            continue;
          }

          const json = (await response.json()) as ApiResponse<ShippingZone[]>;

          if (!json.success) {
            lastError = json.error || lastError;
            continue;
          }

          const activeZones = (json.data ?? [])
            .filter((zone) => zone.is_active !== false)
            .sort((a, b) => {
              if (a.sort_order !== b.sort_order) {
                return a.sort_order - b.sort_order;
              }

              return `${a.region}${a.town}`.localeCompare(
                `${b.region}${b.town}`
              );
            });

          setShippingZones(activeZones);
          return;
        } catch {
          continue;
        }
      }

      toast.error(lastError);
    } finally {
      setZonesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated && isSupabaseConfigured) {
      toast.error('Please sign in to continue checkout.');
      router.replace('/');
      return;
    }

    if (initialized.current) return;
    initialized.current = true;

    void (async () => {
      await Promise.allSettled([fetchCart(), loadShippingZones()]);
      setBootstrapped(true);
    })();
  }, [
    authLoading,
    isAuthenticated,
    router,
    fetchCart,
    loadShippingZones,
  ]);

  const availableRegions = useMemo(() => {
    return getUniqueSorted(shippingZones.map((zone) => zone.region));
  }, [shippingZones]);

  const townsForRegion = useMemo(() => {
    if (!tempRegion) return [];

    return getUniqueSorted(
      shippingZones
        .filter(
          (zone) => zone.region.toLowerCase() === tempRegion.toLowerCase()
        )
        .map((zone) => zone.town)
    );
  }, [tempRegion, shippingZones]);

  const filteredRegions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return availableRegions;

    return availableRegions.filter((region) =>
      region.toLowerCase().includes(query)
    );
  }, [availableRegions, searchQuery]);

  const filteredTowns = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return townsForRegion;

    return townsForRegion.filter((town) =>
      town.toLowerCase().includes(query)
    );
  }, [townsForRegion, searchQuery]);

  const activeShippingZone = useMemo(() => {
    if (deliveryMethod === 'pickup') return null;

    const region = shipping.region.trim();
    const town = shipping.town.trim();

    if (!region || !town) return null;

    const exactZone = shippingZones.find(
      (zone) =>
        zone.region.toLowerCase() === region.toLowerCase() &&
        zone.town.toLowerCase() === town.toLowerCase()
    );

    if (exactZone) return exactZone;

    return (
      shippingZones.find(
        (zone) => zone.region.toLowerCase() === region.toLowerCase()
      ) ?? null
    );
  }, [deliveryMethod, shipping.region, shipping.town, shippingZones]);

  const activeDiscount = useMemo(() => {
    if (!appliedDiscount) return null;

    if (
      appliedDiscount.regions?.length &&
      deliveryMethod === 'delivery' &&
      shipping.region
    ) {
      const allowed = appliedDiscount.regions.some(
        (region) => region.toLowerCase() === shipping.region.toLowerCase()
      );

      if (!allowed) return null;
    }

    return appliedDiscount;
  }, [appliedDiscount, deliveryMethod, shipping.region]);

  const shippingCost = useMemo(() => {
    if (deliveryMethod === 'pickup') return 0;
    if (activeDiscount?.discount_type === 'free_shipping') return 0;
    if (!activeShippingZone) return 0;

    const threshold = activeShippingZone.free_shipping_threshold;

    if (threshold !== null && totalPrice >= threshold) return 0;

    return Number(activeShippingZone.shipping_fee || 0);
  }, [deliveryMethod, activeDiscount, activeShippingZone, totalPrice]);

  const discountAmount = useMemo(() => {
    if (!activeDiscount) return 0;

    if (activeDiscount.discount_type === 'free_shipping') return 0;

    if (activeDiscount.discount_type === 'fixed_amount') {
      return Math.min(totalPrice, Number(activeDiscount.discount_value || 0));
    }

    if (activeDiscount.discount_type === 'percentage') {
      const value = Number(activeDiscount.discount_value || 0);
      return Math.min(totalPrice, (totalPrice * value) / 100);
    }

    return 0;
  }, [activeDiscount, totalPrice]);

  const orderTotal = Math.max(0, totalPrice + shippingCost - discountAmount);

  const paymentCopy = useMemo(() => {
    if (paymentMethod === 'cod') {
      return {
        title: 'Cash on Delivery',
        subtitle: 'Pay when your order arrives.',
      };
    }

    if (paymentMethod === 'mpesa') {
      return {
        title: 'Mobile Money',
        subtitle: 'We will contact you with payment instructions.',
      };
    }

    return {
      title: 'Card Payment',
      subtitle: 'Card payment instructions will be provided after placing order.',
    };
  }, [paymentMethod]);

  const handleShippingChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setShipping((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  };

  const getZoneForPreview = useCallback(() => {
    if (!tempRegion || !tempTown) return null;

    const exactZone = shippingZones.find(
      (zone) =>
        zone.region.toLowerCase() === tempRegion.toLowerCase() &&
        zone.town.toLowerCase() === tempTown.toLowerCase()
    );

    if (exactZone) return exactZone;

    return (
      shippingZones.find(
        (zone) => zone.region.toLowerCase() === tempRegion.toLowerCase()
      ) ?? null
    );
  }, [shippingZones, tempRegion, tempTown]);

  const openLocationModal = useCallback(() => {
    setTempRegion(shipping.region);
    setTempTown(shipping.town);
    setTempAddressLine1(shipping.address_line1);
    setTempAddressLine2(shipping.address_line2);
    setSearchQuery('');

    if (!shipping.region) {
      setModalStep('region');
    } else if (!shipping.town) {
      setModalStep('town');
    } else {
      setModalStep('address');
    }

    setIsLocationModalOpen(true);
  }, [shipping]);

  const closeLocationModal = () => {
    setIsLocationModalOpen(false);
    setSearchQuery('');
  };

  const handleSelectRegion = (region: string) => {
    setTempRegion(region);
    setTempTown('');
    setSearchQuery('');
    setModalStep('town');
  };

  const handleSelectTown = (town: string) => {
    setTempTown(town);
    setSearchQuery('');
    setModalStep('address');
  };

  const handleConfirmLocation = () => {
    if (!tempRegion) {
      toast.error('Please select a delivery region.');
      setModalStep('region');
      return;
    }

    if (!tempTown) {
      toast.error('Please select a delivery town.');
      setModalStep('town');
      return;
    }

    if (!tempAddressLine1.trim()) {
      toast.error('Please enter your street address.');
      return;
    }

    setShipping((prev) => ({
      ...prev,
      region: tempRegion,
      town: tempTown,
      address_line1: tempAddressLine1.trim(),
      address_line2: tempAddressLine2.trim(),
    }));

    setFieldErrors((prev) => ({
      ...prev,
      location: undefined,
      region: undefined,
      town: undefined,
      address_line1: undefined,
    }));

    setIsLocationModalOpen(false);
    toast.success('Delivery location updated.');
  };

  const handleApplyCode = async () => {
    const code = discountCode.trim().toUpperCase();

    if (!code) return;

    setIsValidatingCode(true);

    try {
      const response = await fetch('/api/shipping/validate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          order_total: totalPrice,
          region:
            deliveryMethod === 'delivery' && shipping.region
              ? shipping.region
              : undefined,
        }),
      });

      const json = (await response.json()) as ApiResponse<DiscountCode>;

      if (!response.ok || !json.success || !json.data) {
        toast.error(json.error || 'Invalid discount code.');
        return;
      }

      const discount = json.data;

      if (discount.regions?.length && shipping.region) {
        const allowed = discount.regions.some(
          (region) => region.toLowerCase() === shipping.region.toLowerCase()
        );

        if (!allowed) {
          toast.error(`This code is not valid for ${shipping.region}.`);
          return;
        }
      }

      setAppliedDiscount(discount);
      setDiscountCode('');
      toast.success(`Code "${discount.code}" applied.`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to validate discount code.');
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleRemoveCode = () => {
    setAppliedDiscount(null);
    toast.success('Discount code removed.');
  };

  const validateCheckoutInputs = () => {
    const errors: FieldErrors = {};

    if (!effectiveShipping.full_name.trim()) {
      errors.full_name = 'Enter your full name.';
    }

    if (!effectiveShipping.email.trim()) {
      errors.email = 'Enter your email address.';
    } else if (!isValidEmail(effectiveShipping.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }

    if (!effectiveShipping.phone.trim()) {
      errors.phone = 'Enter your phone number.';
    }

    if (deliveryMethod === 'delivery') {
      if (!shipping.region || !shipping.town) {
        errors.location = 'Select your delivery region and town.';
      } else if (!shipping.address_line1.trim()) {
        errors.location = 'Enter your street address.';
      } else if (!activeShippingZone) {
        errors.location = 'No delivery option is available for this location.';
      }
    }

    setFieldErrors(errors);

    const firstError = Object.values(errors)[0];

    if (firstError) {
      toast.error(firstError);

      if (errors.location) {
        deliveryRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        openLocationModal();
      } else {
        contactRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }

      return false;
    }

    if (!termsAccepted) {
      setTermsError(true);
      termsRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      toast.error('Please accept the terms and conditions.');
      return false;
    }

    setTermsError(false);
    return true;
  };

  const handlePlaceOrder = async () => {
    if (isSubmitting) return;

    if (!validateCheckoutInputs()) return;

    await fetchCart();

    const latestCart = useCart.getState();

    if (latestCart.items.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    if (!latestCart.canCheckout) {
      toast.error(
        latestCart.checkoutIssues[0]?.reason ||
          'Remove unavailable items before checkout.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        shipping_address: {
          full_name: effectiveShipping.full_name.trim(),
          email: effectiveShipping.email.trim(),
          phone: effectiveShipping.phone.trim(),
          address_line1: shipping.address_line1.trim(),
          address_line2: shipping.address_line2.trim() || undefined,
          region:
            deliveryMethod === 'delivery' ? shipping.region.trim() : undefined,
          town: deliveryMethod === 'delivery' ? shipping.town.trim() : undefined,
        },
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
        shipping_zone_id:
          deliveryMethod === 'delivery' ? activeShippingZone?.id : undefined,
        shipping_amount: shippingCost,
        discount_code_id: activeDiscount?.code_id || undefined,
        delivery_method: deliveryMethod,
      };

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = (await response.json()) as ApiResponse<{
        order_number: string;
      }>;

      if (!response.ok || !json.success || !json.data) {
        toast.error(json.error || 'Failed to place order.');
        return;
      }

      setOrderNumber(json.data.order_number);
      setOrderSuccess(true);

      if (isSupabaseConfigured) {
        setCart(null);
      } else {
        // Demo mode keeps the cart in localStorage — empty it properly.
        clearDemoLines();
        setCart({ id: 'demo-cart', user_id: 'demo-user', items: [] });
      }
      toast.success('Order placed successfully.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to place order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || (isSupabaseConfigured && !bootstrapped && isAuthenticated)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-red-600" />
          <p className="mt-4 text-sm font-medium text-gray-500">
            Preparing your checkout...
          </p>
        </div>
      </div>
    );
  }

  if (isSupabaseConfigured && !isAuthenticated) return null;

  if (!bootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-white to-rose-50 px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-xl shadow-red-100/60 sm:p-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg">
            <CheckCircle className="h-10 w-10" />
          </div>

          <h1 className="mt-6 text-2xl font-black text-gray-950">
            Order placed successfully
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Thank you for shopping with us. We will contact you shortly with
            confirmation details.
          </p>

          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-red-500">
              Order number
            </p>
            <p className="mt-1 text-xl font-black text-red-950">
              {orderNumber}
            </p>
          </div>

          {activeShippingZone && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600">
              <Clock className="h-4 w-4 text-red-600" />
              Estimated delivery:{' '}
              {activeShippingZone.estimated_days_min}–
              {activeShippingZone.estimated_days_max} business days
            </div>
          )}

          <div className="mt-8 grid gap-3">
            <Link
              href="/orders"
              className="rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-100 transition hover:opacity-95"
            >
              View my orders
            </Link>

            <Link
              href="/products"
              className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !isSyncing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue shopping
            </Link>

            <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500">
              <Lock className="h-4 w-4" />
              Secure checkout
            </div>
          </div>
        </header>

        <main className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-gray-300 shadow-sm">
              <ShoppingBag className="h-10 w-10" />
            </div>

            <h1 className="mt-6 text-2xl font-black text-gray-950">
              Your cart is empty
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Add items to your cart before checking out.
            </p>

            <Link
              href="/products"
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-100"
            >
              Shop products
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-32 lg:pb-10">
        {/* Header */}
        <header className="border-b border-line bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue shopping
            </Link>

            <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
              <Lock className="h-3.5 w-3.5" />
              Secure checkout
            </div>
          </div>
        </header>

        <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:py-10">
          {/* Main form */}
          <div className="space-y-5">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-red-600">
                Checkout
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                Complete your order
              </h1>
              <p className="mt-2 max-w-xl text-sm text-gray-500">
                Confirm your contact details, choose delivery, then place your
                order securely.
              </p>
            </div>

            {/* Cart issues */}
            {hasCheckoutIssues && (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-4">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-red-900">
                      Your cart needs attention
                    </h2>
                    <p className="mt-1 text-sm text-red-700">
                      Remove unavailable or out-of-stock items before placing
                      your order.
                    </p>

                    <ul className="mt-3 space-y-1 text-sm text-red-700">
                      {checkoutIssues.map((issue) => (
                        <li key={issue.itemId}>
                          <span className="font-bold">{issue.productName}</span>
                          : {issue.reason}
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={toggleCart}
                      className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
                    >
                      Open cart to fix
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Contact */}
            <section
              ref={contactRef}
              className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <SectionTitle
                icon={<Smartphone className="h-5 w-5" />}
                title="Contact information"
                description="We will use this to contact you about your order."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Full name *
                  </label>
	                  <input
	                    name="full_name"
	                    value={effectiveShipping.full_name}
                    onChange={handleShippingChange}
                    placeholder="Enter your full name"
                    className={cn(
                      'w-full rounded-2xl border bg-gray-50 px-4 py-3 text-sm text-gray-950 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100',
                      fieldErrors.full_name
                        ? 'border-red-300'
                        : 'border-gray-200'
                    )}
                  />
                  <FieldError message={fieldErrors.full_name} />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Email *
                  </label>
	                  <input
	                    name="email"
	                    type="email"
	                    value={effectiveShipping.email}
                    onChange={handleShippingChange}
                    placeholder="you@example.com"
                    className={cn(
                      'w-full rounded-2xl border bg-gray-50 px-4 py-3 text-sm text-gray-950 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100',
                      fieldErrors.email ? 'border-red-300' : 'border-gray-200'
                    )}
                  />
                  <FieldError message={fieldErrors.email} />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Phone *
                  </label>
	                  <input
	                    name="phone"
	                    type="tel"
	                    value={effectiveShipping.phone}
                    onChange={handleShippingChange}
                    placeholder="+233 20 123 4567"
                    className={cn(
                      'w-full rounded-2xl border bg-gray-50 px-4 py-3 text-sm text-gray-950 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100',
                      fieldErrors.phone ? 'border-red-300' : 'border-gray-200'
                    )}
                  />
                  <FieldError message={fieldErrors.phone} />
                </div>
              </div>
            </section>

            {/* Delivery */}
            <section
              ref={deliveryRef}
              className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <SectionTitle
                icon={<Truck className="h-5 w-5" />}
                title="Delivery method"
                description="Choose how you want to receive your order."
              />

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    id: 'delivery' as const,
                    label: 'Delivery',
                    desc: 'Send to your address',
                    icon: Truck,
                  },
                  {
                    id: 'pickup' as const,
                    label: 'Pick up',
                    desc: 'Collect from store',
                    icon: MapPin,
                  },
                ].map(({ id, label, desc, icon: Icon }) => {
                  const selected = deliveryMethod === id;

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setDeliveryMethod(id);
                        setFieldErrors((prev) => ({
                          ...prev,
                          location: undefined,
                        }));
                      }}
                      className={cn(
                        'flex items-center gap-3 rounded-2xl border p-4 text-left transition',
                        selected
                          ? 'border-red-500 bg-red-50 ring-4 ring-red-100'
                          : 'border-gray-200 bg-white hover:border-red-100 hover:bg-gray-50'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                          selected
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-500'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="font-bold text-gray-950">{label}</p>
                        <p className="text-sm text-gray-500">{desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {deliveryMethod === 'delivery' && (
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={openLocationModal}
                    className={cn(
                      'flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition',
                      fieldErrors.location
                        ? 'border-red-300 bg-red-50'
                        : shipping.region && shipping.town
                          ? 'border-red-100 bg-red-50'
                          : 'border-dashed border-gray-300 bg-gray-50 hover:bg-white'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                        shipping.region && shipping.town
                          ? 'bg-red-600 text-white'
                          : 'bg-white text-gray-400'
                      )}
                    >
                      <MapPin className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      {shipping.region && shipping.town ? (
                        <>
                          <p className="truncate font-bold text-gray-950">
                            {shipping.town}, {shipping.region}
                          </p>
                          <p className="truncate text-sm text-gray-500">
                            {shipping.address_line1 || 'Address not added'}
                          </p>

                          {activeShippingZone && (
                            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-red-700">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {activeShippingZone.estimated_days_min}–
                                {activeShippingZone.estimated_days_max} days
                              </span>
                              <span>
                                {shippingCost === 0
                                  ? 'Free delivery'
                                  : formatCedis(shippingCost)}
                              </span>
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-gray-800">
                            Add delivery address
                          </p>
                          <p className="text-sm text-gray-500">
                            Select your region, town and street address.
                          </p>
                        </>
                      )}
                    </div>

                    <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
                  </button>

                  <FieldError message={fieldErrors.location} />
                </div>
              )}

              {deliveryMethod === 'pickup' && (
                <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-4">
                  <div className="flex gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
                    <div>
                      <p className="font-bold text-green-950">
                        Store pickup selected
                      </p>
                      <p className="mt-1 text-sm text-green-700">
                        Pickup details will be shared after your order is
                        confirmed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Payment */}
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <SectionTitle
                icon={<CreditCard className="h-5 w-5" />}
                title="Payment method"
                description="Choose your preferred payment option."
              />

              <div className="space-y-3">
                {[
                  {
                    id: 'cod' as PaymentMethod,
                    label: 'Cash on Delivery',
                    desc: 'Pay when you receive your order.',
                    icon: Banknote,
                    color: 'bg-green-600',
                  },
                  {
                    id: 'mpesa' as PaymentMethod,
                    label: 'Mobile Money',
                    desc: 'We will contact you with payment instructions.',
                    icon: Smartphone,
                    color: 'bg-emerald-600',
                  },
                  {
                    id: 'card' as PaymentMethod,
                    label: 'Credit / Debit Card',
                    desc: 'Card instructions will be shared after placing order.',
                    icon: CreditCard,
                    color: 'bg-red-600',
                  },
                ].map(({ id, label, desc, icon: Icon, color }) => {
                  const selected = paymentMethod === id;

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPaymentMethod(id)}
                      className={cn(
                        'flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition',
                        selected
                          ? 'border-red-500 bg-red-50 ring-4 ring-red-100'
                          : 'border-gray-200 bg-white hover:border-red-100 hover:bg-gray-50'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white',
                          color
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-950">{label}</p>
                        <p className="text-sm text-gray-500">{desc}</p>
                      </div>

                      <div
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                          selected ? 'border-red-600' : 'border-gray-300'
                        )}
                      >
                        {selected && (
                          <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                <p className="text-sm font-bold text-gray-950">
                  {paymentCopy.title}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {paymentCopy.subtitle}
                </p>
              </div>

              <div className="mt-5">
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Order notes optional
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Any delivery instructions or special requests..."
                  className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-950 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                />
              </div>
            </section>

            {/* Terms */}
            <section
              ref={termsRef}
              className={cn(
                'rounded-3xl border bg-white p-5 shadow-sm transition sm:p-6',
                termsError ? 'border-red-300' : 'border-gray-200'
              )}
            >
              <label className="flex cursor-pointer gap-3">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    if (e.target.checked) setTermsError(false);
                  }}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />

                <span className="text-sm leading-6 text-gray-600">
                  I have read and agree to the{' '}
                  <Link
                    href="/terms"
                    className="font-semibold text-red-600 underline underline-offset-2"
                  >
                    Terms and Conditions
                  </Link>
                  . I confirm that my contact and delivery details are correct.
                </span>
              </label>

              {termsError && (
                <p className="mt-2 text-sm font-medium text-red-600">
                  Please accept the terms before placing your order.
                </p>
              )}
            </section>
          </div>

          {/* Order summary */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-lg shadow-gray-200/60">
              <div className="border-b border-gray-100 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-gray-950">
                      Order summary
                    </h2>
                    <p className="text-sm text-gray-500">
                      {totalItems} {totalItems === 1 ? 'item' : 'items'} in
                      your cart
                    </p>
                  </div>

                  {isSyncing && (
                    <Loader2 className="h-5 w-5 animate-spin text-red-600" />
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto p-5">
                <div className="space-y-4">
                  {items.map((item) => {
                    const issue = checkoutIssues.find(
                      (cartIssue) => cartIssue.itemId === item.id
                    );

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'flex gap-3 rounded-2xl border p-3',
                          issue
                            ? 'border-red-200 bg-red-50'
                            : 'border-gray-100 bg-gray-50'
                        )}
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white">
                          {item.product.thumbnail ? (
                            <Image
                              src={item.product.thumbnail}
                              alt={item.product.name}
                              fill
                              sizes="64px"
                              className={cn(
                                'object-cover',
                                issue && 'opacity-60 grayscale'
                              )}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-300">
                              <Package className="h-6 w-6" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-gray-950">
                            {item.product.name}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                            <span>Qty: {item.quantity}</span>

                            {item.selected_size && (
                              <span className="rounded bg-white px-1.5 py-0.5">
                                {item.selected_size}
                              </span>
                            )}

                            {item.selected_color && (
                              <span className="rounded bg-white px-1.5 py-0.5">
                                {item.selected_color}
                              </span>
                            )}
                          </div>

                          {issue && (
                            <p className="mt-1 text-xs font-semibold text-red-600">
                              {issue.reason}
                            </p>
                          )}
                        </div>

                        <p className="shrink-0 text-sm font-bold text-gray-950">
                          {formatCedis(item.product.price * item.quantity)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-gray-100 p-5">
                {/* Discount */}
                <div className="mb-5">
	                  {activeDiscount ? (
	                    <div className="flex items-center justify-between rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
	                      <div>
	                        <p className="font-mono text-sm font-bold text-green-800">
	                          {activeDiscount.code}
	                        </p>
	                        <p className="text-xs font-medium text-green-700">
	                          {activeDiscount.discount_type === 'free_shipping'
	                            ? 'Free shipping applied'
	                            : activeDiscount.discount_type === 'percentage'
	                              ? `${activeDiscount.discount_value}% off`
	                              : `${formatCedis(
	                                  activeDiscount.discount_value
	                                )} off`}
	                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveCode}
                        className="rounded-lg p-1 text-green-700 hover:bg-green-100"
                        aria-label="Remove discount code"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={discountCode}
                        onChange={(e) =>
                          setDiscountCode(e.target.value.toUpperCase())
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            void handleApplyCode();
                          }
                        }}
                        placeholder="Discount code"
                        className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold uppercase outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                      />

                      <button
                        type="button"
                        onClick={() => void handleApplyCode()}
                        disabled={isValidatingCode || !discountCode.trim()}
                        className="rounded-2xl bg-gray-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isValidatingCode ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Apply'
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-bold text-gray-950">
                      {formatCedis(totalPrice)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-1.5 text-gray-500">
                      <Truck className="h-4 w-4" />
                      {deliveryMethod === 'pickup'
                        ? 'Pickup'
                        : activeShippingZone
                          ? activeShippingZone.town
                          : 'Shipping'}
                    </span>

                    <span
                      className={cn(
                        'font-bold',
                        shippingCost === 0 ? 'text-green-600' : 'text-gray-950'
                      )}
                    >
                      {deliveryMethod === 'pickup'
                        ? 'Free'
                        : !activeShippingZone
                          ? '—'
                          : shippingCost === 0
                            ? 'Free'
                            : formatCedis(shippingCost)}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-1.5 text-green-600">
                        <Tag className="h-4 w-4" />
                        Discount
                      </span>
                      <span className="font-bold text-green-600">
                        −{formatCedis(discountAmount)}
                      </span>
                    </div>
                  )}

                  {activeShippingZone && deliveryMethod === 'delivery' && (
                    <div className="rounded-2xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                      <Clock className="mr-1 inline h-3.5 w-3.5" />
                      Estimated delivery:{' '}
                      {activeShippingZone.estimated_days_min}–
                      {activeShippingZone.estimated_days_max} business days
                    </div>
                  )}

                  <div className="flex items-end justify-between border-t border-gray-100 pt-4">
                    <span className="font-black text-gray-950">Total</span>
                    <span className="text-2xl font-black text-gray-950">
                      {formatCedis(orderTotal)}
                    </span>
                  </div>
                </div>

                {/* Desktop place order */}
                <button
                  type="button"
                  onClick={() => void handlePlaceOrder()}
                  disabled={placeOrderDisabled}
                  className="mt-5 hidden w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 via-red-700 to-rose-600 px-5 py-4 text-base font-black text-white shadow-lg shadow-red-100 transition hover:opacity-95 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:bg-none disabled:text-gray-500 disabled:shadow-none lg:flex"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Placing order...
                    </>
                  ) : hasCheckoutIssues ? (
                    <>
                      <AlertTriangle className="h-5 w-5" />
                      Resolve cart issues
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5" />
                      Place Order — {formatCedis(orderTotal)}
                    </>
                  )}
                </button>

                <div className="mt-4 grid gap-2 border-t border-gray-100 pt-4 text-xs font-medium text-gray-500">
                  <p className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-red-600" />
                    Secure checkout
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <Truck className="h-4 w-4 text-red-600" />
                    Delivery updates after confirmation
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </main>
      </div>

      {/* Mobile sticky place order */}
      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 p-4 shadow-2xl backdrop-blur-xl lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500">Total</p>
              <p className="text-xl font-black text-gray-950">
                {formatCedis(orderTotal)}
              </p>
            </div>

            <div className="text-right text-xs font-medium text-gray-500">
              {deliveryMethod === 'pickup'
                ? 'Pickup selected'
                : activeShippingZone
                  ? `${activeShippingZone.town} delivery`
                  : 'Add delivery address'}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handlePlaceOrder()}
            disabled={placeOrderDisabled}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 via-red-700 to-rose-600 px-5 py-4 text-base font-black text-white shadow-lg shadow-red-100 transition disabled:cursor-not-allowed disabled:bg-gray-300 disabled:bg-none disabled:text-gray-500 disabled:shadow-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Placing order...
              </>
            ) : hasCheckoutIssues ? (
              <>
                <AlertTriangle className="h-5 w-5" />
                Resolve cart issues
              </>
            ) : (
              <>
                <Lock className="h-5 w-5" />
                Place Order
              </>
            )}
          </button>
        </div>
      )}

      {/* Location modal */}
      {isLocationModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"
          onClick={closeLocationModal}
        >
          <div
            className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-100 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {modalStep !== 'region' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setModalStep(modalStep === 'town' ? 'region' : 'town');
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  )}

                  <div>
                    <h2 className="text-lg font-black text-gray-950">
                      {modalStep === 'region' && 'Select region'}
                      {modalStep === 'town' && 'Select town'}
                      {modalStep === 'address' && 'Enter address'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {modalStep === 'region' &&
                        'Choose your delivery region.'}
                      {modalStep === 'town' && `Towns in ${tempRegion}.`}
                      {modalStep === 'address' &&
                        'Add your street address or landmark.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeLocationModal}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-gray-400">
                <span
                  className={cn(
                    tempRegion && 'text-red-600',
                    modalStep === 'region' && 'text-gray-950'
                  )}
                >
                  {tempRegion || 'Region'}
                </span>
                <ChevronRight className="h-3 w-3" />
                <span
                  className={cn(
                    tempTown && 'text-red-600',
                    modalStep === 'town' && 'text-gray-950'
                  )}
                >
                  {tempTown || 'Town'}
                </span>
                <ChevronRight className="h-3 w-3" />
                <span
                  className={cn(modalStep === 'address' && 'text-gray-950')}
                >
                  Address
                </span>
              </div>

              {modalStep !== 'address' && (
                <div className="relative mt-4">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      modalStep === 'region'
                        ? 'Search regions...'
                        : 'Search towns...'
                    }
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                  />
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {zonesLoading ? (
                <div className="flex min-h-56 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                </div>
              ) : (
                <>
                  {modalStep === 'region' && (
                    <div className="space-y-2">
                      {filteredRegions.length === 0 ? (
                        <div className="rounded-2xl bg-gray-50 p-8 text-center text-sm text-gray-500">
                          No regions found.
                        </div>
                      ) : (
                        filteredRegions.map((region) => {
                          const zoneCount = shippingZones.filter(
                            (zone) =>
                              zone.region.toLowerCase() ===
                              region.toLowerCase()
                          ).length;

                          return (
                            <button
                              key={region}
                              type="button"
                              onClick={() => handleSelectRegion(region)}
                              className="flex w-full items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left transition hover:border-red-100 hover:bg-red-50"
                            >
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-red-600">
                                <MapPin className="h-5 w-5" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-gray-950">
                                  {region}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {zoneCount}{' '}
                                  {zoneCount === 1 ? 'town' : 'towns'} available
                                </p>
                              </div>

                              <ChevronRight className="h-5 w-5 text-gray-300" />
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}

                  {modalStep === 'town' && (
                    <div className="space-y-2">
                      {filteredTowns.length === 0 ? (
                        <div className="rounded-2xl bg-gray-50 p-8 text-center text-sm text-gray-500">
                          No towns found for this region.
                        </div>
                      ) : (
                        filteredTowns.map((town) => {
                          const zone =
                            shippingZones.find(
                              (z) =>
                                z.region.toLowerCase() ===
                                  tempRegion.toLowerCase() &&
                                z.town.toLowerCase() === town.toLowerCase()
                            ) ?? null;

                          const qualifiesFree =
                            zone?.free_shipping_threshold !== null &&
                            zone?.free_shipping_threshold !== undefined &&
                            totalPrice >= zone.free_shipping_threshold;

                          return (
                            <button
                              key={town}
                              type="button"
                              onClick={() => handleSelectTown(town)}
                              className="flex w-full items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left transition hover:border-red-100 hover:bg-red-50"
                            >
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-red-600">
                                <MapPin className="h-5 w-5" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-gray-950">
                                  {town}
                                </p>

                                {zone && (
                                  <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
                                    <Clock className="h-3.5 w-3.5" />
                                    {zone.estimated_days_min}–
                                    {zone.estimated_days_max} days
                                  </p>
                                )}
                              </div>

                              {zone && (
                                <div className="text-right">
                                  <p
                                    className={cn(
                                      'text-sm font-black',
                                      qualifiesFree
                                        ? 'text-green-600'
                                        : 'text-gray-950'
                                    )}
                                  >
                                    {qualifiesFree
                                      ? 'Free'
                                      : formatCedis(zone.shipping_fee)}
                                  </p>
                                  <ChevronRight className="ml-auto mt-1 h-4 w-4 text-gray-300" />
                                </div>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}

                  {modalStep === 'address' && (
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                        <div className="flex gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
                            <MapPin className="h-5 w-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-gray-950">
                              {tempTown}, {tempRegion}
                            </p>

                            {(() => {
                              const zone = getZoneForPreview();
                              if (!zone) return null;

                              const qualifiesFree =
                                zone.free_shipping_threshold !== null &&
                                totalPrice >= zone.free_shipping_threshold;

                              return (
                                <p className="mt-1 text-sm font-semibold text-red-700">
                                  {zone.estimated_days_min}–
                                  {zone.estimated_days_max} days ·{' '}
                                  {qualifiesFree
                                    ? 'Free delivery'
                                    : formatCedis(zone.shipping_fee)}
                                </p>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                          Street address *
                        </label>
                        <input
                          value={tempAddressLine1}
                          onChange={(e) =>
                            setTempAddressLine1(e.target.value)
                          }
                          placeholder="House number, street name, area"
                          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                          Landmark / additional info
                        </label>
                        <input
                          value={tempAddressLine2}
                          onChange={(e) =>
                            setTempAddressLine2(e.target.value)
                          }
                          placeholder="Near landmark, apartment, suite, etc."
                          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {modalStep === 'address' && (
              <div className="border-t border-gray-100 p-5">
                <button
                  type="button"
                  onClick={handleConfirmLocation}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-4 text-sm font-black text-white shadow-lg shadow-red-100 transition hover:opacity-95"
                >
                  <CheckCircle className="h-5 w-5" />
                  Confirm address
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
