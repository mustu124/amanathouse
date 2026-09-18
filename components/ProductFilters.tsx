"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CATEGORY_DETAILS } from "@/lib/product-data";

export type CategoryFilterOption = {
  name: string;
  slug?: string;
  subcategories?: string[];
  visible?: boolean;
};

export type ProductFiltersState = {
  categories: string[];
  subcategories: string[];
  maxPrice: number;
  sort: string;
};

type ProductFiltersProps = {
  filters: ProductFiltersState;
  onChange: (filters: ProductFiltersState) => void;
  categories?: CategoryFilterOption[];
  isMobileOpen?: boolean;
  onClose?: () => void;
};

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popular" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" }
];

export function ProductFilters({ filters, onChange, categories, isMobileOpen, onClose }: ProductFiltersProps) {
  const content = (
    <FilterContent filters={filters} onChange={onChange} categories={categories} onClose={onClose} />
  );

  return (
    <>
      <aside className="hidden xl:block">{content}</aside>
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close filters backdrop"
              className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-sm xl:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              className="fixed inset-x-0 bottom-0 z-[90] max-h-[86vh] overflow-y-auto rounded-t-[2rem] bg-amanat-cream p-6 shadow-[0_-24px_60px_rgba(0,0,0,0.22)] xl:hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function FilterContent({
  filters,
  onChange,
  categories,
  onClose
}: {
  filters: ProductFiltersState;
  onChange: (filters: ProductFiltersState) => void;
  categories?: CategoryFilterOption[];
  onClose?: () => void;
}) {
  const visibleCategories = (categories?.length
    ? categories.filter((category) => category.visible !== false)
    : CATEGORY_DETAILS.map((category) => ({ name: category.name, slug: category.slug, subcategories: [] }))
  );
  const selectedCategoryNames = filters.categories.length
    ? filters.categories
    : visibleCategories.map((category) => category.name);
  const availableSubcategories = visibleCategories
    .filter((category) => selectedCategoryNames.includes(category.name))
    .flatMap((category) => (category.subcategories ?? []).map((subcategory) => ({ category: category.name, subcategory })))
    .filter(
      (item, index, items) =>
        items.findIndex((candidate) => candidate.subcategory.toLowerCase() === item.subcategory.toLowerCase()) === index
    );

  const toggleCategory = (category: string) => {
    const categories = filters.categories.includes(category)
      ? filters.categories.filter((item) => item !== category)
      : [...filters.categories, category];
    const allowedSubcategories = new Set(
      visibleCategories
        .filter((item) => !categories.length || categories.includes(item.name))
        .flatMap((item) => item.subcategories ?? [])
    );

    onChange({
      ...filters,
      categories,
      subcategories: filters.subcategories.filter((subcategory) => allowedSubcategories.has(subcategory))
    });
  };

  const toggleSubcategory = (subcategory: string) => {
    const subcategories = filters.subcategories.includes(subcategory)
      ? filters.subcategories.filter((item) => item !== subcategory)
      : [...filters.subcategories, subcategory];

    onChange({ ...filters, subcategories });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amanat-brown/10 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold text-amanat-brown">Filters</h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-amanat-brown/15 px-3 py-1 text-sm font-black text-amanat-brown focus:outline-none focus:ring-2 focus:ring-amanat-terracotta"
          >
            Close
          </button>
        )}
      </div>

      <div className="mt-6">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-amanat-sage">Category</p>
        <div className="mt-3 grid gap-2">
          {visibleCategories.map((category) => (
            <label key={category.name} className="flex cursor-pointer items-center gap-3 text-sm font-bold text-amanat-brown">
              <input
                type="checkbox"
                checked={filters.categories.includes(category.name)}
                onChange={() => toggleCategory(category.name)}
                className="h-4 w-4 accent-amanat-terracotta"
              />
              {category.name}
            </label>
          ))}
        </div>
      </div>

      {availableSubcategories.length > 0 && (
        <div className="mt-7">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amanat-sage">Subcategory</p>
          <div className="mt-3 grid gap-2">
            {availableSubcategories.map(({ category, subcategory }) => (
              <label key={`${category}-${subcategory}`} className="flex cursor-pointer items-start gap-3 text-sm font-bold text-amanat-brown">
                <input
                  type="checkbox"
                  checked={filters.subcategories.includes(subcategory)}
                  onChange={() => toggleSubcategory(subcategory)}
                  className="mt-0.5 h-4 w-4 accent-amanat-terracotta"
                />
                <span>
                  {subcategory}
                  {!filters.categories.length && (
                    <span className="mt-0.5 block text-xs font-black uppercase tracking-[0.12em] text-amanat-sage">
                      {category}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="mt-7">
        <label htmlFor="max-price" className="text-xs font-black uppercase tracking-[0.16em] text-amanat-sage">
          Price up to {"\u20B9"}{filters.maxPrice.toLocaleString("en-IN")}
        </label>
        <input
          id="max-price"
          type="range"
          min="300"
          max="3500"
          step="100"
          value={filters.maxPrice}
          onChange={(event) => onChange({ ...filters, maxPrice: Number(event.target.value) })}
          className="mt-4 w-full accent-amanat-terracotta"
        />
      </div>

      <div className="mt-7">
        <label htmlFor="sort-products" className="text-xs font-black uppercase tracking-[0.16em] text-amanat-sage">
          Sort by
        </label>
        <select
          id="sort-products"
          value={filters.sort}
          onChange={(event) => onChange({ ...filters, sort: event.target.value })}
          className="mt-3 w-full rounded-xl border border-amanat-brown/12 bg-amanat-cream px-4 py-3 font-bold text-amanat-brown focus:outline-none focus:ring-2 focus:ring-amanat-terracotta"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => onChange({ categories: [], subcategories: [], maxPrice: 3500, sort: "newest" })}
        className="btn-secondary mt-7 w-full"
      >
        Reset Filters
      </button>
    </motion.div>
  );
}
