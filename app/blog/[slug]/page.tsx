// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, Share2 } from 'lucide-react';
import { getBlogPostBySlug, getRelatedBlogPosts } from '@/lib/data/blog';
import { renderBlogHtml, skinTypeLabel } from '@/lib/skin-types';
import { JsonLd } from '@/components/seo/JsonLd';
import { blogPostingSchema, breadcrumbSchema } from '@/lib/seo/jsonld';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: 'Article not found' };

  return {
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: 'article',
      images: post.cover_image ? [{ url: post.cover_image }] : [],
    },
  };
}

function formatDate(value: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post || post.status === 'archived') notFound();

  const related = await getRelatedBlogPosts(post, 3);

  return (
    <>
      <JsonLd
        id="article"
        data={[
          blogPostingSchema(post),
          breadcrumbSchema([
            { name: 'Home', href: '/' },
            { name: 'Journal', href: '/blog' },
            { name: post.title, href: `/blog/${post.slug}` },
          ]),
        ]}
      />
    <main className="min-h-screen bg-white">
      <div className="container-page pt-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted transition-colors hover:text-brand"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to journal
        </Link>
      </div>

      <article className="container-page max-w-3xl py-8">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand">
          <span>{post.category ?? 'Journal'}</span>
          <span className="text-gray-300">•</span>
          <span className="inline-flex items-center gap-1 text-muted">
            <Clock className="h-3 w-3" /> {post.read_minutes} min read
          </span>
        </div>

        <h1 className="mt-3 text-[30px] font-black leading-tight tracking-tight text-ink sm:text-[40px]">
          {post.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-[12.5px] text-muted">
          <span className="font-semibold text-ink">{post.author_name}</span>
          <span className="h-1 w-1 rounded-full bg-gray-300" />
          <span>{formatDate(post.published_at ?? post.created_at)}</span>
          <span className="h-1 w-1 rounded-full bg-gray-300" />
          <span className="inline-flex items-center gap-1">
            <Share2 className="h-3 w-3" /> Share
          </span>
        </div>

        {post.cover_image ? (
          <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl bg-surface-soft">
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        ) : null}

        {post.skin_types.length > 0 ? (
          <div className="mt-6 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
              Best for
            </span>
            {post.skin_types.map((type) => (
              <Link
                key={type}
                href={`/products?skin=${type}`}
                className="rounded-full border border-line bg-surface-soft px-2.5 py-1 text-[11px] font-bold text-gray-600 hover:border-brand/60 hover:text-brand"
              >
                {skinTypeLabel(type)}
              </Link>
            ))}
          </div>
        ) : null}

        <div
          className="blog-body mt-8 text-[15px] leading-[1.8] text-gray-700 [&_blockquote]:my-5 [&_code]:text-brand [&_h2]:mt-9 [&_h2]:mb-3 [&_h2]:text-[22px] [&_h2]:font-black [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-[17px] [&_h3]:font-extrabold [&_h3]:text-ink [&_li]:mb-1.5 [&_li]:ml-5 [&_ol]:my-4 [&_ol]:list-decimal [&_p]:my-4 [&_strong]:text-ink [&_ul]:my-4 [&_ul]:list-disc"
          dangerouslySetInnerHTML={{ __html: renderBlogHtml(post.content) }}
        />

        {post.tags.length > 0 ? (
          <div className="mt-8 flex flex-wrap gap-1.5 border-t border-line pt-5">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                className="rounded-full bg-surface-soft px-2.5 py-1 text-[11px] font-semibold text-gray-600 hover:text-brand"
              >
                #{tag}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-10 rounded-2xl border border-line bg-surface-soft p-6">
          <h2 className="text-[17px] font-extrabold text-ink">Shop the routine</h2>
          <p className="mt-1 text-[13px] text-gray-600">
            Every product mentioned here is in stock and shipped nationwide across Ghana.
          </p>
          <Link
            href="/products?sort=popular"
            className="btn-brand mt-4 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-bold"
          >
            Browse bestsellers
          </Link>
        </div>
      </article>

      {related.length > 0 ? (
        <section className="border-t border-line bg-surface-soft py-10">
          <div className="container-page">
            <h2 className="text-[20px] font-black text-ink">Keep reading</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/blog/${item.slug}`}
                  className="group overflow-hidden rounded-xl border border-line bg-white"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={item.cover_image ?? '/images/products/serum.webp'}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-brand">
                      {item.category ?? 'Journal'}
                    </p>
                    <h3 className="mt-1.5 text-[14.5px] font-extrabold leading-snug text-ink group-hover:text-brand">
                      {item.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
    </>
  );
}
