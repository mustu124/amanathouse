import type { Metadata } from "next";
import { AboutContent } from "./AboutContent";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "About",
  description:
    "Amanat House makes minimal, modern jewellery in 316L stainless steel with 18K PVD gold plating — anti-tarnish, waterproof, and made for daily wear. Established 2019.",
  alternates: {
    canonical: `${env.siteUrl}/about`
  },
  openGraph: {
    type: "website",
    url: `${env.siteUrl}/about`,
    title: "About | Amanat House",
    description:
      "Amanat House makes minimal, modern jewellery in 316L stainless steel with 18K PVD gold plating — anti-tarnish, waterproof, and made for daily wear.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Amanat House" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "About | Amanat House",
    description:
      "Amanat House makes minimal, modern jewellery in 316L stainless steel with 18K PVD gold plating — anti-tarnish, waterproof, and made for daily wear.",
    images: ["/og-image.png"]
  }
};

export default function AboutPage() {
  return <AboutContent />;
}
