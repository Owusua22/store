'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Check,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  X,
  ZoomIn,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useCart } from '@/hooks/useCart';
import { formatCedis, metaNumber, metaString } from '@/lib/utils';
import { skinTypeLabel } from '@/lib/skin-types';
import { ProductCard } from '@/components/products/ProductCard';
import type { Product, ProductVariant } from '@/types';

interface ProductDetailsProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetails({ product, relatedProducts }: ProductDetailsProps) {
  const { addToCart } = useCart();

  const allImages = useMemo(() => {
    const images = [
      ...(product.thumbnail ? [product.thumbnail] : []),
      ...(product.images ?? []).filter((image) => image !== product.thumbnail),
    ];
    return images.length > 0 ? images : ['/images/products/body-lotion.jpg'];
  }, [product.thumbnail, product.images]);

  const variants: ProductVariant[] = useMemo(
    () => (product.variants ?? []).filter((variant) => variant.is_active !== false),
    [product.variants]
  );
  const hasVariants = variants.length > 0;

  const options = useMemo(() => {
    if (hasVariants) return [...new Set(variants.map((variant) => variant.size))];
    return product.sizes ?? [];
  }, [hasVariants, variants, product.sizes]);

  const [selectedImage, setSelectedImage] = useState(allImages[0]);
  const [selectedOption, setSelectedOption] = useState<string>(
    options.length === 1 ? options[0] : ''
  );
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = ctaRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-1px 0px 0px 0px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const activeVariant = useMemo(() => {
    if (!hasVariants || !selectedOption) return null;
    return variants.find((variant) => variant.size === selectedOption) ?? null;
  }, [hasVariants, variants, selectedOption]);

  const price = activeVariant?.price ?? product.price;
  const compareAt = activeVariant?.compare_at_price ?? product.compare_at_price;
  const stock = activeVariant?.stock_quantity ?? product.stock_quantity;

  const discount =
    compareAt && compareAt > price
      ? Math.round(((compareAt - price) / compareAt) * 100)
      : null;

  const rating = metaNumber(product.metadata, 'rating', 4.8);
  const reviews = metaNumber(product.metadata, 'reviews', 0);
  const sold = metaNumber(product.metadata, 'sold', 0);
  const brand = metaString(product.metadata, 'brand') ?? 'Sally Skin';

  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 5;

  const handleAddToCart = async (redirectToCheckout = false) => {
    if (isOutOfStock) return;

    if (options.length > 1 && !selectedOption) {
      toast.error('Please choose an option first');
      return;
    }

    setAdding(true);
    try {
      await addToCart(
        product.id,
        quantity,
        selectedOption || options[0] || null,
        null
      );

      if (redirectToCheckout) {
        window.location.href = '/checkout';
      }
    } finally {
      setAdding(false);
    }
  };

