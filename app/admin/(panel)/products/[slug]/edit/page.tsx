"use client";

import { useEffect, useState } from "react";
import { ProductForm } from "@/components/admin/ProductForm";
import { adminFetch } from "@/lib/admin-client";
import type { StoreProduct } from "@/lib/product-data";

export default function EditProductPage({ params }: { params: { slug: string } }) {
  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    setProduct(null);

    adminFetch<{ product: StoreProduct }>(`/api/products/${encodeURIComponent(params.slug)}?admin=true`)
      .then((res) => setProduct(res.data.product))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load product."));
  }, [params.slug]);

  if (error) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="font-heading text-3xl font-bold text-amanat-brown">Unable to load product</h1>
        <p className="mt-2 text-sm font-bold text-red-700">{error}</p>
      </div>
    );
  }

  if (!product) return <div className="rounded-2xl bg-white p-6 shadow-sm">Loading product...</div>;

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-amanat-sage">Catalog</p>
        <h1 className="font-heading text-4xl font-bold text-amanat-brown">Edit Product</h1>
      </div>
      <ProductForm product={product} />
    </div>
  );
}
