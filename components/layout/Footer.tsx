import Link from 'next/link';
import { FaFacebookF, FaInstagram, FaXTwitter } from 'react-icons/fa6';
import { NewsletterForm } from '@/components/layout/NewsletterForm';
import { NAV_CATEGORIES, site, USEFUL_LINKS } from '@/lib/site';

const SERVICE_LINKS = [
  { label: 'My account', href: '/account' },
  { label: 'Track an order', href: '/orders' },
  { label: 'Delivery rates', href: '/location#delivery' },
  { label: 'Payment methods', href: '/policies#payment' },
  { label: 'Returns & exchanges', href: '/policies#returns' },
  { label: 'Privacy (Act 843)', href: '/policies#privacy' },
  { label: 'Help', href: '/contact' },
] as const;

/**
 * Footer as a colophon: the shop's particulars set plainly, then the index.
 * No icon cards, no gradient strip.
 */
export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-paper-deep pb-16 md:pb-0">
      <div className="container-page grid gap-9 py-10 sm:grid-cols-2 md:grid-cols-12 md:gap-7 md:py-12">
        {/* The shop */}
        <div className="md:col-span-5">
          <p className="font-serif text-[26px] leading-none tracking-[-0.02em] text-ink">
            Glow<span className="text-sage-deep">-</span>Up
          </p>
          <p className="mt-2 text-[9.5px] font-bold uppercase tracking-[0.26em] text-muted">
            Skincare &amp; mother care
          </p>

          <p className="mt-4 max-w-[38ch] text-[12.5px] leading-relaxed text-gray-700">
            A small shop for genuine skincare, body care, haircare and mother-and-baby
            essentials. Open six and a half days a week.
          </p>

          <div className="mt-4 space-y-1.5 text-[12px] text-gray-700">
            <p>{site.address}</p>
            <p>{site.hoursSummary}</p>
            <p>
              <a href={`tel:${site.phone}`} className="font-semibold text-sage-deep hover:underline">
                {site.phoneDisplay}
              </a>
              <span className="mx-2 text-line">/</span>
              <a
                href={`mailto:${site.email}`}
                className="text-sage-deep hover:underline"
              >
                {site.email}
              </a>
            </p>
          </div>

          <div className="mt-4 flex items-center gap-3">
            {[
              { icon: FaInstagram, href: 'https://instagram.com', label: 'Instagram' },
              { icon: FaFacebookF, href: 'https://facebook.com', label: 'Facebook' },
              { icon: FaXTwitter, href: 'https://twitter.com', label: 'X' },
            ].map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-7 w-7 items-center justify-center border border-line text-muted transition-colors hover:border-sage-deep hover:text-sage-deep"
              >
                <Icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>

        {/* Departments */}
        <div className="md:col-span-3">
          <h3 className="mb-3 text-[9.5px] font-bold uppercase tracking-[0.2em] text-muted">
            Departments
          </h3>
          <ul className="space-y-1.5">
            {NAV_CATEGORIES.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/categories/${category.slug}`}
                  className="text-[12.5px] text-gray-700 transition-colors hover:text-sage-deep"
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/products"
                className="text-[12.5px] font-semibold text-sage-deep hover:underline"
              >
                Everything
              </Link>
            </li>
          </ul>
        </div>

        {/* Service + company */}
        <div className="md:col-span-2">
          <h3 className="mb-3 text-[9.5px] font-bold uppercase tracking-[0.2em] text-muted">
            Service
          </h3>
          <ul className="space-y-1.5">
            {SERVICE_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-[12.5px] text-gray-700 transition-colors hover:text-sage-deep"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-4 space-y-1.5">
            {USEFUL_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-[12.5px] text-gray-700 transition-colors hover:text-sage-deep"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* List */}
        <div className="md:col-span-2">
          <h3 className="mb-3 text-[9.5px] font-bold uppercase tracking-[0.2em] text-muted">
            The occasional note
          </h3>
          <p className="mb-3 text-[11.5px] leading-relaxed text-gray-700">
            Restocks and price drops. One message when there is something worth saying.
          </p>
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-[11px] text-muted">
            © {new Date().getFullYear()} {site.nameFull}. MTN MoMo Pay, cash on delivery,
            48-hour exchange on sealed items.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted">
            <Link href="/sitemap" className="hover:text-sage-deep">
              Sitemap
            </Link>
            <Link href="/policies" className="hover:text-sage-deep">
              Policies
            </Link>
            <Link href="/privacy" className="hover:text-sage-deep">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-sage-deep">
              Terms
            </Link>
            <Link href="/about" className="hover:text-sage-deep">
              About
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
