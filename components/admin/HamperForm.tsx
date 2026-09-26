"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { adminFetch, uploadWithProgress, validateImageFile } from "@/lib/admin-client";
import { selectedItemFromProduct, type Hamper } from "@/lib/hampers";
import { getDisplayMediaUrl } from "@/lib/media";
import { calculateHamperPrice, formatMoney, validateHamperConfig } from "@/lib/pricing/hamper";
import { slugifyProductName, type StoreProduct } from "@/lib/product-data";

type PickedProduct = { productId: string; isRequired: boolean };

export function HamperForm({ hamper }: { hamper?: Hamper }) {
  const router = useRouter();
  const [name, setName] = useState(hamper?.name ?? "");
  const [slug, setSlug] = useState(hamper?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(hamper));
  const [shortDescription, setShortDescription] = useState(hamper?.shortDescription ?? "");
  const [longDescription, setLongDescription] = useState(hamper?.longDescription ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(hamper?.heroImageUrl ?? "");
  const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>(hamper?.galleryImageUrls ?? []);
  const [discountPercent, setDiscountPercent] = useState(String(hamper?.discountPercent ?? 10));
  const [packagingFee, setPackagingFee] = useState(String(hamper?.packagingFee ?? 0));
  const [minItems, setMinItems] = useState(String(hamper?.minItems ?? 2));
  const [maxItems, setMaxItems] = useState(hamper?.maxItems == null ? "" : String(hamper.maxItems));
  const [isActive, setIsActive] = useState(hamper?.isActive ?? true);
  const [picked, setPicked] = useState<PickedProduct[]>(
    hamper?.products.map((entry) => ({ productId: entry.product._id, isRequired: entry.isRequired })) ?? []
  );

  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [existingSlugs, setExistingSlugs] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sample, setSample] = useState<string[] | null>(null);
  const [uploads, setUploads] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    adminFetch<{ products: StoreProduct[] }>("/api/products?admin=true&limit=200")
      .then((res) => setProducts(res.data.products))
      .catch((error) => toast.error(error.message));
    adminFetch<{ hampers: Hamper[] }>("/api/hampers?admin=true")
      .then((res) => setExistingSlugs(res.data.hampers.filter((item) => item._id !== hamper?._id).map((item) => item.slug)))
      .catch(() => setExistingSlugs([]));
  }, [hamper?._id]);

  const productById = useMemo(() => new Map(products.map((product) => [product._id, product])), [products]);
  const categories = useMemo(() => Array.from(new Set(products.map((product) => product.category))).sort(), [products]);
  const pickableProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.active !== false &&
          (!categoryFilter || product.category === categoryFilter) &&
          product.name.toLowerCase().includes(search.toLowerCase())
      ),
    [products, categoryFilter, search]
  );

  const effectiveSlug = slugTouched ? slug : slugifyProductName(name);
  const percentValue = discountPercent === "" ? null : Number(discountPercent);
  const feeValue = packagingFee === "" ? 0 : Number(packagingFee);
  const minValue = Number(minItems);
  const maxValue = maxItems === "" ? null : Number(maxItems);

  const errors = useMemo(() => {
    const list: string[] = [];
    if (!name.trim()) list.push("Give the hamper a name.");
    if (!effectiveSlug) list.push("The URL name (slug) cannot be empty.");
    if (existingSlugs.includes(effectiveSlug)) list.push(`The URL name "${effectiveSlug}" is already used by another hamper.`);
    list.push(
      ...validateHamperConfig({
        discountPercent: percentValue,
        packagingFee: feeValue,
        minItems: minValue,
        maxItems: maxValue,
        eligibleCount: picked.length
      })
    );
    const requiredCount = picked.filter((entry) => entry.isRequired).length;
    if (maxValue != null && requiredCount > maxValue) list.push("More products are marked required than the maximum item count allows.");
    return list;
  }, [name, effectiveSlug, existingSlugs, percentValue, feeValue, minValue, maxValue, picked]);

  const rules = useMemo(
    () => ({
      discountPercent: percentValue ?? 0,
      packagingFee: feeValue,
      minItems: Number.isFinite(minValue) ? minValue : 1,
      maxItems: maxValue,
      requiredProductIds: picked.filter((entry) => entry.isRequired).map((entry) => entry.productId)
    }),
    [percentValue, feeValue, minValue, maxValue, picked]
  );

  // Default sample basket: required items + cheapest others up to min_items.
  const defaultSample = useMemo(() => {
    const entries = picked
      .map((entry) => ({ entry, product: productById.get(entry.productId) }))
      .filter((row): row is { entry: PickedProduct; product: StoreProduct } => Boolean(row.product));
    const required = entries.filter((row) => row.entry.isRequired);
    const others = entries.filter((row) => !row.entry.isRequired).sort((a, b) => a.product.price - b.product.price);
    const want = Math.max(Number.isFinite(minValue) ? minValue : 1, required.length);
    return [...required, ...others.slice(0, Math.max(want - required.length, 0))].map((row) => row.entry.productId);
  }, [picked, productById, minValue]);

  const sampleIds = (sample ?? defaultSample).filter((id) => picked.some((entry) => entry.productId === id));
  const preview = useMemo(
    () =>
      calculateHamperPrice(
        rules,
        sampleIds.flatMap((id) => {
          const product = productById.get(id);
          return product ? [selectedItemFromProduct(product, 1)] : [];
        })
      ),
    [rules, sampleIds, productById]
  );

  const togglePick = (productId: string) => {
    setPicked((current) =>
      current.some((entry) => entry.productId === productId)
        ? current.filter((entry) => entry.productId !== productId)
        : [...current, { productId, isRequired: false }]
    );
  };
  const move = (index: number, direction: -1 | 1) => {
    setPicked((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const upload = async (files: FileList | null, onDone: (url: string) => void) => {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      const problem = await validateImageFile(file);
      if (problem) {
        toast.error(problem);
        continue;
      }
      setUploads((current) => ({ ...current, [file.name]: 0 }));
      try {
        const result = await uploadWithProgress("/api/upload", file, (percent) =>
          setUploads((current) => ({ ...current, [file.name]: percent }))
        );
        onDone(result.data.url);
        toast.success(`${file.name} uploaded`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : `${file.name}: upload failed`);
      } finally {
        setUploads((current) => {
          const { [file.name]: _removed, ...rest } = current;
          return rest;
        });
      }
    }
  };

  const save = async () => {
    setShowErrors(true);
    if (errors.length) {
      toast.error(errors[0]);
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        slug: effectiveSlug,
        shortDescription,
        longDescription,
        heroImageUrl,
        galleryImageUrls,
        discountPercent: percentValue,
        packagingFee: feeValue,
        minItems: minValue,
        maxItems: maxValue,
        isActive,
        isPlaceholder: hamper?.isPlaceholder ?? false,
        products: picked.map((entry, index) => ({ productId: entry.productId, isRequired: entry.isRequired, sortOrder: index }))
      };
      const result = await adminFetch<{ hamper: Hamper }>(hamper ? `/api/hampers/${hamper._id}` : "/api/hampers", {
        method: hamper ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });
      toast.success(hamper ? "Hamper saved" : "Hamper created");
      if (!hamper) router.push(`/admin/hampers/${result.data.hamper.slug}/edit`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const isUploading = Object.keys(uploads).length > 0;
  const sampleWorth = preview.itemsSubtotal;

  return (
    <div className="grid gap-6">
      {showErrors && errors.length > 0 && (
        <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">
          <p>Fix these before saving:</p>
          <ul className="mt-2 list-disc pl-5">
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-heading text-2xl font-bold">Details</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name">
            <input value={name} onChange={(event) => setName(event.target.value)} className="field-input" placeholder="The Everyday Edit" />
          </Field>
          <Field label="URL name (slug)">
            <input
              value={effectiveSlug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(slugifyProductName(event.target.value));
              }}
              className="field-input"
            />
            {existingSlugs.includes(effectiveSlug) && <span className="text-xs font-bold text-red-700">Already in use by another hamper.</span>}
          </Field>
        </div>
        <Field label="Short description (shown on the hampers page)">
          <input value={shortDescription} onChange={(event) => setShortDescription(event.target.value)} className="field-input" maxLength={160} />
        </Field>
        <Field label="Long description (shown on the hamper page)">
          <textarea value={longDescription} onChange={(event) => setLongDescription(event.target.value)} className="field-input min-h-28" />
        </Field>
        <label className="flex items-center gap-2 font-bold">
          <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} /> Active (visible in the shop)
        </label>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-heading text-2xl font-bold">Images</h2>
        <p className="mt-1 text-sm text-stone-500">The hero is the single showcase photo of the hamper look — 4:5 portrait, at least 1200 × 1500 px, ivory or neutral background.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-amanat-sand">
            {heroImageUrl && <Image src={getDisplayMediaUrl(heroImageUrl)} alt="Hero preview" fill sizes="220px" className="object-cover" />}
          </div>
          <div>
            <label className="flex min-h-24 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-amanat-brown/20 bg-amanat-cream p-4 text-center font-bold">
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => upload(event.target.files, setHeroImageUrl)} />
              {isUploading ? "Uploading..." : heroImageUrl ? "Replace hero image" : "Click to upload the hero image (JPG, PNG, or WebP, up to 10MB)"}
            </label>
            <p className="mt-4 text-xs font-black uppercase tracking-eyebrow text-amanat-sage">Gallery (optional)</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {galleryImageUrls.map((url) => (
                <div key={url} className="relative h-20 w-16 overflow-hidden rounded-lg bg-amanat-sand">
                  <Image src={getDisplayMediaUrl(url)} alt="Gallery" fill sizes="64px" className="object-cover" />
                  <button type="button" aria-label="Remove gallery image" onClick={() => setGalleryImageUrls((urls) => urls.filter((item) => item !== url))} className="absolute right-1 top-1 rounded-full bg-red-700 px-1.5 text-xs font-black text-white">
                    ×
                  </button>
                </div>
              ))}
              <label className="flex h-20 w-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-amanat-brown/20 text-2xl font-bold">
                +
                <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => upload(event.target.files, (url) => setGalleryImageUrls((urls) => [...urls, url]))} />
              </label>
            </div>
          </div>
        </div>
        {isUploading && (
          <div className="mt-3 grid gap-2">
            {Object.entries(uploads).map(([fileName, percent]) => (
              <div key={fileName}>
                <div className="flex justify-between text-xs font-bold">
                  <span className="truncate">{fileName}</span>
                  <span>{percent}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-amanat-sand">
                  <div className="h-full rounded-full bg-amanat-terracotta transition-all" style={{ width: `${percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-heading text-2xl font-bold">Pricing</h2>
        <p className="text-sm text-stone-500">The customer&apos;s total is the price of everything they picked, minus this percentage — pick more, pay more (just discounted).</p>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Discount % (0–90)">
            <input type="number" min={0} max={90} step="0.01" value={discountPercent} onChange={(event) => setDiscountPercent(event.target.value)} className="field-input" />
            <input type="range" min={0} max={90} step={1} value={Number(discountPercent) || 0} onChange={(event) => setDiscountPercent(event.target.value)} aria-label="Discount slider" />
            {(percentValue == null || percentValue < 0 || percentValue > 90 || Number.isNaN(percentValue)) && (
              <span className="text-xs font-bold text-red-700">Discount must be between 0% and 90%.</span>
            )}
          </Field>
          <Field label="Packaging fee (₹, added after discount)">
            <input type="number" min={0} step="0.01" value={packagingFee} onChange={(event) => setPackagingFee(event.target.value)} className="field-input" />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Minimum items">
            <input type="number" min={1} value={minItems} onChange={(event) => setMinItems(event.target.value)} className="field-input" />
          </Field>
          <Field label="Maximum items (blank = unlimited)">
            <input type="number" min={1} value={maxItems} onChange={(event) => setMaxItems(event.target.value)} className="field-input" />
            {maxValue != null && maxValue < minValue && <span className="text-xs font-bold text-red-700">Maximum cannot be lower than minimum.</span>}
          </Field>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-heading text-2xl font-bold">Eligible products</h2>
        <p className="mt-1 text-sm text-stone-500">Customers pick from these. Mark a product “required” to pre-add and lock it into every hamper.</p>
        <div className="mt-4 grid gap-6 xl:grid-cols-2">
          <div>
            <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
              <input value={search} onChange={(event) => setSearch(event.target.value)} className="field-input" placeholder="Search products" />
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="field-input">
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>
            <ul className="mt-3 grid max-h-[26rem] gap-2 overflow-y-auto pr-1">
              {pickableProducts.map((product) => {
                const isPicked = picked.some((entry) => entry.productId === product._id);
                return (
                  <li key={product._id}>
                    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-2 ${isPicked ? "border-amanat-terracotta bg-amanat-cream" : "border-amanat-brown/10"}`}>
                      <input type="checkbox" checked={isPicked} onChange={() => togglePick(product._id)} className="h-4 w-4 shrink-0" />
                      <Image src={getDisplayMediaUrl(product.images[0]?.url)} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-lg bg-amanat-sand object-cover" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{product.name}</span>
                        <span className="block text-xs text-stone-500">{product.category}</span>
                      </span>
                      <span className="shrink-0 text-sm font-bold">{formatMoney(product.price)}</span>
                    </label>
                  </li>
                );
              })}
              {pickableProducts.length === 0 && <li className="p-4 text-center text-sm text-stone-500">No active products match.</li>}
            </ul>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-eyebrow text-amanat-sage">Selected ({picked.length})</p>
            {picked.length < (Number.isFinite(minValue) ? minValue : 1) && (
              <p className="mt-2 text-sm font-bold text-red-700">
                Only {picked.length} eligible — customers must pick at least {minItems || 1}. Add more products to save.
              </p>
            )}
            <ol className="mt-3 grid max-h-[26rem] gap-2 overflow-y-auto pr-1">
              {picked.map((entry, index) => {
                const product = productById.get(entry.productId);
                return (
                  <li key={entry.productId} className="flex items-center gap-2 rounded-xl border border-amanat-brown/10 p-2">
                    <span className="flex flex-col">
                      <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)} className="px-1 text-xs disabled:opacity-30">▲</button>
                      <button type="button" aria-label="Move down" disabled={index === picked.length - 1} onClick={() => move(index, 1)} className="px-1 text-xs disabled:opacity-30">▼</button>
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold">{product?.name ?? "Unknown product"}</span>
                    <label className="flex shrink-0 items-center gap-1 text-xs font-bold">
                      <input
                        type="checkbox"
                        checked={entry.isRequired}
                        onChange={(event) =>
                          setPicked((current) => current.map((item) => (item.productId === entry.productId ? { ...item, isRequired: event.target.checked } : item)))
                        }
                      />
                      Required
                    </label>
                    <button type="button" aria-label="Remove" onClick={() => togglePick(entry.productId)} className="text-sm font-black text-red-700">×</button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-amanat-terracotta/30 bg-amanat-cream p-5">
        <h2 className="font-heading text-2xl font-bold">Live price preview</h2>
        <p className="mt-1 text-sm text-stone-500">Uses the same calculation as the shop. Tick a sample basket to see real numbers.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {picked.map((entry) => {
            const product = productById.get(entry.productId);
            if (!product) return null;
            const isOn = sampleIds.includes(entry.productId);
            return (
              <label key={entry.productId} className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${isOn ? "border-amanat-terracotta bg-white" : "border-amanat-brown/15"}`}>
                <input
                  type="checkbox"
                  checked={isOn}
                  onChange={() => setSample(isOn ? sampleIds.filter((id) => id !== entry.productId) : [...sampleIds, entry.productId])}
                />
                {product.name} · {formatMoney(product.price)}
              </label>
            );
          })}
        </div>
        <p className="mt-4 rounded-xl bg-white p-4 text-sm font-bold leading-7" data-testid="hamper-preview">
          Customer picks {preview.itemCount} item{preview.itemCount === 1 ? "" : "s"} worth {formatMoney(sampleWorth)} →{" "}
          discount {percentValue ?? 0}% (−{formatMoney(preview.discountAmount)}){" "}
          → + {formatMoney(preview.packagingFee)} packaging → pays <span className="text-amanat-terracotta">{formatMoney(preview.total)}</span>
          {preview.savings > 0 ? `, saves ${formatMoney(preview.savings)}` : ""}
        </p>
        {!preview.isValid && <p className="mt-2 text-sm font-bold text-red-700">{preview.validationErrors[0]}</p>}
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" disabled={isSaving || isUploading} onClick={save} className="rounded-full bg-amanat-terracotta px-6 py-3 font-black text-white disabled:opacity-60">
          {isSaving ? "Saving..." : hamper ? "Save hamper" : "Create hamper"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-bold text-amanat-brown">{label}{children}</label>;
}
