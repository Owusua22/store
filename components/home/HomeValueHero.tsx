// components/home/HomeValueHero.tsx
// The first thing a visitor sees: the value proposition, the local headline,
// the four core departments, the authenticity guarantee and the WhatsApp CTA.

import Image from 'next/image';
import Link from 'next/link';
import {
  BadgeCheck,
  Clock,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';

import { site } from '@/lib/site';
import { generalWhatsAppMessage, whatsappLink } from '@/lib/whatsapp';

const CORE_CATEGORIES = [
  {
    slug: 'facial-skincare',
    name: 'Facial Skincare',
    icon: '✨',
    blurb: 'Cleansers, serums & SPF',
    image: '/images/products/face-cream.webp',
  },
  {
    slug: 'bath-body-care',
    name: 'Bath & Body Care',
    icon: '🧴',
    blurb: 'Lotions & shower gels',
    image: '/images/products/body-lotion.webp',
  },
  {
    slug: 'mothercare-pregnancy',
    name: 'Mothercare & Pregnancy',
    icon: '🤱🏽',
    blurb: 'Stretch marks & post-partum',
    image: '/images/products/baby-lotion.webp',
  },
  {
    slug: 'baby-care-essentials',
    name: 'Baby Care Essentials',
    icon: '🍼',
    blurb: 'Newborn washes & diapers',
    image: '/images/products/baby-diapers.webp',
  },
];

export function HomeValueHero() {
  return (
    <section className="border-b border-line bg-gradient-to-b from-brand-soft/60 to-white">
      <div className="container-page grid gap-6 py-7 sm:py-9 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-10">
        {/* ── Copy ─────────────────────────────────────────────────────── */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand shadow-sm">
              <BadgeCheck className="h-3.5 w-3.5" />
              Authenticity Guarantee
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-600">
              <MapPin className="h-3.5 w-3.5 text-brand" />
              East Doboro · Nsawam
            </span>
          </div>

          <h1 className="mt-3 text-[26px] font-black leading-[1.12] tracking-tight text-ink sm:text-[34px] lg:text-[38px]">
            100% Authentic Skincare, Body Care &amp; Mothercare in East Doboro
            <span className="text-brand"> — Beside St. George&apos;s Height</span>
          </h1>

          <p className="mt-2.5 max-w-xl text-[14px] font-semibold text-gray-700 sm:text-[15px]">
            {site.tagline}.
          </p>
          <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-muted">
            Original Nivea, Vaseline, Johnson&apos;s, Dove and Cetaphil — no fakes, no
            expired stock. Walk in beside St. George&apos;s Height, or order on WhatsApp and
            we deliver across Nsawam, Doboro and the whole of Ghana.
          </p>

          {/* Primary actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={whatsappLink(generalWhatsAppMessage())}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#25D366] px-4 text-[13px] font-extrabold text-white shadow-sm transition-colors hover:bg-[#1da851]"
            >
              <MessageCircle className="h-4 w-4" />
              Order on WhatsApp
            </a>
            <Link
              href="/products"
              className="btn-brand inline-flex h-11 items-center gap-2 rounded-lg px-4 text-[13px] font-extrabold"
            >
              <Sparkles className="h-4 w-4" />
              Shop all products
            </Link>
            <Link
              href="/location"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-line bg-white px-4 text-[13px] font-bold text-ink transition-colors hover:border-brand/50"
            >
              <MapPin className="h-4 w-4 text-brand" />
              Find the shop
            </Link>
          </div>

          {/* Trust strip */}
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-semibold text-gray-600">
            <li className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> 100% original products
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-brand" /> Free delivery over{' '}
              {site.currencySymbol}
              {site.freeDeliveryThreshold}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-brand" /> {site.hoursSummary}
            </li>
          </ul>
        </div>

        {/* ── The four core departments ────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {CORE_CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="group overflow-hidden rounded-xl border border-line bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-md"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-surface-soft">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 640px) 45vw, 240px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute left-2 top-2 rounded-full bg-white/95 px-1.5 py-0.5 text-[12px] leading-none shadow-sm">
                  {category.icon}
                </span>
              </div>
              <div className="p-2.5">
                <p className="text-[12px] font-extrabold leading-tight text-ink group-hover:text-brand">
                  {category.name}
                </p>
                <p className="mt-0.5 text-[10.5px] text-muted">{category.blurb}</p>
              </div>
            </Link>
          ))}

          <div className="col-span-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-brand/30 bg-white/70 px-3 py-2">
            <div className="flex flex-wrap gap-1.5">
              <Link
                href="/categories/haircare"
                className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-bold text-gray-700 hover:border-brand/60 hover:text-brand"
              >
                💆🏽‍♀️ Haircare
              </Link>
              <Link
                href="/categories/bundles-offers"
                className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-bold text-gray-700 hover:border-brand/60 hover:text-brand"
              >
                🎁 Bundles &amp; Offers
              </Link>
            </div>
            <Link
              href="/products?deals=1"
              className="text-[11px] font-extrabold text-brand hover:underline"
            >
              Today&apos;s deals →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeValueHero;
