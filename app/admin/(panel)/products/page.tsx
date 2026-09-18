"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AdminSection, ConfirmButton } from "@/components/admin/AdminCards";
import { adminFetch, formatCurrency } from "@/lib/admin-client";
import { PRODUCT_CATEGORIES, type StoreProduct } from "@/lib/product-data";
import { getDisplayMediaUrl } from "@/lib/media";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([...PRODUCT_CATEGORIES]);

  const load = () =>
    adminFetch<{ products: StoreProduct[] }>("/api/products?admin=true&limit=200")
      .then((res) => setProducts(res.data.products))
      .catch((error) => toast.error(error.message));

  useEffect(() => {
    load();
    adminFetch<{ settings: { categories?: Array<{ name: string }> } }>("/api/settings")
      .then((res) => {
        const configured = (res.data.settings.categories ?? []).map((item) => item.name).filter(Boolean);
        if (configured.length) setCategories(configured);
      })
      .catch((error) => toast.error(error.message));
  }, []);

  const visibleProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          (!category || product.category === category) &&
          product.name.toLowerCase().includes(search.toLowerCase())
      ),
    [category, products, search]
  );

  const productIdentifier = (product: StoreProduct) => product.slug || product._id;
  const productApiPath = (product: StoreProduct) => `/api/products/${encodeURIComponent(productIdentifier(product))}`;

  // The API soft-deletes (sets active: false) rather than erasing the row —
  // this keeps past orders referencing this product intact. "Archive" reflects
  // that honestly instead of claiming the product is gone when it still shows
  // up (correctly, as a Draft) the moment the list reloads.
  const archiveProduct = async (product: StoreProduct) => {
    try {
      await adminFetch(productApiPath(product), { method: "DELETE" });
      setSelected((current) => current.filter((id) => id !== productIdentifier(product)));
      toast.success("Product archived — it's hidden from the storefront but kept as a draft.");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Archive failed");
    }
  };

  const bulkArchive = async () => {
    try {
      const selectedProducts = products.filter((product) => selected.includes(productIdentifier(product)));
      await Promise.all(selectedProducts.map((product) => adminFetch(productApiPath(product), { method: "DELETE" })));
      setSelected([]);
      toast.success("Selected products archived");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bulk archive failed");
    }
  };

  const toggleFeatured = async (product: StoreProduct) => {
    try {
      await adminFetch(productApiPath(product), {
        method: "PUT",
        body: JSON.stringify({ isFeatured: !product.isFeatured, featured: !product.isFeatured })
      });
      toast.success("Featured status updated");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Featured update failed");
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-amanat-sage">Catalog</p>
          <h1 className="font-heading text-4xl font-bold">Products</h1>
        </div>
        <Link href="/admin/products/new" className="rounded-full bg-amanat-terracotta px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white">Add New Product</Link>
      </div>

      <AdminSection
        title="Product Manager"
        action={
          selected.length > 0 && (
            <ConfirmButton message="Archive selected products? They'll be hidden from the storefront but kept as drafts." onConfirm={bulkArchive} className="rounded-full bg-red-700 px-4 py-2 text-sm font-black text-white">
              Archive Selected
            </ConfirmButton>
          )
        }
      >
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_240px]">
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="field-input" placeholder="Search products" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="field-input">
            <option value="">All categories</option>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div className="grid gap-3">
          <div className="hidden rounded-xl bg-amanat-cream px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-amanat-sage xl:grid xl:grid-cols-[minmax(280px,1.7fr)_minmax(150px,1fr)_100px_70px_100px_100px_130px] xl:gap-4">
            <span>Product</span>
            <span>Category</span>
            <span>Price</span>
            <span>Stock</span>
            <span>Status</span>
            <span>Featured</span>
            <span>Actions</span>
          </div>

          {visibleProducts.map((product) => (
            <article
              key={product._id}
              className="grid gap-4 rounded-2xl border border-amanat-brown/10 bg-white p-4 shadow-sm xl:grid-cols-[minmax(280px,1.7fr)_minmax(150px,1fr)_100px_70px_100px_100px_130px] xl:items-center xl:gap-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <input
                  type="checkbox"
                  aria-label={`Select ${product.name}`}
                  checked={selected.includes(productIdentifier(product))}
                  onChange={(e) =>
                    setSelected((cur) =>
                      e.target.checked
                        ? [...cur, productIdentifier(product)]
                        : cur.filter((id) => id !== productIdentifier(product))
                    )
                  }
                  className="h-4 w-4 shrink-0"
                />
                <Image
                  src={getDisplayMediaUrl(product.images[0]?.url)}
                  alt={product.name}
                  width={64}
                  height={64}
                  className="h-16 w-16 shrink-0 rounded-xl bg-amanat-sand object-cover"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <p className="break-words text-base font-black leading-snug text-amanat-brown">{product.name}</p>
                  <p className="mt-1 text-xs font-bold text-stone-500 xl:hidden">{product.category}</p>
                </div>
              </div>

              <div className="hidden text-sm font-bold text-amanat-brown xl:block">{product.category}</div>
              <div className="text-sm font-black text-amanat-brown">
                <span className="mr-2 text-xs uppercase tracking-[0.12em] text-amanat-sage xl:hidden">Price</span>
                {formatCurrency(product.price)}
              </div>
              <div className="text-sm font-bold text-amanat-brown">
                <span className="mr-2 text-xs uppercase tracking-[0.12em] text-amanat-sage xl:hidden">Stock</span>
                {product.stockCount}
              </div>
              <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.1em] ${product.active === false ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                {product.active === false ? "Draft" : "Published"}
              </span>
              <button
                type="button"
                onClick={() => toggleFeatured(product)}
                className="w-fit rounded-full bg-amanat-cream px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-amanat-terracotta"
              >
                {product.isFeatured ? "Yes" : "No"}
              </button>
              <div className="flex flex-wrap items-center gap-3">
                <Link href={`/admin/products/${encodeURIComponent(productIdentifier(product))}/edit`} className="font-black text-amanat-terracotta">Edit</Link>
                <ConfirmButton message="Archive this product? It will be hidden from the storefront but kept as a draft (e.g. past orders keep referencing it)." onConfirm={() => archiveProduct(product)} className="font-black text-red-700">Archive</ConfirmButton>
              </div>
            </article>
          ))}

          {!visibleProducts.length && (
            <div className="rounded-2xl bg-amanat-cream p-8 text-center font-bold text-amanat-brown">
              No products match the current filters.
            </div>
          )}
        </div>
      </AdminSection>
    </div>
  );
}
