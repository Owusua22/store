'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  image_url: string;
  link_url: string | null;
  link_text: string | null;
  button_text?: string | null;
  text_color?: string;
  overlay_opacity?: number;
  is_active?: boolean;
  sort_order?: number;
}

interface HeroProps {
  banners: Banner[];
}

const fallbackBanners: Banner[] = [
  {
    id: 'fallback-1',
    title: 'Discover Your Perfect Style',
    subtitle: 'NEW ARRIVALS',
    description: 'Free delivery on orders GH₵500+ · Quality guaranteed',
    image_url:
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80',
    link_url: '/products',
    link_text: 'Shop Now',
    button_text: 'Shop Now',
  },
  {
    id: 'fallback-2',
    title: 'Trendy Styles for Every Occasion',
    subtitle: 'SPRING 2025',
    description: 'Discover new arrivals · WhatsApp us for personalized picks',
    image_url:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80',
    link_url: '/products?category=new',
    link_text: 'Explore',
    button_text: 'Explore',
  },
];

export function Hero({ banners }: HeroProps) {
  const slides = useMemo(
    () => (banners && banners.length > 0 ? banners : fallbackBanners),
    [banners]
  );

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef(0);
  const sliderRef = useRef<HTMLDivElement>(null); // ← ref for DOM mutation
  const totalSlides = slides.length;

  // FOUC fix: mutate the DOM directly — no setState, no extra render
  useEffect(() => {
    sliderRef.current?.setAttribute('data-ready', 'true');
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (paused || totalSlides <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrent(p => (p + 1) % totalSlides);
    }, 5500);
  }, [paused, totalSlides]);

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  const go = useCallback(
    (dir: 1 | -1) => {
      stop();
      setCurrent(p => (p + dir + totalSlides) % totalSlides);
      start();
    },
    [stop, start, totalSlides]
  );

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 40) go(dx > 0 ? 1 : -1);
    setPaused(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  return (
    <>
      <style>{`
        :root {
          --hero-gold: #f59e0b;
          --hero-grad: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%);
        }

        .hero-root {
          width: 100%;
          display: flex;
          flex-direction: column;
          background: #0f0c29;
          contain: layout style;
        }

        .hero-slider {
          position: relative;
          width: 100%;
          height: clamp(220px, 52vw, 680px);
          overflow: hidden;
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        /* Triggered by data-ready="true" set via DOM ref — no setState needed */
        .hero-slider[data-ready='true'] {
          opacity: 1;
        }

        .hero-slide {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.55s ease;
          pointer-events: none;
        }
        .hero-slide--active {
          opacity: 1;
          pointer-events: auto;
        }

        .hero-img-wrap { position: absolute; inset: 0; }
        .hero-img { object-fit: cover; }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(to right, rgba(9,9,15,0.82) 0%, rgba(9,9,15,0.42) 55%, rgba(9,9,15,0.12) 100%),
            linear-gradient(to top,   rgba(9,9,15,0.55) 0%, transparent 55%);
        }

        .hero-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          height: 100%;
          padding: clamp(16px, 4vw, 36px) clamp(16px, 5vw, 48px);
          max-width: 580px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.18);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: rgba(255,255,255,0.88);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 5px 11px;
          border-radius: 99px;
          width: fit-content;
          margin-bottom: 12px;
        }
        .hero-badge-dot {
          width: 5px; height: 5px;
          background: var(--hero-gold);
          border-radius: 99px;
          animation: heroPulse 2s ease infinite;
        }
        @keyframes heroPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.45; transform: scale(0.65); }
        }

        .hero-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(1.6rem, 5.5vw, 3rem);
          font-weight: 800;
          line-height: 1.1;
          color: #fff;
          letter-spacing: -0.025em;
          margin: 0 0 10px;
          text-shadow: 0 2px 20px rgba(0,0,0,0.25);
        }

        .hero-desc {
          font-size: clamp(11.5px, 2.5vw, 14.5px);
          color: rgba(255,255,255,0.65);
          margin: 0 0 20px;
          line-height: 1.5;
        }

        .hero-cta { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

        .hero-cta-primary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--hero-grad);
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          padding: 11px 20px;
          border-radius: 99px;
          text-decoration: none;
          white-space: nowrap;
          box-shadow: 0 4px 18px rgba(79,70,229,0.4);
          transition: transform 0.15s, box-shadow 0.15s;
          letter-spacing: 0.01em;
        }
        .hero-cta-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(79,70,229,0.55);
        }
        .hero-cta-primary:active { transform: translateY(0); }

        .hero-cta-icon { width: 15px; height: 15px; transition: transform 0.2s; }
        .hero-cta-primary:hover .hero-cta-icon { transform: translateX(3px); }

        .hero-cta-secondary {
          display: inline-flex;
          align-items: center;
          padding: 11px 16px;
          background: rgba(255,255,255,0.09);
          border: 1px solid rgba(255,255,255,0.2);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: rgba(255,255,255,0.8);
          font-size: 13px;
          font-weight: 600;
          border-radius: 99px;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
        }
        .hero-cta-secondary:hover {
          background: rgba(255,255,255,0.16);
          border-color: rgba(255,255,255,0.32);
          color: #fff;
        }

        .hero-dots {
          position: absolute;
          bottom: 14px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 20;
          display: flex;
          gap: 6px;
        }
        .hero-dot {
          height: 5px;
          border-radius: 99px;
          background: rgba(255,255,255,0.28);
          border: none;
          cursor: pointer;
          transition: width 0.35s ease, background 0.35s ease;
          width: 5px;
          padding: 0;
        }
        .hero-dot--on {
          width: 26px;
          background: var(--hero-grad);
        }
      `}</style>

      <section className="hero-root" aria-label="Hero carousel">
        <div
          ref={sliderRef}
          className="hero-slider"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {slides.map((s, i) => (
            <div
              key={s.id}
              aria-hidden={i !== current}
              className={`hero-slide${i === current ? ' hero-slide--active' : ''}`}
            >
              <div className="hero-img-wrap">
                <Image
                  src={s.image_url}
                  alt={s.title ?? 'Banner image'}
                  fill
                  priority={i === 0}
                  className="hero-img"
                  sizes="100vw"
                />
                <div className="hero-overlay" />
              </div>

              <div className="hero-content">
                {s.subtitle && (
                  <span className="hero-badge">
                    <span className="hero-badge-dot" />
                    {s.subtitle}
                  </span>
                )}

                <h1 className="hero-title">{s.title}</h1>

                {s.description && (
                  <p className="hero-desc">{s.description}</p>
                )}

                <div className="hero-cta">
                  <Link
                    href={s.link_url ?? '/products'}
                    className="hero-cta-primary"
                  >
                    <span>{s.link_text ?? s.button_text ?? 'Shop Now'}</span>
                    <ArrowRight className="hero-cta-icon" />
                  </Link>
                  <Link href="/products" className="hero-cta-secondary">
                    Browse All
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {totalSlides > 1 && (
            <div className="hero-dots" role="tablist" aria-label="Slide indicators">
              {slides.map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === current}
                  onClick={() => setCurrent(i)}
                  className={`hero-dot${i === current ? ' hero-dot--on' : ''}`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default Hero;