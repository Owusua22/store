// components/seo/Analytics.tsx
// Google Analytics 4 + Google Search Console verification.
// Both are inert until the env vars are set, so nothing loads in dev or demo.

import Script from 'next/script';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function Analytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}

/** <meta name="google-site-verification"> for Search Console. */
export function searchConsoleVerification() {
  return process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined;
}
