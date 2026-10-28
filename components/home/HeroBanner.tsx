'use client';

// components/home/HeroBanner.tsx
// The home page hero: an auto-playing banner carousel in the brand palette.
// Slides come from /admin/banners; when the shop has none yet, three built-in
// slides keep the page looking finished.

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, MapPin, Truck } from 'lucide-react';

import { formatCedis } from '@/lib/utils';
import { site } from '@/lib/site';
import { generalWhatsAppMessage, whatsappLink } from '@/lib/whatsapp';
import { MessageCircle } from 'lucide-react';

interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  image_url: string;
  link_url: string | null;
  link_text: string | null;
}

interface HeroBannerProps {
  banners: Banner[];
}

const FALLBACK: Banner[] = [
  {
    id: 'fallback-teal',
    title: 'Authentic skincare, right here in East Doboro.',
    subtitle: 'Beside St. George’s Height',
    description:
      'Original Nivea, Vaseline, Johnson’s, Dove and Cetaphil — no fakes, no expired stock. Walk in, or order on WhatsApp.',
    image_url: '/images/banners/hero-teal.webp',
    link_url: '/products',
    link_text: 'Shop all products',
  },
  {
    id: 'fallback-body',
    title: 'Soft, glowing skin all harmattan.',
    subtitle: 'Bath & body edit',
    description:
      'Shea-rich lotions, body oils and shower creams that keep ash away for 24 hours.',
    image_url: '/images/banners/hero-body.webp',
    link_url: '/categories/bath-body-care',
    link_text: 'Shop bath & body',
  },
  {
    id: 'fallback-mum',
    title: 'Care for mum, care for baby.',
    subtitle: 'Mothercare & baby essentials',
    description:
      'Stretch-mark creams, baby washes and jumbo diaper packs — packed into one hospital bag bundle.',
    image_url: '/images/banners/hero-baby.webp',
    link_url: '/categories/mothercare-pregnancy',
    link_text: 'Shop mothercare',
  },
];

/**
 * One overlay per slide, tuned so cream text clears 4.5:1 over every photo —
 * the pale baby image needs the heaviest scrim of the three.
 */
const THEMES = [
  {
    overlay:
      'linear-gradient(100deg, #0b2a20 0%, rgba(27,77,62,0.96) 36%, rgba(27,77,62,0.72) 66%, rgba(27,77,62,0.1) 100%)',
    chip: 'rgba(253,248,245,0.16)',
    accent: '#f0bda9',
  },
  {
    overlay:
      'linear-gradient(100deg, #3d1b12 0%, rgba(74,34,22,0.95) 38%, rgba(74,34,22,0.72) 68%, rgba(74,34,22,0.12) 100%)',
    chip: 'rgba(253,248,245,0.2)',
    accent: '#fdf8f5',
  },
  {
    overlay:
      'linear-gradient(100deg, #0c2b22 0%, rgba(15,52,42,0.95) 40%, rgba(15,52,42,0.75) 70%, rgba(15,52,42,0.14) 100%)',
    chip: 'rgba(200,109,81,0.32)',
    accent: '#f0bda9',
  },
];

