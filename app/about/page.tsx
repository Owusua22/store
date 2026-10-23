// app/about/page.tsx
import { Sparkles, ShieldCheck, Truck, HeartHandshake } from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <section className="relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 -left-40 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 border border-indigo-200/60 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                About Us
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              Style, Quality, and
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Everyday Confidence
              </span>
            </h1>

            <p className="mt-6 text-lg text-gray-600 leading-relaxed">
              At Sally&apos;s Clothing &amp; More, we believe fashion should feel effortless,
              premium, and expressive. Our mission is to bring carefully curated products
              that help you look good, feel confident, and enjoy every purchase.
            </p>
          </div>

          {/* Story section */}
          <div className="mt-16 grid lg:grid-cols-2 gap-10 items-center">
            <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/30 border border-gray-100 p-8 sm:p-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  We started with a simple idea: create a shopping experience that feels
                  personal, elegant, and trustworthy. From everyday essentials to standout
                  pieces, every item in our store is selected with care.
                </p>
                <p>
                  Our collections are inspired by modern lifestyles — balancing comfort,
                  quality, and timeless style. We want every customer to feel like they&apos;re
                  getting something special, not just another product.
                </p>
                <p>
                  Whether you&apos;re shopping for yourself, your home, or a thoughtful gift,
                  we&apos;re here to make your journey smooth, enjoyable, and inspiring.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Trusted Quality',
                  desc: 'Products chosen for durability, comfort, and style.',
                },
                {
                  icon: Truck,
                  title: 'Reliable Delivery',
                  desc: 'Fast shipping and smooth order fulfillment.',
                },
                {
                  icon: HeartHandshake,
                  title: 'Customer First',
                  desc: 'We care deeply about your shopping experience.',
                },
                {
                  icon: Sparkles,
                  title: 'Curated Collections',
                  desc: 'Fresh finds and standout essentials every season.',
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg hover:shadow-indigo-100/20 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-indigo-600" />
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
              We&apos;re more than a store — we&apos;re a brand that values elegance, trust, and
              the joy of discovering things you truly love.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}