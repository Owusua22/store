// app/blog/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock, Sparkles } from 'lucide-react';
import { getBlogPosts } from '@/lib/data/blog';
import { BLOG_CATEGORIES, SKIN_TYPES } from '@/lib/skin-types';
import { JsonLd } from '@/components/seo/JsonLd';
import { blogSchema, breadcrumbSchema } from '@/lib/seo/jsonld';

export const metadata: Metadata = {
  title: 'Journal — skin care tips & routines',
  description:
    'Routines, ingredient guides and baby skin advice from the Glow-Up Skincare team in Ghana.',
};

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ category?: string; skin?: string }>;
}

function formatDate(value: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default async function BlogIndexPage({ searchParams }: Props) {
  const params = await searchParams;
  const category = params.category;
  const skinType = params.skin;

  const posts = await getBlogPosts({ category, skinType });
  const [featured, ...rest] = posts;

  return (
    <main className="min-h-screen bg-white">
      <JsonLd
        id="blog"
        data={[
          blogSchema(posts),
          breadcrumbSchema([
            { name: 'Home', href: '/' },
            { name: 'Journal', href: '/blog' },
          ]),
        ]}
      />
      <section className="border-b border-line bg-surface-soft">
        <div className="container-page py-10 sm:py-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand">
            <Sparkles className="h-3.5 w-3.5" />
            The Glow-Up Journal
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-ink sm:text-[42px]">
            Skin care advice that actually applies to Ghana
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-gray-600">
            Harmattan routines, dark spot guides, ingredient explainers and gentle baby
            care — written by our team for real skin in real weather.
          </p>

          <div className="mt-6 flex flex-wrap gap-1.5">
            <Link
              href="/blog"
              className={`rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors ${
                !category && !skinType
                  ? 'border-brand bg-brand text-white'
                  : 'border-line bg-white text-gray-600 hover:border-brand/60'
              }`}
            >
              All articles
            </Link>
            {BLOG_CATEGORIES.map((item) => (
              <Link
                key={item}
                href={`/blog?category=${encodeURIComponent(item)}`}
                className={`rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors ${
                  category === item
                    ? 'border-brand bg-brand text-white'
                    : 'border-line bg-white text-gray-600 hover:border-brand/60'
                }`}
              >
                {item}
              </Link>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {SKIN_TYPES.map((type) => (
              <Link
                key={type.value}
                href={`/blog?skin=${type.value}`}
                className={`rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors ${
                  skinType === type.value
                    ? 'border-brand bg-brand text-white'
                    : 'border-line bg-white text-gray-600 hover:border-brand/60'
                }`}
              >
                {type.emoji} {type.label} skin
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container-page py-10">
        {posts.length === 0 ? (
          <div className="panel p-12 text-center">
            <p className="text-sm font-semibold text-ink">No articles yet.</p>
            <p className="mt-1 text-[13px] text-muted">
              Try another category or skin type.
            </p>
          </div>
        ) : (
          <>
            {featured ? (
              <Link
                href={`/blog/${featured.slug}`}
                className="group grid overflow-hidden rounded-2xl border border-line bg-white md:grid-cols-2"
              >
                <div className="relative aspect-[16/10] md:aspect-auto md:h-full">
                  <Image
                    src={featured.cover_image ?? '/images/products/body-lotion.webp'}
                    alt={featured.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col justify-center p-6 sm:p-10">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-brand">
                    <span>{featured.category ?? 'Journal'}</span>
                    <span className="text-gray-300">•</span>
                    <span className="inline-flex items-center gap-1 text-muted">
                      <Clock className="h-3 w-3" /> {featured.read_minutes} min read
                    </span>
                  </div>
                  <h2 className="mt-3 text-2xl font-black leading-tight text-ink group-hover:text-brand sm:text-[30px]">
                    {featured.title}
                  </h2>
                  <p className="mt-3 text-[14px] leading-relaxed text-gray-600">
                    {featured.excerpt}
                  </p>
                  <div className="mt-5 flex items-center justify-between text-[12px] text-muted">
                    <span>{formatDate(featured.published_at)}</span>
                    <span className="inline-flex items-center gap-1 font-bold text-brand">
                      Read article <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ) : null}

            {rest.length > 0 ? (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-lg hover:shadow-black/5"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-surface-soft">
                      <Image
                        src={post.cover_image ?? '/images/products/face-cream.webp'}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-brand">
                        <span>{post.category ?? 'Journal'}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-muted">{post.read_minutes} min</span>
                      </div>
                      <h3 className="mt-2 text-[16px] font-extrabold leading-snug text-ink group-hover:text-brand">
                        {post.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-gray-600">
                        {post.excerpt}
                      </p>
                      <div className="mt-auto pt-4 text-[11.5px] text-muted">
                        {formatDate(post.published_at)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