export function HeroBanner({ banners }: HeroBannerProps) {
  const slides = banners.length > 0 ? banners : FALLBACK;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef(0);
  const total = slides.length;

  const go = useCallback(
    (direction: 1 | -1) => {
      setIndex((current) => (current + direction + total) % total);
    },
    [total]
  );

  useEffect(() => {
    if (paused || total <= 1) return;
    const timer = setInterval(() => go(1), 6500);
    return () => clearInterval(timer);
  }, [go, paused, total]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') go(-1);
      if (event.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  return (
    <section className="container-page pt-3 sm:pt-4" aria-label="Featured offers">
      <div
        className="relative overflow-hidden rounded-2xl bg-brand-dark shadow-[0_18px_40px_-24px_rgba(19,37,31,0.55)]"
        role="group"
        aria-roledescription="carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(event) => {
          touchStart.current = event.touches[0].clientX;
          setPaused(true);
        }}
        onTouchEnd={(event) => {
          const delta = touchStart.current - event.changedTouches[0].clientX;
          if (Math.abs(delta) > 40) go(delta > 0 ? 1 : -1);
          setPaused(false);
        }}
      >
        <div className="relative h-[268px] sm:h-[352px] lg:h-[430px]">
          {slides.map((slide, slideIndex) => {
            const theme = THEMES[slideIndex % THEMES.length];

            return (
              <div
                key={slide.id}
                aria-hidden={slideIndex !== index}
                // Keep keyboard focus out of slides the visitor cannot see
                inert={slideIndex !== index}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  slideIndex === index ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
              >
                <Image
                  loading={slideIndex === 0 ? 'eager' : 'lazy'}
                  src={slide.image_url || '/images/banners/hero-teal.webp'}
                  alt={slide.title ?? 'Glow-Up skincare offer'}
                  fill
                  priority={slideIndex === 0}
                  sizes="100vw"
                  className="object-cover"
                  style={{ objectPosition: '68% center' }}
                />
                <div className="absolute inset-0" style={{ background: theme.overlay }} />

                {/* Phones crop tighter into the bright part of the photo, so they
                    get one extra scrim to keep the copy readable. */}
                <div
                  className="absolute inset-0 sm:hidden"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(9,34,26,0.86) 0%, rgba(9,34,26,0.42) 52%, rgba(9,34,26,0.08) 100%)',
                  }}
                />

                {/* Terracotta hairline along the top edge of the slide */}
                <div className="absolute inset-x-0 top-0 h-[3px] bg-accent" />

                <div className="relative z-10 flex h-full flex-col justify-center px-5 pb-10 sm:px-9 sm:pb-0 lg:px-14">
                  <span
                    className="mb-2.5 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-cream backdrop-blur-sm sm:mb-3 sm:text-[10.5px]"
                    style={{ background: theme.chip }}
                  >
                    <MapPin className="h-3 w-3" style={{ color: theme.accent }} />
                    {slide.subtitle ?? 'East Doboro · Nsawam'}
                  </span>

                  <h2 className="max-w-[17ch] text-[27px] font-black leading-[1.06] tracking-tight text-cream sm:max-w-[20ch] sm:text-[40px] lg:text-[50px]">
                    {slide.title ?? 'Skin care you can trust'}
                  </h2>

                  <p className="mt-2 hidden max-w-[48ch] text-[12.5px] leading-relaxed text-cream/85 sm:block sm:text-[14px]">
                    {slide.description ??
                      'Shop authentic skincare and mothercare essentials with nationwide delivery.'}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-6 sm:gap-2.5">
                    <Link
                      href={slide.link_url || '/products'}
                      className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-cream px-4 text-[12.5px] font-extrabold text-brand shadow-md shadow-black/10 transition-transform hover:-translate-y-0.5 sm:h-11 sm:px-5 sm:text-[13.5px]"
                    >
                      {slide.link_text || 'Shop now'}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <a
                      href={whatsappLink(generalWhatsAppMessage())}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-cream/40 px-4 text-[12.5px] font-bold text-cream backdrop-blur-sm transition-colors hover:bg-cream/15 sm:h-11 sm:px-5 sm:text-[13.5px]"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Order on WhatsApp</span>
                      <span className="sm:hidden">WhatsApp</span>
                    </a>
                  </div>

                  <p className="mt-3 hidden items-center gap-3 text-[10.5px] font-semibold text-cream/70 sm:flex">
                    <span className="inline-flex items-center gap-1.5">
                      <BadgeCheck className="h-3.5 w-3.5 text-cream/80" /> 100% original
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-cream/80" /> Free over{' '}
                      {formatCedis(site.freeDeliveryThreshold)}
                    </span>
                  </p>
                </div>
              </div>
            );
          })}

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous slide"
                className="absolute left-3 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-cream/90 text-brand shadow-sm transition-colors hover:bg-cream sm:flex"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next slide"
                className="absolute right-3 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-cream/90 text-brand shadow-sm transition-colors hover:bg-cream sm:flex"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 sm:left-5 sm:translate-x-0 lg:left-14">
                {slides.map((slide, dotIndex) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setIndex(dotIndex)}
                    aria-label={`Go to slide ${dotIndex + 1}`}
                    aria-current={dotIndex === index}
                    className={`h-1.5 rounded-full transition-all ${
                      dotIndex === index ? 'w-7 bg-accent' : 'w-1.5 bg-cream/45 hover:bg-cream/70'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default HeroBanner;