  const handleShare = async () => {
    const shareData = { title: product.name, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied');
      }
    } catch {
      /* user cancelled */
    }
  };

  const categoryHref = product.category
    ? `/categories/${product.category.slug}`
    : '/products';

  return (
    <div className="pb-20 md:pb-10">
      {/* Breadcrumb */}
      <div className="border-b border-line bg-white">
        <div className="container-page hide-scrollbar flex items-center gap-1 overflow-x-auto py-2.5 text-[11.5px] text-muted">
          <Link href="/" className="hover:text-brand">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link href="/products" className="hover:text-brand">
            Shop
          </Link>
          {product.category && (
            <>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <Link href={categoryHref} className="hover:text-brand">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="truncate font-semibold text-ink">{product.name}</span>
        </div>
      </div>

      <div className="container-page pt-4">
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Gallery */}
          <div className="lg:col-span-5">
            <div className="relative aspect-square overflow-hidden rounded-xl border border-line bg-surface-soft">
              <Image
                src={selectedImage}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="cursor-zoom-in object-cover"
                onClick={() => setLightbox(true)}
              />
              {discount && (
                <span className="absolute left-0 top-0 rounded-br-lg bg-brand px-2.5 py-1 text-[12px] font-extrabold text-white">
                  -{discount}%
                </span>
              )}
              <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10.5px] font-semibold text-white backdrop-blur-sm">
                <ZoomIn className="h-3 w-3" /> Tap to zoom
              </span>
            </div>

            {allImages.length > 1 && (
              <div className="hide-scrollbar mt-2.5 flex gap-2 overflow-x-auto">
                {allImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-white ${
                      selectedImage === image ? 'border-brand' : 'border-line'
                    }`}
                    aria-label={`View image ${index + 1}`}
                  >
                    <Image src={image} alt="" fill sizes="64px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 hidden grid-cols-3 gap-2 lg:grid">
              {[
                { icon: Truck, title: 'Fast delivery', copy: '1–3 business days' },
                { icon: ShieldCheck, title: 'Authentic', copy: 'Verified supplier' },
                { icon: RotateCcw, title: 'Easy returns', copy: '7-day policy' },
              ].map(({ icon: Icon, title, copy }) => (
                <div
                  key={title}
                  className="rounded-lg border border-line bg-white p-2.5 text-center"
                >
                  <Icon className="mx-auto h-4 w-4 text-brand" />
                  <p className="mt-1 text-[10.5px] font-bold text-ink">{title}</p>
                  <p className="text-[9.5px] text-muted">{copy}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center gap-2">
              {product.category && (
                <Link
                  href={categoryHref}
                  className="rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-brand"
                >
                  {product.category.name}
                </Link>
              )}
              <span className="rounded-full bg-surface-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500">
                {brand}
              </span>
              {isLowStock && (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-600">
                  Only {stock} left
                </span>
              )}
            </div>

            <h1 className="mt-2 text-[22px] font-extrabold leading-tight tracking-tight text-ink sm:text-[28px]">
              {product.name}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted">
              <span className="flex items-center gap-0.5 text-amber-500">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-3.5 w-3.5 fill-current" />
                ))}
                <span className="ml-1 font-bold text-ink">{rating.toFixed(1)}</span>
              </span>
              {reviews > 0 && <span>{reviews} reviews</span>}
              {sold > 0 && <span>{sold} sold</span>}
              <span className="text-emerald-600">In stock</span>
            </div>

            <div className="mt-4 flex flex-wrap items-baseline gap-2">
              <span className="text-[30px] font-extrabold tracking-tight text-brand">
                {formatCedis(price)}
              </span>
              {compareAt && compareAt > price && (
                <>
                  <span className="text-[15px] text-gray-400 line-through">
                    {formatCedis(compareAt)}
                  </span>
                  <span className="rounded bg-brand-soft px-2 py-0.5 text-[11px] font-extrabold text-brand">
                    Save {discount}%
                  </span>
                </>
              )}
            </div>

            <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-gray-600">
              {product.description}
            </p>

            {/* Options */}
            {options.length > 0 && (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink">
                    Select size / pack
                  </h2>
                  {selectedOption && (
                    <span className="text-[11.5px] font-semibold text-brand">
                      {selectedOption}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSelectedOption(option)}
                      className={`h-9 rounded-md border px-3 text-[12.5px] font-semibold transition-colors ${
                        selectedOption === option
                          ? 'border-brand bg-brand text-white'
                          : 'border-line bg-white text-gray-700 hover:border-brand/60'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + CTA */}
            <div ref={ctaRef} className="mt-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 items-center overflow-hidden rounded-md border border-line">
                  <button
                    type="button"
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    className="flex h-full w-10 items-center justify-center text-gray-600 hover:bg-surface-soft"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-10 text-center text-[13px] font-bold">{quantity}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((value) => Math.min(Math.max(stock, 1), value + 1))
                    }
                    className="flex h-full w-10 items-center justify-center text-gray-600 hover:bg-surface-soft"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="text-[11.5px] text-muted">
                  {stock} unit{stock === 1 ? '' : 's'} available
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAddToCart(false)}
                  disabled={adding || isOutOfStock}
                  className="btn-brand h-11 flex-1 text-[13px] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {adding ? 'Adding…' : isOutOfStock ? 'Sold out' : 'Add to cart'}
                </button>
                <button
                  type="button"
                  onClick={() => handleAddToCart(true)}
                  disabled={adding || isOutOfStock}
                  className="h-11 flex-1 rounded-md border-2 border-brand bg-white text-[13px] font-extrabold text-brand transition-colors hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Buy now
                </button>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setWishlisted((value) => !value);
                    toast.success(
                      wishlisted ? 'Removed from saved items' : 'Saved to your list'
                    );
                  }}
                  className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold ${
                    wishlisted ? 'text-brand' : 'text-gray-500 hover:text-brand'
                  }`}
                >
                  <Heart
                    className="h-3.5 w-3.5"
                    fill={wishlisted ? 'currentColor' : 'none'}
                  />
                  {wishlisted ? 'Saved' : 'Save for later'}
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-gray-500 hover:text-brand"
                >
                  <Share2 className="h-3.5 w-3.5" /> Share
                </button>
              </div>
            </div>

            {/* Delivery panel */}
            <div className="mt-5 rounded-lg border border-line bg-surface-soft p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-2.5">
                  <Truck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <div>
                    <p className="text-[12px] font-bold text-ink">Delivery across Ghana</p>
                    <p className="text-[11px] leading-snug text-muted">
                      Accra & Kumasi in 1–2 days. Other regions 2–4 days.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <div>
                    <p className="text-[12px] font-bold text-ink">Genuine or refunded</p>
                    <p className="text-[11px] leading-snug text-muted">
                      100% authentic products or your money back.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <div>
                    <p className="text-[12px] font-bold text-ink">7-day returns</p>
                    <p className="text-[11px] leading-snug text-muted">
                      Unopened items can be returned within 7 days.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <div>
                    <p className="text-[12px] font-bold text-ink">Pay on delivery</p>
                    <p className="text-[11px] leading-snug text-muted">
                      Pay cash or MoMo when your order arrives.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="mt-8 grid gap-4 border-t border-line pt-6 md:grid-cols-3">
          <div className="panel p-4">
            <h2 className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-ink">
              Product details
            </h2>
            <ul className="mt-2 space-y-1.5 text-[12px] text-gray-600">
              <li className="flex justify-between gap-3">
                <span className="text-muted">Brand</span>
                <span className="font-semibold text-ink">{brand}</span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-muted">Category</span>
                <span className="font-semibold text-ink">
                  {product.category?.name ?? 'Skin care'}
                </span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-muted">Skin type</span>
                <span className="text-right font-semibold text-ink">
                  {(product.skin_types ?? []).length > 0
                    ? (product.skin_types ?? []).map(skinTypeLabel).join(', ')
                    : 'All skin types'}
                </span>
              </li>
              {options.length > 0 && (
                <li className="flex justify-between gap-3">
                  <span className="text-muted">Options</span>
                  <span className="text-right font-semibold text-ink">
                    {options.join(', ')}
                  </span>
                </li>
              )}
              <li className="flex justify-between gap-3">
                <span className="text-muted">Stock</span>
                <span className="font-semibold text-ink">{stock} units</span>
              </li>
            </ul>
          </div>

          <div className="panel p-4">
            <h2 className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-ink">
              How to use
            </h2>
            <p className="prose-soft mt-2 whitespace-pre-line text-[12px] leading-relaxed text-gray-600">
              {product.how_to_use ??
                'Apply to clean, dry skin morning and night. For best results use daily and follow with sunscreen in the morning. Patch test before first use.'}
            </p>
            {product.ingredients ? (
              <p className="mt-2 border-t border-line pt-2 text-[11.5px] leading-relaxed text-muted">
                <span className="font-bold uppercase tracking-wider text-ink/70">
                  Key ingredients:
                </span>{' '}
                {product.ingredients}
              </p>
            ) : null}
          </div>

          <div className="panel p-4">
            <h2 className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-ink">
              Delivery & returns
            </h2>
            <p className="prose-soft mt-2 text-[12px] leading-relaxed text-gray-600">
              Orders placed before 3pm are dispatched the same working day. Free delivery
              on orders over GH₵300. Unopened products can be returned within 7 days.
            </p>
          </div>
        </div>

        {/* Related */}
        {relatedProducts.length > 0 && (
          <div className="mt-8">
            <div className="section-head">
              <div>
                <h2 className="section-title">You may also like</h2>
                <p className="section-subtitle">Complete your routine</p>
              </div>
              <Link href={categoryHref} className="section-link">
                View category <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-4">
              {relatedProducts.map((related) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white"
            aria-label="Close image"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="relative h-[80vh] w-full max-w-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={selectedImage}
              alt={product.name}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}

      {/* Sticky mobile CTA */}
      <div
        className={`fixed inset-x-0 bottom-16 z-40 border-t border-line bg-white/95 backdrop-blur md:bottom-0 md:hidden ${
          showStickyBar ? 'translate-y-0' : 'translate-y-[150%]'
        } transition-transform duration-300`}
      >
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-surface-soft">
            <Image src={selectedImage} alt="" fill sizes="40px" className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-gray-500">
              {product.name}
            </p>
            <p className="text-[14px] font-extrabold text-brand">{formatCedis(price)}</p>
          </div>
          <button
            type="button"
            onClick={() => handleAddToCart(false)}
            disabled={adding || isOutOfStock}
            className="btn-brand h-10 px-4 text-[12.5px]"
          >
            <ShoppingBag className="h-4 w-4" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
