// app/about/page.tsx
import { Sparkles, ShieldCheck, Truck, HeartHandshake } from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50">
      <section className="relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 -left-40 w-96 h-96 bg-red-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-red-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 border border-red-100/60 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-red-600" />
              <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                About Us
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              Healthy Skin,
              <br />
              <span className="bg-gradient-to-r from-red-600 via-red-700 to-rose-600 bg-clip-text text-transparent">
                Everyday Confidence
              </span>
            </h1>

            <p className="mt-6 text-lg text-gray-600 leading-relaxed">
              We are a Ghanaian skin care store built on one belief: everyone deserves
              products that are authentic, effective and affordable. From shea body
              lotions to vitamin C serums, baby care and daily sun protection, every item
              we stock is chosen to help your skin feel healthy and look its best.
            </p>
          </div>

          {/* Story section */}
          <div className="mt-16 grid lg:grid-cols-2 gap-10 items-center">
            <div className="bg-white rounded-3xl shadow-xl shadow-red-100/30 border border-gray-100 p-8 sm:p-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Sally started with a simple frustration: finding genuine skin care in
                  Ghana was harder than it should be. Products were either overpriced,
                  expired or impossible to verify. So we built a store that only sells
                  what we would use ourselves.
                </p>
                <p>
                  We work directly with trusted distributors and brands, check every
                  batch, and pack orders carefully so your lotion, serum or baby wash
                  arrives exactly as it should. Our range covers body lotions, shower gels,
                  shampoos and conditioners, face creams, serums, face washes, baby
                  diapers, baby lotions, sun care and more.
                </p>
                <p>
                  Whether you are building a full routine or restocking a family
                  favourite, our team on WhatsApp is always a message away — and we deliver
                  to every region in Ghana.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Authentic products',
                  desc: 'Sourced from verified suppliers, never expired stock.',
                },
                {
                  icon: Truck,
                  title: 'Reliable delivery',
                  desc: 'Nationwide dispatch with pay-on-delivery options.',
                },
                {
                  icon: HeartHandshake,
                  title: 'Customer first',
                  desc: 'Real people on WhatsApp to help with every order.',
                },
                {
                  icon: Sparkles,
                  title: 'Curated for Ghana',
                  desc: 'Routines built for our climate, skin and budgets.',
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg hover:shadow-red-100/20 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom statement */}
          <div className="mt-16 text-center max-w-3xl mx-auto">
            <p className="text-base sm:text-lg text-gray-600">
              We&apos;re more than a store — we&apos;re your skin care partner, committed to
              honest products, fair prices and service that feels personal.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}