'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import type { Category } from '@/types';
interface CategoriesProps {
  categories: Category[];
}
interface CategoryWithImage extends Category {
  image_url?: string;
}
export function CategoriesComponent({ categories }: CategoriesProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    // Small delay to ensure DOM is ready, then mark as loaded
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);
  if (!categories?.length) return null;
  const displayed = categories.slice(0, 10) as CategoryWithImage[];
  return (
    <section
      aria-labelledby="categories-heading"
      className="cat-root"
      style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.5s ease' }}
    >
      <div className="cat-inner">
        {/* Header */}
        <header className="cat-header">
          <div className="cat-badge">
            <span className="cat-badge-dot" />
            <span>Browse Categories</span>
          </div>
          <h2 id="categories-heading" className="cat-heading">
            Shop by{' '}
            <span className="cat-heading-accent">Category</span>
          </h2>
        </header>
        {/* Horizontal scroll strip */}
        <div className="cat-scroll-wrap">
          <div className="cat-scroll-track">
            {displayed.map((category, index) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="cat-item"
                style={{
                  animationDelay: `${index * 60}ms`,
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? 'translateY(0)' : 'translateY(12px)',
                  transition: `opacity 0.4s ease ${index * 60}ms, transform 0.4s ease ${index * 60}ms`,
                }}
              >
                {/* Circle */}
                <div className="cat-circle">
                  {category.image_url ? (
                    <Image
                      src={category.image_url}
                      alt={category.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 72px, 110px"
                    />
                  ) : (
                    <span className="cat-icon">
                      {category.icon ?? '📦'}
                    </span>
                  )}
                  {/* Hover ring */}
                  <span className="cat-ring" aria-hidden="true" />
                </div>
                {/* Label */}
                <span className="cat-label">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        /* ── Tokens ── */
        .cat-root {
          --cat-from:   #4f46e5;
          --cat-mid:    #7c3aed;
          --cat-to:     #ec4899;
          --cat-grad:   linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%);
          --cat-gold:   #f59e0b;
          position: relative;
          width: 100%;
          overflow: hidden;
          background: #fff;
        }
        .cat-inner {
          max-width: 1980px;
          margin: 0 auto;
          padding: 20px 14px 16px;
        }
        @media (min-width: 640px) {
          .cat-inner { padding: 32px 24px 24px; }
        }
        @media (min-width: 1024px) {
          .cat-inner { padding: 40px 48px 32px; }
        }
        /* ── Header ── */
        .cat-header { margin-bottom: 16px; }
        @media (min-width: 640px) { .cat-header { margin-bottom: 20px; } }
        .cat-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #eef2ff;
          border: 1px solid #c7d2fe;
          border-radius: 99px;
          padding: 4px 10px;
          margin-bottom: 10px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--cat-from);
        }
        .cat-badge-dot {
          width: 6px; height: 6px;
          border-radius: 99px;
          background: var(--cat-from);
          animation: catPulse 2s ease infinite;
        }
        @keyframes catPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.65); }
        }
        .cat-heading {
          font-size: clamp(1.35rem, 4.5vw, 2.25rem);
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #111827;
          margin: 0;
          line-height: 1.15;
        }
        .cat-heading-accent {
          background: var(--cat-grad);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        /* ── Scroll strip ── */
        .cat-scroll-wrap {
          margin: 0 -14px;
          padding: 0 14px;
          overflow: hidden;
        }
        @media (min-width: 640px) {
          .cat-scroll-wrap { margin: 0 -24px; padding: 0 24px; }
        }
        .cat-scroll-track {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          overflow-y: hidden;
          padding-bottom: 10px;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          -ms-overflow-style: none;
          /* KEY FIX: ensure the track has a defined width and doesn't collapse */
          width: 100%;
          min-width: 0;
          /* KEY FIX: prevent flex items from shrinking below their min-width */
          flex-shrink: 0;
        }
        .cat-scroll-track::-webkit-scrollbar { display: none; }
        @media (min-width: 640px) { .cat-scroll-track { gap: 20px; } }
        @media (min-width: 1024px) { .cat-scroll-track { gap: 28px; } }
        /* ── Individual item ── */
        .cat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-decoration: none;
          scroll-snap-align: start;
          /* KEY FIX: flex-shrink: 0 is set unconditionally so items never collapse */
          flex-shrink: 0;
          min-width: 72px;
          /* KEY FIX: prevent text wrapping issues */
          white-space: nowrap;
        }
        @media (min-width: 640px) { .cat-item { min-width: 100px; } }
        @media (min-width: 1024px) { .cat-item { min-width: 110px; } }
        /* ── Circle ── */
        .cat-circle {
          position: relative;
          overflow: hidden;
          border-radius: 99px;
          background: #f5f3ff;
          margin-bottom: 8px;
          transition: transform 0.22s ease, box-shadow 0.22s ease;
          width: 66px;
          height: 66px;
        }
        @media (min-width: 640px) {
          .cat-circle { width: 96px; height: 96px; margin-bottom: 10px; }
        }
        @media (min-width: 1024px) {
          .cat-circle { width: 110px; height: 110px; }
        }
        .cat-item:hover .cat-circle {
          transform: translateY(-3px) scale(1.04);
          box-shadow: 0 8px 24px rgba(79, 70, 229, 0.22);
        }
        /* Gradient ring that appears on hover */
        .cat-ring {
          position: absolute;
          inset: -2px;
          border-radius: 99px;
          background: var(--cat-grad);
          opacity: 0;
          transition: opacity 0.22s ease;
          z-index: 0;
        }
        /* Push the image above the ring */
        .cat-circle img,
        .cat-icon {
          position: relative;
          z-index: 1;
        }
        .cat-item:hover .cat-ring { opacity: 1; }
        /* When ring is visible, shrink content inward so ring acts as a border */
        .cat-item:hover .cat-circle img {
          outline: 3px solid #fff;
          outline-offset: -3px;
          border-radius: 99px;
        }
        /* Icon (emoji fallback) */
        .cat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          font-size: 1.5rem;
        }
        @media (min-width: 640px) { .cat-icon { font-size: 2rem; } }
        @media (min-width: 1024px) { .cat-icon { font-size: 2.4rem; } }
        /* ── Label ── */
        .cat-label {
          text-align: center;
          font-weight: 600;
          color: #111827;
          transition: color 0.15s;
          line-height: 1.3;
          font-size: 10px;
          max-width: 72px;
        }
        @media (min-width: 640px) {
          .cat-label { font-size: 12px; max-width: 100px; }
        }
        @media (min-width: 1024px) {
          .cat-label { font-size: 13px; max-width: 110px; }
        }
        .cat-item:hover .cat-label { color: var(--cat-from); }
      `}</style>
    </section>
  );
}
export default CategoriesComponent;