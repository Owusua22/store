// src/components/layout/Footer.tsx
import Link from 'next/link';
import { Icons, type Icon } from "@/components/icons";

const FOOTER_LINKS = {
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
  
  ],
  Support: [
    { label: 'Account', href: '/account' },
    { label: 'My orders', href: '/orders' },
    { label: 'My wishlist', href: '/wishlist' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
} as const;

const SOCIAL_LINKS: Array<{ name: string; href: string; icon: Icon }> = [
  { name: 'Instagram', href: 'https://instagram.com', icon: Icons.instagram },
  { name: 'Twitter', href: 'https://twitter.com', icon: Icons.twitter },
  { name: 'Facebook', href: 'https://facebook.com', icon: Icons.facebook },
];

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="mx-auto max-w-7xl px-1 sm:px-6 lg:px-8">

        {/* Brand + nav — stacked on mobile, side-by-side on md+ */}
        <div className="py-4 sm:py-4 border-b border-white/10 space-y-6 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-8">

          {/* Brand */}
          <div className="sm:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2 text-base font-bold text-white">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-purple-600">
                <Icons.logo className="h-3.5 w-3.5" />
              </span>
              Sally
            </Link>
           
          </div>

          {/* Nav links — always 3-col grid (compact on mobile) */}
          <div className="grid grid-cols-3 gap-4 sm:col-span-8 sm:gap-8">
            {Object.entries(FOOTER_LINKS).map(([title, links]) => (
              <div key={title}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white">
                  {title}
                </h3>
                <ul className="space-y-1.5">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-xs transition-colors hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between gap-3 py-4">
          <p className="text-xs">
            &copy; {new Date().getFullYear()} Sally. All Rights Reserved.
          </p>
          <div className="flex items-center gap-4">
            {SOCIAL_LINKS.map(({ name, href, icon: IconComponent }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 transition-colors hover:text-white"
                aria-label={`Visit our ${name} page`}
              >
                <IconComponent className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}