import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { HamperBuilder } from "@/components/HamperBuilder";
import { env } from "@/lib/env";
import { hamperOfferLabel, hamperRules, selectedItemFromProduct } from "@/lib/hampers";
import { calculateHamperPrice } from "@/lib/pricing/hamper";
import { getHamperBySlug } from "@/lib/server-hampers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toAbsoluteUrl(path: string) {
  return path.startsWith("http") ? path : `${env.siteUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const hamper = await getHamperBySlug(params.slug);
  if (!hamper) return { title: "Hamper Not Found" };

  const description = `${hamperOfferLabel(hamper)}. ${hamper.shortDescription || hamper.longDescription || `${hamper.name} from Amanat House.`}`.slice(0, 300);
  // Raw storage URL, not the /api/media proxy: /api is disallowed in robots.txt.
  const imageUrl = hamper.heroImageUrl || "/og-image.png";

  return {
    title: hamper.name,
    description,
    alternates: { canonical: `${env.siteUrl}/hampers/${hamper.slug}` },
    openGraph: {
      type: "website",
      url: `${env.siteUrl}/hampers/${hamper.slug}`,
      title: hamper.name,
      description,
      images: [{ url: imageUrl, width: 1200, height: 1500, alt: hamper.name }]
    },
    twitter: { card: "summary_large_image", title: hamper.name, description, images: [imageUrl] }
  };
}

export default async function HamperPage({ params }: { params: { slug: string } }) {
  const hamper = await getHamperBySlug(params.slug);
  if (!hamper) notFound();

  // "Starting at" price: the cheapest valid selection - the fixed price, or the
  // cheapest min_items pieces after the discount - so the offer is honest.
  const pool = hamper.products.filter((entry) => entry.product.active !== false && entry.product.inStock);
  const required = pool.filter((entry) => entry.isRequired);
  const optional = pool.filter((entry) => !entry.isRequired).sort((a, b) => a.product.price - b.product.price);
  const cheapest = [...required, ...optional.slice(0, Math.max(hamper.minItems - required.length, 0))];
  const startingPrice = calculateHamperPrice(
    hamperRules(hamper),
    cheapest.map((entry) => selectedItemFromProduct(entry.product, 1))
  ).total;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: hamper.name,
    description: hamper.longDescription || hamper.shortDescription || `${hamper.name} from Amanat House.`,
    image: [hamper.heroImageUrl, ...hamper.galleryImageUrls].filter(Boolean).map(toAbsoluteUrl),
    brand: { "@type": "Brand", name: "Amanat House" },
    offers: {
      "@type": "Offer",
      url: `${env.siteUrl}/hampers/${hamper.slug}`,
      priceCurrency: "INR",
      price: startingPrice,
      availability: pool.length >= hamper.minItems ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition"
    }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Suspense fallback={null}>
        <HamperBuilder hamper={hamper} />
      </Suspense>
    </>
  );
}
