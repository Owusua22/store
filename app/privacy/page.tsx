import type { Metadata } from 'next';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy policy',
};

export default function PrivacyPage() {
  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="text-[24px] font-extrabold tracking-tight text-ink">Privacy policy</h1>
      <div className="prose-soft mt-4 space-y-4 text-[13px] leading-relaxed text-gray-600">
        <p>
          {site.nameFull} respects your privacy. This policy explains what we collect and
          how we use it.
        </p>
        <h2 className="text-[15px] font-bold text-ink">What we collect</h2>
        <p>
          We collect the details you provide when creating an account or placing an order:
          your name, email, phone number and delivery address. We do not store card details
          on our servers.
        </p>
        <h2 className="text-[15px] font-bold text-ink">How we use it</h2>
        <p>
          Your information is used to process orders, arrange delivery, provide support and
          — if you opt in — send product updates and offers. You can unsubscribe at any
          time.
        </p>
        <h2 className="text-[15px] font-bold text-ink">Your choices</h2>
        <p>
          You may request access to, correction of, or deletion of your personal data by
          contacting {site.email}.
        </p>
      </div>
    </div>
  );
}
