import type { Metadata } from 'next';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy policy (Data Protection Act 843)',
  description:
    'How Glow-Up Skincare & Mother Care collects, uses and protects your personal data under Ghana’s Data Protection Act, 2012 (Act 843).',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="text-[24px] font-extrabold tracking-tight text-ink">Privacy policy</h1>
      <p className="mt-2 rounded-lg border border-line bg-surface-soft px-3.5 py-2.5 text-[12.5px] leading-relaxed text-gray-700">
        {site.nameFull} is the <strong>data controller</strong> for this website and processes
        personal data in accordance with the <strong>Data Protection Act, 2012 (Act 843)</strong>{' '}
        of Ghana. Questions or requests: {site.email} · WhatsApp {site.whatsappDisplay}. See also
        our{' '}
        <a href="/policies#privacy" className="font-bold text-brand hover:underline">
          payment, delivery and returns policies
        </a>
        .
      </p>
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
