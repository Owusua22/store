import type { Metadata } from 'next';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms of service',
};

export default function TermsPage() {
  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="text-[24px] font-extrabold tracking-tight text-ink">Terms of service</h1>
      <div className="prose-soft mt-4 space-y-4 text-[13px] leading-relaxed text-gray-600">
        <p>
          Welcome to {site.nameFull}. By placing an order on this website you agree to the
          terms below.
        </p>
        <h2 className="text-[15px] font-bold text-ink">Orders & payment</h2>
        <p>
          All prices are listed in Ghana Cedis (GH₵) and include applicable taxes. Payment
          can be made by cash on delivery, mobile money or card. Orders are confirmed once
          payment or delivery details are verified.
        </p>
        <h2 className="text-[15px] font-bold text-ink">Delivery</h2>
        <p>
          Delivery timelines depend on your location. Orders within Accra and Kumasi are
          usually delivered in 1–2 business days; other regions take 2–5 business days.
          Free delivery applies to orders above GH₵{site.freeDeliveryThreshold} in selected
          areas.
        </p>
        <h2 className="text-[15px] font-bold text-ink">Returns</h2>
        <p>
          Unopened products can be returned within 7 days of delivery. For hygiene reasons,
          opened skin care products cannot be returned unless they are faulty.
        </p>
        <h2 className="text-[15px] font-bold text-ink">Contact</h2>
        <p>
          Questions? Call or WhatsApp {site.phoneDisplay} or email {site.email}.
        </p>
      </div>
    </div>
  );
}
