"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ProductCard, ProductSkeleton, QuickViewModal } from "@/components/ProductCard";
import { ProductFilters, type CategoryFilterOption, type ProductFiltersState } from "@/components/ProductFilters";
import { getCategoryByName, getCategoryBySlug, type StoreProduct } from "@/lib/product-data";

type ProductsResponse = {
  success?: boolean;
  data?: {
    products: StoreProduct[];
    total: number;
    page: number;
    hasMore: boolean;
  };
  products?: StoreProduct[];
  total?: number;
  page?: number;
  hasMore?: boolean;
};

const initialFilters: ProductFiltersState = {
  categories: [],
  subcategories: [],
  maxPrice: 3500,
  sort: "newest"
};

export function ShopPageClient() {
  return (
    <Suspense fallback={<ShopPageLoader />}>
      <ShopContentInner />
    </Suspense>
  );
}

function ShopContentInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initialCategoryParam = searchParams.get("category");
  const initialSubcategory = searchParams.get("subcategory");
  // Accept either the slug (canonical, e.g. "rings") or the
  // old space-encoded category name (e.g. "Rings") — the sync
  // effect below rewrites the URL to the slug form either way.
  const resolvedInitialCategory = useMemo(() => {
    if (!initialCategoryParam) return null;
    return getCategoryBySlug(initialCategoryParam)?.name ?? getCategoryByName(initialCategoryParam)?.name ?? null;
  }, [initialCategoryParam]);
  const [filters, setFilters] = useState<ProductFiltersState>({
    ...initialFilters,
    categories: resolvedInitialCategory ? [resolvedInitialCategory] : [],
    subcategories: initialSubcategory ? [initialSubcategory] : []
  });
  const [categoryOptions, setCategoryOptions] = useState<CategoryFilterOption[]>([]);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<StoreProduct | null>(null);
  const [moreLikeThisProduct, setMoreLikeThisProduct] = useState<StoreProduct | null>(null);
  const [similarProducts, setSimilarProducts] = useState<StoreProduct[]>([]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", "8");
    params.set("page", String(page));
    params.set("maxPrice", String(filters.maxPrice));
    params.set("sort", filters.sort);
    if (filters.categories.length === 1) params.set("category", filters.categories[0]);
    if (filters.subcategories.length === 1) params.set("subcategory", filters.subcategories[0]);
    return params.toString();
  }, [filters.categories, filters.maxPrice, filters.sort, filters.subcategories, page]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Keep the URL's `category` param in sync with the active single-category
  // filter, always in slug form — covers checkbox toggles, pill removal,
  // and the initial legacy-name-to-slug redirect in one place.
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const activeCategory = filters.categories.length === 1 ? getCategoryByName(filters.categories[0]) : null;

    if (activeCategory) {
      params.set("category", activeCategory.slug);
    } else {
      params.delete("category");
    }

    const nextQuery = params.toString();
    if (nextQuery !== searchParams.toString()) {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    }
  }, [filters.categories, pathname, router, searchParams]);

  useEffect(() => {
    const activeCategory = filters.categories.length === 1 ? filters.categories[0] : null;
    document.title = activeCategory ? `${activeCategory} | Amanat House` : "Shop | Amanat House";
  }, [filters.categories]);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { data?: { settings?: { categories?: CategoryFilterOption[] } } }) => {
        if (isMounted) setCategoryOptions(payload.data?.settings?.categories ?? []);
      })
      .catch(() => {
        if (isMounted) setCategoryOptions([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadProducts = async () => {
      if (page === 1) setIsLoading(true);
      else setIsLoadingMore(true);

      const response = await fetch(`/api/products?${queryString}`);
      const data = (await response.json()) as ProductsResponse;
      const payload = data.data ?? data;
      const nextProducts = payload.products ?? [];
      const incomingProducts =
        filters.categories.length > 1 || filters.subcategories.length > 1
          ? nextProducts.filter((product) => {
              const matchesCategory = !filters.categories.length || filters.categories.includes(product.category);
              const matchesSubcategory =
                !filters.subcategories.length ||
                (product.subcategory ? filters.subcategories.includes(product.subcategory) : false);

              return matchesCategory && matchesSubcategory;
            })
          : nextProducts;

      if (!isMounted) return;

      setProducts((current) => (page === 1 ? incomingProducts : [...current, ...incomingProducts]));
      setHasMore(Boolean(payload.hasMore));
      setIsLoading(false);
      setIsLoadingMore(false);
    };

    loadProducts().catch(() => {
      if (isMounted) {
        setProducts([]);
        setHasMore(false);
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [filters.categories, filters.subcategories, page, queryString]);

  useEffect(() => {
    if (!moreLikeThisProduct) {
      setSimilarProducts([]);
      return;
    }

    fetch(
      `/api/products?category=${encodeURIComponent(moreLikeThisProduct.category)}&limit=8&exclude=${encodeURIComponent(
        moreLikeThisProduct._id
      )}`
    )
      .then((response) => response.json())
      .then((data: ProductsResponse) => setSimilarProducts(data.data?.products ?? data.products ?? []))
      .catch(() => setSimilarProducts([]));
  }, [moreLikeThisProduct]);

  const appliedPills = [
    ...filters.categories.map((category) => ({ label: category, value: category, type: "category" })),
    ...filters.subcategories.map((subcategory) => ({ label: subcategory, value: subcategory, type: "subcategory" })),
    ...(filters.maxPrice < 3500
      ? [{ label: `Under \u20B9${filters.maxPrice.toLocaleString("en-IN")}`, value: "price", type: "price" }]
      : [])
  ];

  const updateFilters = (nextFilters: ProductFiltersState) => {
    setFilters(nextFilters);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-amanat-cream px-3 pb-20 pt-24 sm:px-4 sm:pt-28 md:px-8">
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="mx-auto max-w-7xl"
      >
        <p className="text-xs font-black uppercase tracking-[0.16em] text-amanat-sage sm:text-sm sm:tracking-[0.18em]">Shop Amanat House</p>
        <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="min-w-0">
            <h1 className="font-heading text-[2.15rem] font-bold leading-[1.02] text-amanat-brown sm:text-4xl md:text-6xl">
              Everyday Jewellery, Made to Last
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-700 sm:text-base">
              Browse rings, chains, studs, and more in anti-tarnish, waterproof 18K gold-plated steel.
            </p>
          </div>
          <button type="button" onClick={() => setIsFilterOpen(true)} className="btn-primary w-full sm:w-auto xl:hidden">
            Open Filters
          </button>
        </div>
      </motion.header>

      <section id="categories" className="mx-auto mt-8 scroll-mt-28 grid max-w-7xl gap-6 sm:mt-10 sm:gap-8 xl:grid-cols-[290px_1fr]">
        <ProductFilters
          filters={filters}
          onChange={updateFilters}
          categories={categoryOptions}
          isMobileOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
        />

        <div className="min-w-0">
          <div className="mb-5 flex min-w-0 flex-wrap items-center gap-2">
            <AnimatePresence>
              {appliedPills.map((pill) => (
                <motion.button
                  key={`${pill.type}-${pill.value}`}
                  type="button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => {
                    if (pill.type === "category") {
                      const nextCategories = filters.categories.filter((category) => category !== pill.value);
                      const allowedSubcategories = new Set(
                        categoryOptions
                          .filter((category) => !nextCategories.length || nextCategories.includes(category.name))
                          .flatMap((category) => category.subcategories ?? [])
                      );
                      setFilters({
                        ...filters,
                        categories: nextCategories,
                        subcategories: filters.subcategories.filter((subcategory) => allowedSubcategories.has(subcategory))
                      });
                    } else if (pill.type === "subcategory") {
                      setFilters({
                        ...filters,
                        subcategories: filters.subcategories.filter((subcategory) => subcategory !== pill.value)
                      });
                    } else {
                      setFilters({ ...filters, maxPrice: 3500 });
                    }
                  }}
                  className="max-w-full rounded-full bg-white px-3 py-2 text-xs font-black uppercase leading-tight tracking-[0.1em] text-amanat-brown shadow-sm focus:outline-none focus:ring-2 focus:ring-amanat-terracotta sm:px-4 sm:tracking-[0.12em]"
                >
                  {pill.label} x
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          {isLoading ? (
            <ShopPageLoader />
          ) : (
            <>
              <motion.div
                layout
                className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4"
              >
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onQuickView={setQuickViewProduct}
                    onMoreLikeThis={setMoreLikeThisProduct}
                  />
                ))}
              </motion.div>

              {products.length === 0 && (
                <div className="rounded-2xl bg-white p-10 text-center text-amanat-brown shadow-sm">
                  <h2 className="font-heading text-3xl font-bold">
                    {filters.categories.length === 1 ? `No pieces in ${filters.categories[0]} yet` : "No pieces found"}
                  </h2>
                  <p className="mt-2 text-stone-600">
                    {filters.categories.length === 1
                      ? "New arrivals are on the way — check back soon or browse the full collection."
                      : "Try removing a filter or raising the price range."}
                  </p>
                  {(filters.categories.length > 0 || filters.subcategories.length > 0 || filters.maxPrice < initialFilters.maxPrice) && (
                    <button type="button" onClick={() => updateFilters(initialFilters)} className="btn-secondary mt-6">
                      View All Products
                    </button>
                  )}
                </div>
              )}

              {hasMore && (
                <div className="mt-10 text-center">
                  <motion.button
                    type="button"
                    onClick={() => setPage((current) => current + 1)}
                    disabled={isLoadingMore}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary disabled:opacity-60"
                  >
                    {isLoadingMore ? "Loading..." : "Load More"}
                  </motion.button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      <MoreLikeThisModal
        sourceProduct={moreLikeThisProduct}
        products={similarProducts}
        onClose={() => setMoreLikeThisProduct(null)}
        onQuickView={setQuickViewProduct}
      />
    </main>
  );
}

function MoreLikeThisModal({
  sourceProduct,
  products,
  onClose,
  onQuickView
}: {
  sourceProduct: StoreProduct | null;
  products: StoreProduct[];
  onClose: () => void;
  onQuickView: (product: StoreProduct) => void;
}) {
  return (
    <AnimatePresence>
      {sourceProduct && (
        <motion.div
          className="fixed inset-0 z-[100] overflow-y-auto bg-black/55 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            onClick={(event) => event.stopPropagation()}
            className="mx-auto mt-20 max-w-6xl rounded-2xl bg-amanat-cream p-5 shadow-soft md:p-8"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amanat-sage">More like this</p>
                <h2 className="font-heading text-3xl font-bold text-amanat-brown">{sourceProduct.category}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-amanat-brown/15 px-4 py-2 text-sm font-black text-amanat-brown"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onQuickView={onQuickView}
                  onMoreLikeThis={() => undefined}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ShopPageLoader() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <ProductSkeleton key={index} />
      ))}
    </div>
  );
}
