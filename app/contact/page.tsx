import type { Metadata } from 'next';
import {
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Truck,
  Wallet,
} from 'lucide-react';
import { ContactForm } from '@/components/contact/ContactForm';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact us',
  description:
    'Talk to the Sally team about orders, delivery, products or returns. Call, WhatsApp or send a message.',
};

export default function ContactPage() {
  const details = [
    {
      icon: Phone,
      title: 'Call us',
      value: site.phoneDisplay,
      href: `tel:${site.phone}`,
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      value: site.phoneDisplay,
      href: `https://wa.me/${site.whatsapp}`,
    },
    {
      icon: Mail,
      title: 'Email',
      value: site.email,
      href: `mailto:${site.email}`,
    },
    { icon: MapPin, title: 'Location', value: site.address, href: undefined },
    {
      icon: Clock,
      title: 'Opening hours',
      value: 'Mon – Sat, 8:00am – 6:00pm',
      href: undefined,
    },
  ];

  return (
    <div className="container-page py-6 sm:py-8">
      <div className="rounded-xl border border-line bg-brand-soft p-5 sm:p-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-brand">
          <Mail className="h-3 w-3" /> Help Center
        </span>
        <h1 className="mt-2 text-[24px] font-extrabold tracking-tight text-ink sm:text-[28px]">
          We&apos;re here to help
        </h1>
        <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-gray-600">
          Questions about an order, delivery timelines, product recommendations or returns?
          Reach us on WhatsApp for the fastest reply, or send a message below.
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className="panel p-5 lg:col-span-3">
          <h2 className="text-[15px] font-extrabold text-ink">Send us a message</h2>
          <p className="mt-0.5 text-[11.5px] text-muted">
            We usually reply within a few hours during business hours.
          </p>
          <div className="mt-4">
            <ContactForm />
          </div>
        </div>

        <div className="space-y-3 lg:col-span-2">
          <div className="panel p-5">
            <h2 className="text-[15px] font-extrabold text-ink">Contact details</h2>
            <ul className="mt-3 space-y-3">
              {details.map(({ icon: Icon, title, value, href }) => (
                <li key={title} className="flex items-start gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted">
                      {title}
                    </p>
                    {href ? (
                      <a
                        href={href}
                        target={href.startsWith('http') ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="break-words text-[12.5px] font-semibold text-ink hover:text-brand"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="text-[12.5px] font-semibold text-ink">{value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel p-5">
            <h2 className="text-[13px] font-extrabold text-ink">Delivery & payment</h2>
            <ul className="mt-2 space-y-2 text-[12px] text-gray-600">
              <li className="flex items-center gap-2">
                <Truck className="h-4 w-4 shrink-0 text-brand" />
                Nationwide delivery in 1–4 business days
              </li>
              <li className="flex items-center gap-2">
                <Wallet className="h-4 w-4 shrink-0 text-brand" />
                Pay on delivery, MoMo or card
              </li>
            </ul>
          </div>

          <a
            href={`https://wa.me/${site.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#1faa59] py-3 text-[13px] font-extrabold text-white transition-colors hover:bg-[#178a47]"
          >
            <MessageCircle className="h-4 w-4" />
            Chat with us on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
