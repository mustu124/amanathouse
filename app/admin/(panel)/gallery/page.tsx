"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AdminSection } from "@/components/admin/AdminCards";
import { adminFetch } from "@/lib/admin-client";
import { getDisplayMediaUrl } from "@/lib/media";
import type { GalleryItem } from "@/lib/gallery-data";
import { PRODUCT_CATEGORIES } from "@/lib/product-data";

// Gallery items are generated from product images, so their category is
// always one of PRODUCT_CATEGORIES — no other filter value would ever match.
const galleryCategories = [...PRODUCT_CATEGORIES];

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = () =>
    adminFetch<{ items: GalleryItem[] }>("/api/gallery?limit=100")
      .then((res) => setItems(res.data.items))
      .catch((error) => toast.error(error.message))
      .finally(() => setIsLoading(false));

  useEffect(() => {
    load();
  }, []);

  const visibleItems = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();
    return items.filter((item) => {
      if (filter && item.category !== filter) return false;
      if (
        normalizedSearch &&
        ![item.productName, item.caption, item.category, item.type].join(" ").toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }
      return true;
    });
  }, [filter, items, search]);

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-amanat-sage">Media</p>
        <h1 className="font-heading text-4xl font-bold text-amanat-brown">Gallery</h1>
      </div>

      <AdminSection
        title="Product Gallery"
        description="Gallery media is generated from active products. Add or change images on a product to update this gallery."
        action={
          <div className="flex flex-col gap-2 md:flex-row">
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="field-input md:w-56" placeholder="Search gallery" />
            <select value={filter} onChange={(event) => setFilter(event.target.value)} className="field-input md:w-56">
              <option value="">All categories</option>
              {galleryCategories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </div>
        }
      >
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {[1, 2, 3, 4, 5].map((item) => <div key={item} className="h-64 animate-pulse rounded-2xl bg-amanat-cream" />)}
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="rounded-2xl bg-amanat-cream p-8 text-center">
            <p className="font-heading text-2xl font-bold text-amanat-brown">No product media found</p>
            <p className="mt-2 text-sm text-stone-500">Add images to active products and they will appear here automatically.</p>
            <Link href="/admin/products" className="mt-5 inline-flex rounded-full bg-amanat-terracotta px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white">
              Manage products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {visibleItems.map((item) => <ProductGalleryItem key={item._id} item={item} />)}
          </div>
        )}
      </AdminSection>
    </div>
  );
}

function ProductGalleryItem({ item }: { item: GalleryItem }) {
  const imageSrc = item.thumbnailUrl || item.url;
  const productHref = item.productSlug ? `/shop/${encodeURIComponent(item.productSlug)}` : "";
  const editProductHref = item.productSlug ? `/admin/products/${encodeURIComponent(item.productSlug)}/edit` : "";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amanat-brown/10 bg-amanat-sand">
      <div className="relative h-52 w-full overflow-hidden bg-amanat-cream">
        <Image src={getDisplayMediaUrl(imageSrc)} alt={item.caption || "Gallery item"} fill className="object-cover" />
      </div>
      <div className="grid gap-2 p-3">
        <p className="font-bold text-amanat-brown">{item.productName || item.caption}</p>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-amanat-sage">{item.category}</p>
        {item.productSlug ? (
          <div className="flex flex-wrap gap-2">
            <Link href={editProductHref} className="rounded-full border border-amanat-brown/20 px-3 py-1 text-xs font-black text-amanat-brown">
              Edit product
            </Link>
            <Link href={productHref} className="rounded-full bg-amanat-terracotta px-3 py-1 text-xs font-black text-white">
              View product
            </Link>
          </div>
        ) : (
          <p className="text-xs font-bold text-stone-500">Linked product details unavailable</p>
        )}
      </div>
    </div>
  );
}
