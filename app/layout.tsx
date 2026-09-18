import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/Navbar";
import { env } from "@/lib/env";
import { bodySans, displaySerif } from "@/lib/fonts";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "Amanat House | Made to be Kept",
    template: "%s | Amanat House"
  },
  description:
    "Amanat House makes everyday jewellery in 18K gold-plated stainless steel — anti-tarnish, waterproof, and made for daily wear.",
  applicationName: "Amanat House",
  authors: [{ name: "Amanat House" }],
  creator: "Amanat House",
  publisher: "Amanat House",
  keywords: [
    "jewellery",
    "18K gold plated jewellery",
    "anti-tarnish jewellery",
    "waterproof jewellery",
    "stainless steel jewellery India",
    "everyday jewellery",
    "Amanat House"
  ],
  alternates: {
    canonical: env.siteUrl
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: env.siteUrl,
    siteName: "Amanat House",
    title: "Amanat House | Made to be Kept",
    description: "Everyday jewellery in 18K gold-plated stainless steel — anti-tarnish, waterproof, made to be kept.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Amanat House" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Amanat House | Made to be Kept",
    description: "Everyday jewellery in 18K gold-plated stainless steel — anti-tarnish, waterproof, made to be kept.",
    images: ["/og-image.png"]
  },
  robots: {
    index: true,
    follow: true
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FAF5EC"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // TODO-confirm: addressLocality is a placeholder until the client confirms
  // a real city — see NEXT_PUBLIC_STORE_ADDRESS in docs/ENV_SETUP.md.
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Amanat House",
    url: env.siteUrl,
    logo: `${env.siteUrl}/logo.png`,
    sameAs: [env.instagramUrl],
    address: {
      "@type": "PostalAddress",
      addressLocality: env.storeAddress,
      addressCountry: "IN"
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: `+${env.whatsappNumber}`,
      email: env.storeEmail,
      url: `https://wa.me/${env.whatsappNumber}`,
      areaServed: "IN"
    }
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Amanat House",
    url: env.siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${env.siteUrl}/shop?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="en" className={`${displaySerif.variable} ${bodySans.variable}`}>
      <head>
        {supabaseUrl && (
          <>
            <link rel="preconnect" href={supabaseUrl} />
            <link rel="dns-prefetch" href={supabaseUrl} />
          </>
        )}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body>
        <a
          href="#main-content"
          className="sr-only z-[200] rounded-[2px] bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-eyebrow text-ivory focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to main content
        </a>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
