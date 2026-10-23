import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles, Truck, Wallet } from 'lucide-react';

export function ValueStrip() {
  const items = [
    { icon: Truck, title: 'Nationwide delivery', copy: '2–4 business days' },
    { icon: Wallet, title: 'Pay on delivery', copy: 'Cash or MoMo' },
    { icon: ShieldCheck, title: '100% authentic', copy: 'Verified products' },
    { icon: Sparkles, title: 'Free over GH₵300', copy: 'Selected areas' },
  ];

  return (
    <section className="container-page pt-6">
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-line bg-surface-soft p-3 sm:grid-cols-4 sm:gap-3">
        {items.map(({ icon: Icon, title, copy }) => (
          <div key={title} className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand shadow-sm">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11.5px] font-bold text-ink">{title}</p>
              <p className="truncate text-[10.5px] text-muted">{copy}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PromoBands() {
  return (
    <section className="container-page grid gap-3 pt-7 sm:grid-cols-2 sm:pt-9" aria-label="Promotions">
      <Link
        href="/categories/body-lotions"
        className="group relative flex min-h-[150px] overflow-hidden rounded-xl bg-[#a01118] sm:min-h-[190px]"
      >
        <Image
          src="/images/products/body-lotion.jpg"
          alt="Body lotion offer"
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover opacity-70 transition-transform duration-500 group-hover:scale-105"
          style={{ objectPosition: 'right center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#7c0b11] via-[#a01118]/90 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center p-5">
          <span className="w-fit rounded bg-white/15 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-white">
            Save up to 35%
          </span>
          <h3 className="mt-2 max-w-[16ch] text-[20px] font-extrabold leading-tight text-white sm:text-[24px]">
            Body care for soft, glowing skin
          </h3>
          <p className="mt-1 hidden text-[12px] text-white/75 sm:block">
            Shea lotions, body oils & shower creams
          </p>
          <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-md bg-white px-3.5 py-2 text-[11.5px] font-extrabold text-[#a01118]">
            Shop body care <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </Link>

      <Link
        href="/categories/baby-care"
        className="group relative flex min-h-[150px] overflow-hidden rounded-xl bg-[#115e59] sm:min-h-[190px]"
      >
        <Image
          src="/images/products/baby-diapers.jpg"
          alt="Baby care offer"
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover opacity-70 transition-transform duration-500 group-hover:scale-105"
          style={{ objectPosition: 'right center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d4d49] via-[#115e59]/90 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center p-5">
          <span className="w-fit rounded bg-white/15 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-white">
            Mum favourites
          </span>
          <h3 className="mt-2 max-w-[16ch] text-[20px] font-extrabold leading-tight text-white sm:text-[24px]">
            Gentle care for little ones
          </h3>
          <p className="mt-1 hidden text-[12px] text-white/75 sm:block">
            Jumbo diapers, lotions & tear-free washes
          </p>
          <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-md bg-white px-3.5 py-2 text-[11.5px] font-extrabold text-[#0d4d49]">
            Shop baby care <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </Link>
    </section>
  );
}

export function DealBanner() {
  return (
    <section className="container-page pt-7 sm:pt-9">
      <div className="relative overflow-hidden rounded-xl bg-ink">
        <Image
          src="/images/hero-skincare.jpg"
          alt="Mega deals"
          fill
          sizes="100vw"
          className="object-cover opacity-40"
          style={{ objectPosition: 'center 60%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#16060a]/95 via-[#16060a]/75 to-transparent" />
        <div className="relative z-10 flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300">
              Mega deals · this week only
            </p>
            <h2 className="mt-1.5 text-[22px] font-extrabold leading-tight text-white sm:text-[28px]">
              Up to 40% off skin care essentials
            </h2>
            <p className="mt-1 text-[12px] text-white/70">
              Stock up on lotions, serums and baby care before the offer ends.
            </p>
          </div>
          <Link
            href="/products?deals=1"
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md bg-brand px-5 text-[12.5px] font-extrabold text-white shadow-lg transition-transform hover:-translate-y-0.5"
          >
            Shop the deals <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
