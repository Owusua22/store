'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { formatCedis } from '@/lib/utils';
import { site } from '@/lib/site';

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
    id: 'fallback-1',
    title: 'Glow season starts here.',
    subtitle: 'Up to 40% off skin care',
    description:
      'Authentic body lotions, serums, face creams and baby care — delivered nationwide across Ghana.',
    image_url: '/images/hero-skincare.jpg',
    link_url: '/products',
    link_text: 'Shop the sale',
  },
];

const GRADIENTS = [
  'linear-gradient(90deg, rgba(107,10,14,0.92) 0%, rgba(160,17,24,0.78) 38%, rgba(20,22,26,0.15) 75%)',
  'linear-gradient(90deg, rgba(58,12,26,0.92) 0%, rgba(140,31,63,0.72) 42%, rgba(20,22,26,0.1) 78%)',
  'linear-gradient(90deg, rgba(14,40,44,0.9) 0%, rgba(20,86,84,0.7) 42%, rgba(20,22,26,0.1) 78%)',
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
        className="relative overflow-hidden rounded-xl bg-ink"
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
          {slides.map((slide, slideIndex) => (
            <div
              key={slide.id}
              aria-hidden={slideIndex !== index}
              className={`absolute inset-0 transition-opacity duration-700 ${
                slideIndex === index ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              <Image
                src={slide.image_url || '/images/hero-skincare.jpg'}
                alt={slide.title ?? 'Skincare offer'}
                fill
                priority={slideIndex === 0}
                sizes="100vw"
                className="object-cover"
                style={{ objectPosition: '62% center' }}
              />
              <div
                className="absolute inset-0"
                style={{ background: GRADIENTS[slideIndex % GRADIENTS.length] }}
              />

              <div className="relative z-10 flex h-full flex-col justify-center px-5 sm:px-9 lg:px-14">
                <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm sm:mb-3 sm:text-[11px]">
                  <Sparkles className="h-3 w-3 text-amber-300" />
                  {slide.subtitle ?? 'New season essentials'}
                </span>

                <h1 className="max-w-[15ch] text-[26px] font-extrabold leading-[1.08] tracking-tight text-white sm:max-w-[18ch] sm:text-[40px] lg:text-[52px]">
                  {slide.title ?? 'Skin care you can trust'}
                </h1>

                <p className="mt-2 hidden max-w-[46ch] text-[13px] leading-relaxed text-white/80 sm:block sm:text-[14.5px]">
                  {slide.description ??
                    'Shop authentic skincare essentials with nationwide delivery.'}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2.5 sm:mt-6">
                  <Link
                    href={slide.link_url || '/products'}
                    className="inline-flex h-10 items-center gap-1.5 rounded-md bg-brand px-5 text-[12.5px] font-extrabold text-white shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5 sm:h-11 sm:px-6 sm:text-[13.5px]"
                  >
                    {slide.link_text || 'Shop now'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/categories/baby-care"
                    className="inline-flex h-10 items-center rounded-md border border-white/30 bg-white/10 px-4 text-[12.5px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:h-11 sm:px-5 sm:text-[13.5px]"
                  >
                    Baby care
                  </Link>
                </div>

                <p className="mt-3 hidden items-center gap-1.5 text-[11px] font-semibold text-white/70 sm:flex">
                  Free delivery on orders over {formatCedis(site.freeDeliveryThreshold)}
                </p>
              </div>
            </div>
          ))}

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous slide"
                className="absolute left-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink shadow transition-colors hover:bg-white sm:flex"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next slide"
                className="absolute right-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink shadow transition-colors hover:bg-white sm:flex"
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
                    className={`h-1.5 rounded-full transition-all ${
                      dotIndex === index ? 'w-6 bg-white' : 'w-1.5 bg-white/45'
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
