'use client';

// components/home/HeroBanner.tsx
// The home page hero: the banner carousel, same structure as the original
// build — full-width card, copy on the left, arrows, dots — repainted in the
// brand palette (teal / terracotta / cream).

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, MessageCircle, Sparkles } from 'lucide-react';

import { formatCedis } from '@/lib/utils';
import { site } from '@/lib/site';
import { generalWhatsAppMessage, whatsappLink } from '@/lib/whatsapp';

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
    id: 'fallback-authentic',
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
    title: 'Soft skin, all harmattan.',
    subtitle: 'Bath & body edit',
    description:
      'Shea-rich lotions, body oils and shower creams that keep ash away for 24 hours.',
    image_url: '/images/banners/hero-body.webp',
    link_url: '/categories/bath-body-care',
    link_text: 'Shop bath & body',
  },
  {
    id: 'fallback-baby',
    title: 'Care for mum, care for baby.',
    subtitle: 'Mothercare & baby essentials',
    description:
      'Stretch-mark creams, baby washes and jumbo diaper packs — or the whole hospital bag in one bundle.',
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
    const timer = setInterval(() => go(1), 6000);
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
        className="relative overflow-hidden rounded-xl bg-brand-dark"
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
        <div className="relative h-[236px] sm:h-[330px] lg:h-[430px]">
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
                  style={{ objectPosition: '62% center' }}
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

                <div className="relative z-10 flex h-full flex-col justify-center px-5 sm:px-9 lg:px-14">
                  <span
                    className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.16em] text-cream backdrop-blur-sm sm:mb-3 sm:text-[11px]"
                    style={{ background: theme.chip }}
                  >
                    <Sparkles className="h-3 w-3" style={{ color: theme.accent }} />
                    {slide.subtitle ?? 'New season essentials'}
                  </span>

                  <h2 className="max-w-[15ch] text-[26px] font-extrabold leading-[1.08] tracking-tight text-cream sm:max-w-[18ch] sm:text-[40px] lg:text-[52px]">
                    {slide.title ?? 'Skin care you can trust'}
                  </h2>

                  <p className="mt-2 hidden max-w-[46ch] text-[13px] leading-relaxed text-cream/85 sm:block sm:text-[14.5px]">
                    {slide.description ??
                      'Shop authentic skincare essentials with nationwide delivery.'}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2.5 sm:mt-6">
                    <Link
                      href={slide.link_url || '/products'}
                      className="inline-flex h-10 items-center gap-1.5 rounded-md bg-cream px-5 text-[12.5px] font-extrabold text-brand shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5 sm:h-11 sm:px-6 sm:text-[13.5px]"
                    >
                      {slide.link_text || 'Shop now'}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <a
                      href={whatsappLink(generalWhatsAppMessage())}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center gap-1.5 rounded-md border border-cream/35 bg-cream/10 px-4 text-[12.5px] font-bold text-cream backdrop-blur-sm transition-colors hover:bg-cream/20 sm:h-11 sm:px-5 sm:text-[13.5px]"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Order on WhatsApp</span>
                      <span className="sm:hidden">WhatsApp</span>
                    </a>
                  </div>

                  <p className="mt-3 hidden items-center gap-1.5 text-[11px] font-semibold text-cream/75 sm:flex">
                    Free delivery on orders over {formatCedis(site.freeDeliveryThreshold)}
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
                className="absolute left-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-cream/85 text-brand shadow transition-colors hover:bg-cream sm:flex"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next slide"
                className="absolute right-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-cream/85 text-brand shadow transition-colors hover:bg-cream sm:flex"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
                {slides.map((slide, dotIndex) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setIndex(dotIndex)}
                    aria-label={`Go to slide ${dotIndex + 1}`}
                    aria-current={dotIndex === index}
                    className={`h-1.5 rounded-full transition-all ${
                      dotIndex === index ? 'w-6 bg-accent' : 'w-1.5 bg-cream/45 hover:bg-cream/70'
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
