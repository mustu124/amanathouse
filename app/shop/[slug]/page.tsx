import type { Metadata } from "next";
import { ProductDetailContent } from "./ProductDetailContent";
import { getCategoryByName } from "@/lib/product-data";
import { getProductBySlugForMetadata } from "@/lib/server-products";
import { getDisplayMediaUrl } from "@/lib/media";
import { env } from "@/lib/env";

function toAbsoluteUrl(path: string) {
  return path.startsWith("http") ? path : `${env.siteUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProductBySlugForMetadata(params.slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

  const priceLabel = `₹${product.price.toLocaleString("en-IN")}`;
  const availabilityLabel = product.inStock ? "In Stock" : "Out of Stock";
  const description = `${priceLabel} — ${availabilityLabel}. ${product.description || `${product.name} from Amanat House.`}`.slice(0, 300);
  const imageUrl = product.images[0]?.url ? getDisplayMediaUrl(product.images[0].url) : "/og-image.png";

  return {
    title: product.name,
    description,
    alternates: {
      canonical: `${env.siteUrl}/shop/${product.slug}`
    },
    openGraph: {
      type: "website",
      url: `${env.siteUrl}/shop/${product.slug}`,
      title: product.name,
      description,
      images: [{ url: imageUrl, width: 1200, height: 1500, alt: product.images[0]?.alt || product.name }]
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: [imageUrl]
    }
  };
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlugForMetadata(params.slug);
  const category = product ? getCategoryByName(product.category) : undefined;

  const jsonLd = product
    ? [
        {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description || `${product.name} from Amanat House.`,
          image: product.images.map((image) => toAbsoluteUrl(getDisplayMediaUrl(image.url))),
          sku: product._id,
          brand: { "@type": "Brand", name: "Amanat House" },
          offers: {
            "@type": "Offer",
            url: `${env.siteUrl}/shop/${product.slug}`,
            priceCurrency: "INR",
            price: product.price,
            availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition"
          }
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: env.siteUrl },
            { "@type": "ListItem", position: 2, name: "Shop", item: `${env.siteUrl}/shop` },
            ...(category
              ? [
                  {
                    "@type": "ListItem",
                    position: 3,
                    name: category.name,
                    item: `${env.siteUrl}/shop?category=${category.slug}`
                  }
                ]
              : []),
            {
              "@type": "ListItem",
              position: category ? 4 : 3,
              name: product.name,
              item: `${env.siteUrl}/shop/${product.slug}`
            }
          ]
        }
      ]
    : [];

  return (
    <>
      {jsonLd.map((entry, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
        />
      ))}
      <ProductDetailContent params={params} />
    </>
  );
}
