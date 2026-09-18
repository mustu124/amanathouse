import type { Metadata } from "next";
import { ShopPageClient } from "./ShopContent";
import { CATEGORY_DETAILS, getCategoryBySlug, getCategoryByName } from "@/lib/product-data";
import { env } from "@/lib/env";

type ShopPageProps = {
  searchParams: { category?: string };
};

function resolveCategory(rawCategory?: string) {
  if (!rawCategory) return undefined;
  return getCategoryBySlug(rawCategory) ?? getCategoryByName(decodeURIComponent(rawCategory));
}

export function generateMetadata({ searchParams }: ShopPageProps): Metadata {
  const category = resolveCategory(searchParams.category);

  const title = category ? category.name : "Shop All Jewellery";
  const description = category
    ? `${category.description} Shop the full ${category.name} collection from Amanat House.`
    : "Shop everyday jewellery from Amanat House — rings, chains, studs, necklaces, and more in anti-tarnish, waterproof 18K gold-plated steel.";
  const canonical = category ? `${env.siteUrl}/shop?category=${category.slug}` : `${env.siteUrl}/shop`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Amanat House" }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"]
    }
  };
}

export default function ShopPage({ searchParams }: ShopPageProps) {
  const category = resolveCategory(searchParams.category);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: env.siteUrl },
      ...(category
        ? [
            { "@type": "ListItem", position: 2, name: "Shop", item: `${env.siteUrl}/shop` },
            { "@type": "ListItem", position: 3, name: category.name, item: `${env.siteUrl}/shop?category=${category.slug}` }
          ]
        : [{ "@type": "ListItem", position: 2, name: "Shop", item: `${env.siteUrl}/shop` }])
    ]
  };

  const itemListJsonLd = !category
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: CATEGORY_DETAILS.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          url: `${env.siteUrl}/shop?category=${item.slug}`
        }))
      }
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {itemListJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      )}
      <ShopPageClient />
    </>
  );
}
