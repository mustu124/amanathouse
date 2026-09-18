import type { Metadata } from "next";
import { ContactContent } from "./ContactContent";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach Amanat House on WhatsApp or email — sizing help, order questions, shipping, returns, and care & warranty answered.",
  alternates: {
    canonical: `${env.siteUrl}/contact`
  },
  openGraph: {
    type: "website",
    url: `${env.siteUrl}/contact`,
    title: "Contact | Amanat House",
    description: "Reach Amanat House on WhatsApp or email — sizing help, order questions, shipping, returns, and care & warranty answered.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Amanat House" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact | Amanat House",
    description: "Reach Amanat House on WhatsApp or email — sizing help, order questions, shipping, returns, and care & warranty answered.",
    images: ["/og-image.png"]
  }
};

export default function ContactPage() {
  return <ContactContent />;
}
