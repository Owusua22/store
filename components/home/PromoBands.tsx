import Image from 'next/image';
import Link from 'next/link';
import { site } from '@/lib/site';
import { formatCedis } from '@/lib/utils';

/** A quiet line of plain facts. No icons in circles, no shadows. */
export function ValueStrip() {
  const facts = [
    'Everything genuine — no copies, no expired stock',
    `Free delivery over ${formatCedis(site.freeDeliveryThreshold)}`,
    'Pay by MoMo or cash on delivery',
  ];

  return (
    <section className="container-page pt-8 sm:pt-10">
      <div className="flex flex-col gap-2 border-y border-line py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        {facts.map((fact) => (
          <p
            key={fact}
            className="text-[11.5px] leading-snug tracking-[0.01em] text-sage-deep sm:text-[12.5px]"
          >
            {fact}
          </p>
        ))}
      </div>
    </section>
  );
}

/** Two photo plates, captions below the image rather than printed on it. */
export function PromoBands() {
  const plates = [
    {
      href: '/categories/bath-body-care',
      image: '/images/products/body-lotion.webp',
      alt: 'Body lotions on the shelf',
      kicker: 'Body, all day',
      title: 'Shea, cocoa and the everyday lotions',
      copy: 'Thick enough for harmattan, light enough for the morning rush.',
    },
    {
      href: '/categories/baby-care-essentials',
      image: '/images/products/baby-diapers.webp',
      alt: 'Baby essentials on the shelf',
      kicker: 'For the little one',
      title: 'Washes, creams and the jumbo diaper packs',
      copy: 'The things you run out of at 9pm, kept in stock.',
    },
  ];

  return (
    <section
      className="container-page grid gap-6 pt-9 sm:grid-cols-2 sm:gap-7 sm:pt-12"
      aria-label="Departments"
    >
      {plates.map((plate) => (
        <Link key={plate.href} href={plate.href} className="group block">
          <span className="relative block aspect-[16/10] overflow-hidden bg-paper-deep">
            <Image
              src={plate.image}
              alt={plate.alt}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          </span>
          <span className="mt-3 block border-t border-line pt-3">
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-sage-deep">
              {plate.kicker}
            </span>
            <span className="mt-1.5 block font-serif text-[20px] leading-snug text-ink group-hover:text-sage-deep sm:text-[23px]">
              {plate.title}
            </span>
            <span className="mt-1 block text-[12.5px] leading-relaxed text-muted">
              {plate.copy}
            </span>
          </span>
        </Link>
      ))}
    </section>
  );
}

/** A single ruled band of type — no photography, no scrim, no button shadow. */
export function DealBanner() {
  return (
    <section className="container-page pt-10 sm:pt-14">
      <div className="flex flex-col gap-4 border-y-2 border-sage-deep py-6 sm:flex-row sm:items-center sm:justify-between sm:py-7">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sage-deep">
            This week
          </p>
          <h2 className="mt-2 max-w-[24ch] font-serif text-[26px] leading-[1.12] text-ink sm:text-[34px]">
            Up to forty percent off the things you buy twice a month.
          </h2>
        </div>
        <Link
          href="/products?deals=1"
          className="btn-ink h-11 shrink-0 px-6 text-[12px] uppercase tracking-[0.12em]"
        >
          See what is reduced
        </Link>
      </div>
    </section>
  );
}
