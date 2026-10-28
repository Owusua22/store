'use client';

// components/home/HeroBanner.tsx
// The banner is photography, full stop: no headline, no copy, no colour scrim.
// The only controls sit in a ruled bar underneath the photograph.

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

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

/** Fallback slides carry a link and alt text — nothing is printed on the photo. */
const FALLBACK: Banner[] = [
  {
    id: 'slide-one',
    title: 'Body lotions and creams on a sage shelf',
    subtitle: null,
    description: null,
    image_url: '/images/banners/banner-1.webp',
    link_url: '/products',
    link_text: null,
  },
  {
    id: 'slide-two',
    title: 'A jar of shea butter with a wooden spoon',
    subtitle: null,
    description: null,
    image_url: '/images/banners/banner-2.webp',
    link_url: '/categories/bath-body-care',
    link_text: null,
  },
  {
    id: 'slide-three',
    title: 'A folded baby blanket, brush and amber bottle',
    subtitle: null,
    description: null,
    image_url: '/images/banners/banner-3.webp',
    link_url: '/categories/baby-care-essentials',
    link_text: null,
  },
];

export function HeroBanner({ banners }: HeroBannerProps) {
  const slides = banners.length > 0 ? banners : FALLBACK;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef(0);
  const total = slides.length;

  const go = useCallback(
    (direction: 1 | -1) => setIndex((current) => (current + direction + total) % total),
    [total]
  );

  useEffect(() => {
    if (paused || total <= 1) return;
    const timer = setInterval(() => go(1), 7000);
    return () => clearInterval(timer);
  }, [go, paused, total]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (event.key === 'ArrowLeft') go(-1);
      if (event.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  return (
    <section aria-label="Photographs from the shop" className="container-page pt-4 sm:pt-6">
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label="Photographs from the shop"
        className="border border-line bg-paper-deep"
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
        <div className="relative aspect-[4/3] sm:aspect-[16/7] lg:aspect-[2.6/1]">
          {slides.map((slide, slideIndex) => (
            <Link
              key={slide.id}
              href={slide.link_url || '/products'}
              aria-label={slide.title ?? 'See the collection'}
              aria-hidden={slideIndex !== index}
              tabIndex={slideIndex === index ? 0 : -1}
              className={`absolute inset-0 block transition-opacity duration-700 ${
                slideIndex === index ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              <Image
                src={slide.image_url}
                alt={slide.title ?? 'Glow-Up'}
                fill
                priority={slideIndex === 0}
                loading={slideIndex === 0 ? 'eager' : 'lazy'}
                sizes="(max-width: 1240px) 100vw, 1240px"
                className="object-cover"
              />
            </Link>
          ))}
        </div>

        {total > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-2 sm:px-4">
            <p className="flex items-baseline gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
              <span className="tabular-nums text-ink">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="h-px w-4 bg-line" aria-hidden="true" />
              <span className="tabular-nums">{String(total).padStart(2, '0')}</span>
            </p>

            <div className="flex items-center gap-1">
              {slides.map((slide, dotIndex) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setIndex(dotIndex)}
                  aria-label={`Photograph ${dotIndex + 1}`}
                  aria-current={dotIndex === index}
                  className={`h-[3px] transition-all duration-300 ${
                    dotIndex === index ? 'w-6 bg-sage-deep' : 'w-3 bg-line hover:bg-sage'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous photograph"
                className="text-[10px] font-bold uppercase tracking-[0.14em] text-sage-deep hover:text-sage-ink"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next photograph"
                className="text-[10px] font-bold uppercase tracking-[0.14em] text-sage-deep hover:text-sage-ink"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default HeroBanner;
