// lib/seo/jsonld.ts
// Schema.org structured data (JSON-LD) used across the storefront.
// Everything is plain objects so pages can pass them straight to <JsonLd />.

import { site } from '@/lib/site';
import { metaNumber } from '@/lib/utils';
import type { BlogPost, Category, Product } from '@/types';

export const CURRENCY = site.currency;

function absolute(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${site.url.replace(/\/$/, '')}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

/** Drop null/undefined/empty values so Google never sees "price": null. */
function clean<T extends Record<string, unknown>>(input: T): T {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    output[key] = value;
  }
  return output as T;
}

export function organizationSchema() {
  return clean({
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': `${site.url}/#organization`,
    name: site.nameFull,
    alternateName: site.name,
    url: site.url,
    description: site.description,
    telephone: `+${site.whatsapp}`,
    email: site.email,
    currenciesAccepted: CURRENCY,
    paymentAccepted: 'Cash on delivery, Mobile Money, Bank transfer',
    areaServed: { '@type': 'Country', name: site.areaServed },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Accra',
      addressRegion: 'Greater Accra',
      addressCountry: 'GH',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: `+${site.whatsapp}`,
        contactType: 'customer service',
        areaServed: 'GH',
        availableLanguage: ['en'],
      },
    ],
  });
}

export function websiteSchema() {
  return clean({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    name: site.nameFull,
    url: site.url,
    publisher: { '@id': `${site.url}/#organization` },
    inLanguage: 'en-GH',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${site.url}/products?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  });
}

export interface Crumb {
  name: string;
  href: string;
}

export function breadcrumbSchema(crumbs: Crumb[]) {
  return clean({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absolute(crumb.href),
    })),
  });
}

export function productSchema(product: Product) {
  const images = [product.thumbnail, ...(product.images ?? [])]
    .filter((image): image is string => Boolean(image))
    .map(absolute);

  const inStock = product.stock_quantity > 0;
  const priceValidUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * 60)
    .toISOString()
    .slice(0, 10);

  return clean({
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${absolute(`/products/${product.slug}`)}#product`,
    name: product.name,
    description: product.description ?? product.short_description ?? undefined,
    image: [...new Set(images)],
    sku: product.sku ?? product.id,
    category: product.category?.name,
    brand: { '@type': 'Brand', name: product.brand ?? site.name },
    url: absolute(`/products/${product.slug}`),
    offers: {
      '@type': 'Offer',
      url: absolute(`/products/${product.slug}`),
      priceCurrency: CURRENCY,
      price: Number(product.price).toFixed(2),
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      priceValidUntil,
      seller: { '@id': `${site.url}/#organization` },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: CURRENCY,
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' },
        },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'GH' },
      },
    },
    ...(product.reviews_count && product.reviews_count > 0 && product.rating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Number(product.rating).toFixed(1),
            reviewCount: product.reviews_count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  });
}

export function itemListSchema(
  products: Product[],
  options: { name: string; url: string; description?: string }
) {
  return clean({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: options.name,
    description: options.description,
    numberOfItems: products.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: products.slice(0, 30).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absolute(`/products/${product.slug}`),
      name: product.name,
      image: product.thumbnail ? absolute(product.thumbnail) : undefined,
    })),
  });
}

export function collectionPageSchema(options: {
  name: string;
  description?: string;
  url: string;
  products: Product[];
}) {
  return clean({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${absolute(options.url)}#collection`,
    name: options.name,
    description: options.description,
    url: absolute(options.url),
    isPartOf: { '@id': `${site.url}/#website` },
    mainEntity: itemListSchema(options.products, {
      name: options.name,
      url: options.url,
      description: options.description,
    }),
  });
}

export function categorySchema(category: Category, products: Product[]) {
  return collectionPageSchema({
    name: category.name,
    description: category.description ?? undefined,
    url: `/categories/${category.slug}`,
    products,
  });
}

export function blogPostingSchema(post: BlogPost, url?: string) {
  const postUrl = url ?? `/blog/${post.slug}`;
  return clean({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${absolute(postUrl)}#article`,
    headline: post.title,
    description: post.seo_description ?? post.excerpt ?? undefined,
    image: post.cover_image ? [absolute(post.cover_image)] : undefined,
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at ?? post.published_at ?? post.created_at,
    author: { '@type': 'Person', name: post.author_name },
    publisher: { '@id': `${site.url}/#organization` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': absolute(postUrl) },
    articleSection: post.category ?? undefined,
    keywords: (post.tags ?? []).join(', ') || undefined,
    wordCount: post.content ? post.content.split(/\s+/).length : undefined,
    isPartOf: { '@id': `${site.url}/#website` },
  });
}

export function blogSchema(posts: BlogPost[]) {
  return clean({
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${site.url}/blog#blog`,
    name: `The ${site.name} Journal`,
    description: `Skincare, hair care and baby care advice from the ${site.nameFull} team in Ghana.`,
    url: `${site.url}/blog`,
    publisher: { '@id': `${site.url}/#organization` },
    blogPost: posts.slice(0, 20).map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: absolute(`/blog/${post.slug}`),
      datePublished: post.published_at ?? post.created_at,
      author: { '@type': 'Person', name: post.author_name },
      ...(post.cover_image ? { image: absolute(post.cover_image) } : {}),
    })),
  });
}

export function contactPageSchema() {
  return clean({
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${site.url}/contact#contact`,
    name: `Contact ${site.nameFull}`,
    url: `${site.url}/contact`,
    mainEntity: {
      '@type': 'OnlineStore',
      name: site.nameFull,
      telephone: `+${site.whatsapp}`,
      email: site.email,
      url: site.url,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Accra',
        addressRegion: 'Greater Accra',
        addressCountry: 'GH',
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          opens: '08:00',
          closes: '19:00',
        },
      ],
    },
  });
}

export function aboutPageSchema() {
  return clean({
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${site.url}/about#about`,
    name: `About ${site.nameFull}`,
    url: `${site.url}/about`,
    mainEntity: { '@id': `${site.url}/#organization` },
  });
}

/** Convenience: the rating shown on cards, kept in one place. */
export function productRating(product: Product) {
  return metaNumber(product.metadata, 'rating', product.rating ?? 0);
}
