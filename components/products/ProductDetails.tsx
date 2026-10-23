'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import {
ShoppingCart, Heart, Share2, ChevronRight, Star,
Truck, Shield, RotateCcw, Check, Minus, Plus, ZoomIn, X,
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/utils';
import { toast } from 'react-toastify';
import { AuthModal } from '@/components/auth/AuthModal';
import type { Product, ProductVariant } from '@/types';
import Image from 'next/image';
import Link from 'next/link';

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  thumbnail: string | null;
  stock_quantity: number;
}

interface ProductDetailsProps {
  product: Product;
  relatedProducts: RelatedProduct[];
}

export function ProductDetails({ product, relatedProducts }: ProductDetailsProps) {
  const { addToCart, isLoading } = useCart();
  const { isAuthenticated } = useAuth();

  const [selectedImage, setSelectedImage] = useState(product.thumbnail ?? product.images?.[0] ?? '');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showStickyCart, setShowStickyCart] = useState(false);

  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ctaRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyCart(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: '-1px 0px 0px 0px',
      }
    );

    observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, []);

  const variants: ProductVariant[] = useMemo(
    () => (product.variants ?? []).filter((v) => v.is_active !== false),
    [product.variants]
  );
  const hasVariants = variants.length > 0;

  const availableSizes = useMemo(() => {
    if (hasVariants) return [...new Set(variants.map((v) => v.size))];
    return product.sizes ?? [];
  }, [hasVariants, variants, product.sizes]);

  const availableColors = useMemo(() => {
    if (!hasVariants) return product.colors ?? [];
    const source = selectedSize ? variants.filter((v) => v.size === selectedSize) : variants;
    return [...new Set(source.map((v) => v.color))];
  }, [hasVariants, variants, selectedSize, product.colors]);

  const activeVariant = useMemo<ProductVariant | null>(() => {
    if (!hasVariants || !selectedSize || !selectedColor) return null;
    return variants.find((v) => v.size === selectedSize && v.color === selectedColor) ?? null;
  }, [hasVariants, variants, selectedSize, selectedColor]);

  const currentPrice = activeVariant?.price ?? product.price;
  const currentCompare = activeVariant?.compare_at_price ?? product.compare_at_price;
  const currentStock = activeVariant?.stock_quantity ?? product.stock_quantity;
  const isOutOfStock = currentStock === 0;
  const isLowStock = currentStock > 0 && currentStock <= 5;
  const discount = currentCompare ? Math.round(((currentCompare - currentPrice) / currentCompare) * 100) : null;

  const priceRange = useMemo(() => {
    if (!hasVariants) return null;
    const prices = variants.map((v) => v.price);
    return { min: Math.min(...prices), max: Math.max(...prices), same: Math.min(...prices) === Math.max(...prices) };
  }, [hasVariants, variants]);

  const allImages = useMemo(() => [
    ...(product.thumbnail ? [product.thumbnail] : []),
    ...(product.images ?? []).filter((img) => img !== product.thumbnail),
  ], [product.thumbnail, product.images]);

  const handleSelectSize = (size: string) => { 
    setSelectedSize(size); 
    setSelectedColor(''); 
    setQuantity(1); 
  };
  
  const handleSelectColor = (color: string) => { 
    setSelectedColor(color); 
    setQuantity(1); 
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) { 
      setAuthModalOpen(true); 
      return; 
    }
    if (availableSizes.length > 0 && !selectedSize) { 
      toast.error('Please select a size'); 
      return; 
    }
    if (availableColors.length > 0 && !selectedColor) { 
      toast.error('Please select a colour'); 
      return; 
    }
    if (hasVariants && !activeVariant) { 
      toast.error('Please select a valid size & colour'); 
      return; 
    }
    
    try { 
      setAdding(true); 
      await addToCart(product.id, quantity, selectedSize || null, selectedColor || null); 
      toast.success('Added to cart!');
    } finally { 
      setAdding(false); 
    }
  };

  const handleShare = async () => {
    try { 
      await navigator.share({ title: product.name, url: window.location.href }); 
    } catch { 
      await navigator.clipboard.writeText(window.location.href); 
      toast.success('Link copied!'); 
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} defaultView="login" />

      {/* Lightbox */}
      {lightboxOpen && selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-2" onClick={() => setLightboxOpen(false)}>
          <div className="relative w-full max-w-4xl aspect-square" onClick={(e) => e.stopPropagation()}>
            <Image src={selectedImage} alt={product.name} fill className="object-contain" sizes="100vw" />
            <button 
              onClick={() => setLightboxOpen(false)} 
              className="absolute top-2 right-2 w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Compact Breadcrumb */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 py-2">
          <nav className="flex items-center gap-1 text-xs overflow-x-auto">
            <Link href="/" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors whitespace-nowrap">Home</Link>
            <ChevronRight size={12} className="text-slate-400 flex-shrink-0" />
            <Link href="/products" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors whitespace-nowrap">Shop</Link>
            {product.category && (
              <>
                <ChevronRight size={12} className="text-slate-400 flex-shrink-0" />
                <Link href={`/categories/${product.category.slug}`} className="text-slate-600 hover:text-indigo-600 font-medium transition-colors whitespace-nowrap">
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight size={12} className="text-slate-400 flex-shrink-0" />
            <span className="text-slate-900 font-semibold truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 py-4 lg:px-8 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-12">
          {/* Compact Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-white shadow-md group">
              {selectedImage ? (
                <Image 
                  src={selectedImage} 
                  alt={product.name} 
                  fill 
                  className="object-cover cursor-zoom-in transition-transform duration-300 group-hover:scale-105" 
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority 
                  onClick={() => setLightboxOpen(true)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                  <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              )}
              
              {/* Compact Badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {discount && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    -{discount}%
                  </span>
                )}
                {isLowStock && (
                  <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {currentStock} left!
                  </span>
                )}
                {isOutOfStock && (
                  <span className="bg-slate-700 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Sold Out
                  </span>
                )}
              </div>

              {/* Zoom hint */}
              {selectedImage && (
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                  <ZoomIn size={12} />
                  Zoom
                </div>
              )}
            </div>

            {/* Compact Thumbnail gallery */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === img 
                        ? 'border-indigo-500 shadow-lg scale-105' 
                        : 'border-transparent hover:border-slate-300'
                    }`}
                  >
                    <Image src={img} alt={`View ${i + 1}`} fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Compact Product Info */}
          <div className="space-y-4">
            {/* Category & Title - Much smaller */}
            <div>
              {product.category && (
                <Link 
                  href={`/categories/${product.category.slug}`} 
                  className="inline-flex items-center gap-1 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide transition-colors mb-2"
                >
                  {product.category.name}
                </Link>
              )}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 leading-tight">{product.name}</h1>
              
              {/* Compact Rating */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="text-amber-500 fill-current" />
                  ))}
                </div>
                <span className="text-xs text-slate-600 font-medium">4.8 · <span className="text-indigo-600 underline cursor-pointer">128 reviews</span></span>
              </div>
            </div>

            {/* Smaller Price */}
            <div className="flex items-baseline gap-2 flex-wrap">
              {hasVariants && priceRange && !activeVariant ? (
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {priceRange.same ? formatPrice(priceRange.min) : `${formatPrice(priceRange.min)} - ${formatPrice(priceRange.max)}`}
                </span>
              ) : (
                <>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">{formatPrice(currentPrice)}</span>
                  {currentCompare && (
                    <span className="text-lg text-slate-400 line-through">{formatPrice(currentCompare)}</span>
                  )}
                </>
              )}
              {discount && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                  Save {discount}%
                </span>
              )}
            </div>

            {/* Compact Description */}
            {product.description && (
              <p className="text-sm leading-relaxed text-slate-600">{product.description}</p>
            )}

            <div className="border-t border-slate-200 pt-4 space-y-4">
              {/* Compact Variant Cards */}
              {hasVariants && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Options</h3>
                    <span className="text-xs text-slate-500 font-medium">{variants.length} variants</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {variants.map((variant) => {
                      const isSelected = selectedSize === variant.size && selectedColor === variant.color;
                      return (
                        <button
                          key={variant.id}
                          onClick={() => {
                            setSelectedSize(variant.size);
                            setSelectedColor(variant.color);
                            setQuantity(1);
                          }}
                          className={`text-left p-3 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">{variant.size}</span>
                            <span className="text-xs text-slate-600 font-medium flex items-center gap-1">
                              <span 
                                className="w-3 h-3 rounded-full border border-slate-300" 
                                style={{ backgroundColor: variant.color.toLowerCase() }}
                              />
                              {variant.color}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-base font-black text-slate-900">{formatPrice(variant.price)}</span>
                            <span className={`text-xs font-semibold ${
                              variant.stock_quantity === 0 
                                ? 'text-red-600' 
                                : variant.stock_quantity <= 5 
                                  ? 'text-orange-600' 
                                  : 'text-green-600'
                            }`}>
                              {variant.stock_quantity === 0 
                                ? 'Out of stock' 
                                : `${variant.stock_quantity} left`
                              }
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Compact Size Selector */}
              {!hasVariants && availableSizes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Size</h3>
                    {selectedSize && <span className="text-xs text-indigo-600 font-semibold">{selectedSize}</span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => handleSelectSize(size)}
                        className={`min-w-[2.5rem] h-10 px-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                          selectedSize === size
                            ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Compact Color Selector */}
              {!hasVariants && availableColors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Color</h3>
                    {selectedColor && <span className="text-xs text-indigo-600 font-semibold">{selectedColor}</span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleSelectColor(color)}
                        title={color}
                        className={`relative w-8 h-8 rounded-full border-3 transition-all ${
                          selectedColor === color
                            ? 'border-indigo-500 scale-110 shadow-lg'
                            : 'border-white hover:scale-105 shadow-sm'
                        }`}
                        style={{ backgroundColor: color.toLowerCase() }}
                      >
                        {selectedColor === color && (
                          <Check size={14} className="absolute inset-0 m-auto text-white drop-shadow-lg" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Compact Selected Variant Info */}
              {activeVariant && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-600 bg-white px-2 py-0.5 rounded">{activeVariant.size}</span>
                      <span className="text-xs text-slate-600 font-medium flex items-center gap-1">
                        <span 
                          className="w-3 h-3 rounded-full border border-slate-300" 
                          style={{ backgroundColor: activeVariant.color.toLowerCase() }}
                        />
                        {activeVariant.color}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-slate-900">{formatPrice(activeVariant.price)}</p>
                      <p className="text-xs text-slate-600 font-medium">{activeVariant.stock_quantity} in stock</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Compact Quantity */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Quantity</h3>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    isOutOfStock 
                      ? 'bg-slate-100 text-slate-600' 
                      : isLowStock 
                        ? 'bg-orange-100 text-orange-600' 
                        : 'bg-green-100 text-green-600'
                  }`}>
                    {isOutOfStock 
                      ? 'Out of stock' 
                      : isLowStock 
                        ? `${currentStock} left` 
                        : `${currentStock} available`
                    }
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border-2 border-slate-200 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-12 h-10 flex items-center justify-center text-base font-bold text-slate-900 border-x border-slate-200">
                      {quantity}
                    </span>
                    <button 
                      onClick={() => setQuantity(q => Math.min(currentStock, q + 1))}
                      className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                      disabled={quantity >= currentStock}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="text-xs text-slate-600 font-medium">
                    Max: {currentStock}
                  </span>
                </div>
              </div>

              {/* Compact Main CTA */}
              <div ref={ctaRef} className="pt-2">
                <div className="flex gap-2">
                  <button 
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || adding || isLoading}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${
                      isOutOfStock 
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg active:scale-95'
                    }`}
                  >
                    <ShoppingCart size={16} />
                    {adding ? 'Adding...' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                  <button 
                    onClick={() => setWishlisted(w => !w)}
                    className={`w-12 h-12 flex items-center justify-center rounded-lg border-2 transition-all ${
                      wishlisted 
                        ? 'border-red-500 bg-red-50 text-red-500' 
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
                  </button>
                  <button 
                    onClick={handleShare}
                    className="w-12 h-12 flex items-center justify-center rounded-lg border-2 border-slate-200 bg-white text-slate-600 hover:border-slate-300 transition-all"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Compact Trust Badges */}
            <div className="grid grid-cols-1 gap-2 pt-4 border-t border-slate-200">
              {[
                { icon: Truck, title: 'Free Shipping', subtitle: 'Orders over GH₵500' },
                { icon: Shield, title: '2-Year Warranty', subtitle: 'Full coverage' },
                { icon: RotateCcw, title: '30-Day Returns', subtitle: 'Easy returns' },
              ].map(({ icon: Icon, title, subtitle }) => (
                <div key={title} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">{title}</p>
                    <p className="text-xs text-slate-600">{subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Compact Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg lg:text-xl font-bold text-slate-900">You might also like</h2>
              {product.category && (
                <Link 
                  href={`/categories/${product.category.slug}`} 
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
                >
                  View all <ChevronRight size={12} />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {relatedProducts.map((related) => (
                <Link 
                  key={related.id} 
                  href={`/products/${related.slug}`} 
                  className="group bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all"
                >
                  <div className="relative aspect-square overflow-hidden">
                    {related.thumbnail ? (
                      <Image 
                        src={related.thumbnail} 
                        alt={related.name} 
                        fill 
                        className="object-cover transition-transform duration-300 group-hover:scale-110" 
                        sizes="(max-width: 640px) 50vw, 25vw" 
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                        <span className="text-2xl">📦</span>
                      </div>
                    )}
                    {related.stock_quantity === 0 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-white text-slate-900 text-xs font-bold px-2 py-1 rounded-full">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold text-slate-900 mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {related.name}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-slate-900">{formatPrice(related.price)}</span>
                      {related.compare_at_price && (
                        <span className="text-xs text-slate-400 line-through">{formatPrice(related.compare_at_price)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Compact Sticky Add to Cart Bar */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-xl transition-transform duration-300 lg:hidden ${
        showStickyCart && !isOutOfStock ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="max-w-7xl mx-auto px-3 py-2 flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedImage && (
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                <Image src={selectedImage} alt={product.name} fill className="object-cover" sizes="40px" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">{product.name}</p>
              <p className="text-sm font-black text-indigo-600">{formatPrice(currentPrice)}</p>
            </div>
          </div>
          <button 
            onClick={handleAddToCart}
            disabled={adding || isLoading}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-white text-sm transition-all ${
              adding || isLoading 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md active:scale-95'
            }`}
          >
            <ShoppingCart size={14} />
            {adding ? 'Adding...' : 'Add'}
          </button>
        </div>
        <div className="h-safe" />
      </div>
    </div>
  );
}