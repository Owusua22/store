// app/contact/page.tsx
import { Mail, MapPin, Phone, Clock, Send } from 'lucide-react';

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <section className="relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 -left-40 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 border border-indigo-200/60 mb-6">
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                Contact Us
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              Let&apos;s Start a
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-400 to-pink-600 bg-clip-text text-transparent">
                Conversation
              </span>
            </h1>

            <p className="mt-6 text-lg text-gray-600 leading-relaxed">
              Have a question, need help with an order, or want to learn more about our
              products? We&apos;d love to hear from you.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            {/* Contact form */}
            <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/30 border border-gray-100 p-8 sm:p-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>

              <form className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="John"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="Doe"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="How can we help?"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Write your message here..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-indigo-600 transition-all hover:shadow-xl hover:shadow-indigo-200/40"
                >
                  <Send className="w-4 h-4" />
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact info */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/30 border border-gray-100 p-8 sm:p-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in touch</h2>

                <div className="space-y-5">
                  {[
                    {
                      icon: Mail,
                      title: 'Email',
                      value: 'support@sallysclothing.com',
                    },
                    {
                      icon: Phone,
                      title: 'Phone',
                      value: '+256 700 000 000',
                    },
                    {
                      icon: MapPin,
                      title: 'Address',
                      value: 'Kampala, Uganda',
                    },
                    {
                      icon: Clock,
                      title: 'Business Hours',
                      value: 'Mon - Sat, 8:00 AM - 6:00 PM',
                    },
                  ].map(({ icon: Icon, title, value }) => (
                    <div key={title} className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">{title}</p>
                        <p className="text-base font-semibold text-gray-900">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-xl shadow-purple-200/30">
                <h3 className="text-xl font-bold mb-3">We&apos;re here to help</h3>
                <p className="text-white/90 leading-relaxed">
                  Our team is always happy to answer your questions about orders, products,
                  shipping, or anything else you need.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}