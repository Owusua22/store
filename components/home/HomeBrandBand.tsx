// components/home/HomeBrandBand.tsx
// The local, SEO-bearing statement that sits right under the banner carousel.
// Cream ground so the dark carousel above it stands out, teal type for the
// headline, terracotta for the one warm call to action.

import Link from 'next/link';
import { ArrowRight, BadgeCheck, Clock, MapPin, MessageCircle, Truck } from 'lucide-react';

import { site } from '@/lib/site';
import { generalWhatsAppMessage, whatsappLink } from '@/lib/whatsapp';

export function HomeBrandBand() {
  return (
    <section
      className="mt-4 border-y border-line bg-cream sm:mt-5"
      aria-labelledby="home-heading"
    >
      <div className="container-page py-6 sm:py-8">
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-center lg:gap-10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow rounded-full bg-brand-soft px-2.5 py-1 text-brand">
                <MapPin className="h-3.5 w-3.5" /> East Doboro · Nsawam
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-accent-ink">
                <BadgeCheck className="h-3.5 w-3.5" /> Authenticity guarantee
              </span>
            </div>

            <h1
              id="home-heading"
              className="mt-3 max-w-[36ch] text-[21px] font-black leading-[1.18] tracking-tight text-brand sm:text-[27px] lg:text-[30px]"
            >
              100% Authentic Skincare, Body Care &amp; Mothercare in East Doboro
              <span className="text-accent"> — Beside St. George&apos;s Height</span>
            </h1>

            <p className="mt-2.5 text-[13.5px] font-extrabold text-accent-dark sm:text-[15px]">
              {site.tagline}.
            </p>
            <p className="mt-1.5 max-w-[62ch] text-[12px] leading-relaxed text-muted sm:text-[12.5px]">
              Original Nivea, Vaseline, Johnson&apos;s, Dove and Cetaphil — no fakes, no expired
              stock. Walk in beside St. George&apos;s Height, or order on WhatsApp and we deliver
              across Nsawam, Doboro and the whole of Ghana.
            </p>

            <ul className="mt-3.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-semibold text-ink/75">
              <li className="inline-flex items-center gap-1.5">
                <BadgeCheck className="h-3.5 w-3.5 text-brand" /> 100% original products
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-brand" /> {site.hoursSummary}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-brand" /> Free delivery over{' '}
                {site.currencySymbol}
                {site.freeDeliveryThreshold}
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-2.5">
            <Link
              href="/products"
              className="btn-brand h-11 px-5 text-[13px] font-extrabold"
            >
              Shop all products <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={whatsappLink(generalWhatsAppMessage())}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-brand/25 bg-white px-5 text-[13px] font-bold text-brand transition-colors hover:border-brand/60 hover:bg-brand-soft"
            >
              <MessageCircle className="h-4 w-4 text-[#1da851]" /> Order on WhatsApp
            </a>
            <Link
              href="/location"
              className="btn-accent h-11 px-5 text-[13px] font-extrabold"
            >
              <MapPin className="h-4 w-4" /> Find the shop
            </Link>

            <p className="text-center text-[11px] text-muted">
              Beside St. George&apos;s Height · {site.phoneDisplay}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeBrandBand;
