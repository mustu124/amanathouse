import type { Metadata } from "next";
import Link from "next/link";
import { env } from "@/lib/env";
import { SHIPPING_POLICY_INTRO, SHIPPING_POLICY_POINTS } from "@/lib/content/policies";

const description = "Shipping policy for Amanat House orders: processing time, delivery time and tracking.";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description,
  alternates: { canonical: `${env.siteUrl}/shipping` },
  openGraph: {
    type: "website",
    url: `${env.siteUrl}/shipping`,
    title: "Shipping Policy | Amanat House",
    description,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Amanat House" }]
  }
};

export default function ShippingPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-12 sm:px-8 lg:pt-16">
      <p className="text-center text-xs font-bold uppercase tracking-[0.24em] text-amanat-terracotta">Policies</p>
      <h1 className="mt-3 text-center font-heading text-4xl font-bold sm:text-5xl">Shipping Policy</h1>
      <div className="mx-auto my-6 h-px w-20 bg-gold" />
      <p className="text-center text-lg text-amanat-sage">{SHIPPING_POLICY_INTRO}</p>
      <ul className="mt-8 grid gap-4">
        {SHIPPING_POLICY_POINTS.map((point) => (
          <li key={point} className="border-l-2 border-gold bg-white px-5 py-4 leading-7 text-stone-700">
            {point}
          </li>
        ))}
      </ul>
      <p className="mt-10 text-center text-sm text-stone-600">
        Need to return or exchange something? See our{" "}
        <Link href="/contact#returns" className="font-bold text-amanat-terracotta underline underline-offset-4">
          return &amp; exchange policy
        </Link>
        .
      </p>
    </div>
  );
}
