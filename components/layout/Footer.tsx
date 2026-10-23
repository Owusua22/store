import Link from 'next/link';
import {
  Clock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
  Wallet,
} from 'lucide-react';
import { FaFacebookF, FaInstagram, FaXTwitter } from 'react-icons/fa6';
import { NewsletterForm } from '@/components/layout/NewsletterForm';
import { NAV_CATEGORIES, site, USEFUL_LINKS } from '@/lib/site';

const SERVICE_LINKS = [
  { label: 'My account', href: '/account' },
  { label: 'Track my order', href: '/orders' },
  { label: 'Shipping & delivery', href: '/contact' },
  { label: 'Returns & refunds', href: '/contact' },
  { label: 'Help Center', href: '/contact' },
] as const;

export function Footer() {
  return (
    <footer className="mt-10 border-t-[3px] border-brand bg-[#fafafa] pb-16 md:pb-0">
      {/* Value props */}
      <div className="border-b border-line bg-white">
        <div className="container-page grid grid-cols-2 gap-x-4 gap-y-5 py-6 md:grid-cols-4">
          {[
            {
              icon: Truck,
              title: 'Nationwide delivery',
              copy: 'Accra, Kumasi, Takoradi & beyond',
            },
            {
              icon: Wallet,
              title: 'Pay on delivery',
              copy: 'Cash or MoMo when it arrives',
            },
            {
              icon: ShieldCheck,
              title: '100% authentic',
              copy: 'Sourced from trusted brands',
            },
            {
              icon: Clock,
              title: 'Fast support',
              copy: 'WhatsApp replies in minutes',
            },
          ].map(({ icon: Icon, title, copy }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <div>
                <p className="text-[12.5px] font-bold text-ink">{title}</p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-muted">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-page grid gap-8 py-9 md:grid-cols-12 md:gap-6">
        {/* Brand */}
        <div className="md:col-span-4">
          <Link href="/" className="inline-flex items-baseline gap-1.5">
            <span className="text-[24px] font-extrabold tracking-tight text-brand">
              {site.name.toLowerCase()}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted">
              {site.tagline}
            </span>
          </Link>

          <p className="mt-3 max-w-sm text-[12.5px] leading-relaxed text-gray-600">
            {site.description}
          </p>

          <div className="mt-4 space-y-2 text-[12.5px] text-gray-600">
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              {site.address}
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-brand" />
              <a href={`tel:${site.phone}`} className="hover:text-brand">
                {site.phoneDisplay}
              </a>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-brand" />
              <a href={`mailto:${site.email}`} className="hover:text-brand">
                {site.email}
              </a>
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {[
              { icon: FaInstagram, href: 'https://instagram.com', label: 'Instagram' },
              { icon: FaFacebookF, href: 'https://facebook.com', label: 'Facebook' },
              { icon: FaXTwitter, href: 'https://twitter.com', label: 'X / Twitter' },
            ].map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-gray-600 transition-colors hover:border-brand hover:text-brand"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Shop */}
        <div className="md:col-span-2">
          <h3 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink">
            Shop
          </h3>
          <ul className="space-y-2">
            {NAV_CATEGORIES.slice(0, 6).map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/categories/${category.slug}`}
                  className="text-[12.5px] text-gray-600 transition-colors hover:text-brand"
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/products" className="text-[12.5px] font-bold text-brand hover:underline">
                View all products
              </Link>
            </li>
          </ul>
        </div>

        {/* Help */}
        <div className="md:col-span-2">
          <h3 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink">
            Customer Service
          </h3>
          <ul className="space-y-2">
            {SERVICE_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-[12.5px] text-gray-600 transition-colors hover:text-brand"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company + newsletter */}
        <div className="md:col-span-4">
          <h3 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink">
            Company
          </h3>
          <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-2">
            {USEFUL_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-[12.5px] text-gray-600 transition-colors hover:text-brand"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <p className="mb-2 text-[12.5px] font-bold text-ink">
            Get deals in your inbox
          </p>
          <p className="mb-3 text-[11.5px] leading-relaxed text-muted">
            Join our list for restock alerts, skincare tips and up to 30% off.
          </p>
          <NewsletterForm />
        </div>
      </div>

      {/* Payment strip */}
      <div className="border-t border-line bg-white">
        <div className="container-page flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-muted">We accept:</span>
            {['MTN MoMo', 'Telecel Cash', 'Visa', 'Mastercard', 'Cash on delivery'].map(
              (label) => (
                <span
                  key={label}
                  className="rounded border border-line bg-white px-2 py-1 text-[10.5px] font-bold text-gray-600"
                >
                  {label}
                </span>
              )
            )}
          </div>
          <p className="text-[11px] text-muted">{site.currencyNote}</p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-line">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-4 text-center md:flex-row md:text-left">
          <p className="text-[11.5px] text-gray-500">
            © {new Date().getFullYear()} {site.nameFull}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-[11.5px] text-gray-500">
            <Link href="/about" className="hover:text-brand">
              About
            </Link>
            <Link href="/contact" className="hover:text-brand">
              Contact
            </Link>
            <Link href="/products" className="hover:text-brand">
              Shop
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
