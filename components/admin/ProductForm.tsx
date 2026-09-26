"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { METAL_TONES, PRODUCT_BADGES, PRODUCT_CATEGORIES, slugifyProductName, type StoreProduct } from "@/lib/product-data";
import { adminFetch, uploadWithProgress, validateImageFile } from "@/lib/admin-client";
import { getDisplayMediaUrl } from "@/lib/media";

type ProductDraft = Partial<Omit<StoreProduct, "category">> & {
  category?: string;
  tagsInput?: string;
  stackWithInput?: string;
};

type CategorySetting = {
  name: string;
  subcategories?: string[];
};

const blankProduct: ProductDraft = {
  name: "",
  slug: "",
  category: "Rings",
  subcategory: "",
  description: "",
  price: 0,
  originalPrice: 0,
  images: [],
  dimensions: "",
  careInstructions: "",
  shippingInfo: "",
  tagsInput: "",
  isFeatured: false,
  inStock: true,
  stockCount: 0,
  material: "316L Stainless Steel",
  plating: "18K PVD Gold",
  metalTone: "gold",
  size: "",
  weightGrams: undefined,
  isWaterproof: true,
  isAntiTarnish: true,
  stackWithInput: "",
  badges: []
};

export function ProductForm({ product }: { product?: StoreProduct }) {
  const router = useRouter();
  const storageKey = `amanat-house-product-draft-${product?.slug ?? "new"}`;
  const [form, setForm] = useState<ProductDraft>(() => {
    if (product) {
      return {
        ...product,
        tagsInput: product.tags?.join(", ") ?? "",
        stackWithInput: product.stackWith?.join(", ") ?? ""
      };
    }
    return blankProduct;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [categorySettings, setCategorySettings] = useState<CategorySetting[]>([]);
  const isUploading = Object.keys(uploadProgress).length > 0;
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored && !product) setForm(JSON.parse(stored) as ProductDraft);
  }, [product, storageKey]);

  useEffect(() => {
    adminFetch<{ settings: { categories?: CategorySetting[] } }>("/api/settings")
      .then((res) => setCategorySettings(res.data.settings.categories ?? []))
      .catch(() => setCategorySettings([]));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(form));
  }, [form, storageKey]);

  const slug = useMemo(() => slugifyProductName(form.name ?? ""), [form.name]);
  const availableSubcategories = useMemo(() => {
    return categorySettings.find((category) => category.name === form.category)?.subcategories ?? [];
  }, [categorySettings, form.category]);
  const availableCategories = useMemo(() => {
    const configured = categorySettings.map((category) => category.name).filter(Boolean);
    const current = form.category ? [String(form.category)] : [];
    return Array.from(new Set(configured.length ? [...configured, ...current] : [...PRODUCT_CATEGORIES, ...current]));
  }, [categorySettings, form.category]);

  useEffect(() => {
    if (!availableSubcategories.length || form.subcategory) return;
    setForm((current) => ({ ...current, subcategory: availableSubcategories[0] }));
  }, [availableSubcategories, form.subcategory]);

  const update = (key: keyof ProductDraft, value: unknown) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateCategory = (category: string) => {
    const nextSubcategories = categorySettings.find((item) => item.name === category)?.subcategories ?? [];
    setForm((current) => ({
      ...current,
      category,
      subcategory: nextSubcategories.includes(current.subcategory ?? "") ? current.subcategory : nextSubcategories[0] ?? ""
    }));
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;

    for (const file of Array.from(files)) {
      const problem = await validateImageFile(file);
      if (problem) {
        toast.error(problem);
        continue;
      }

      setUploadProgress((current) => ({ ...current, [file.name]: 0 }));

      try {
        const result = await uploadWithProgress("/api/upload", file, (percent) => {
          setUploadProgress((current) => ({ ...current, [file.name]: percent }));
        });
        setForm((current) => ({
          ...current,
          images: [
            ...(current.images ?? []),
            { url: result.data.url, publicId: result.data.publicId, alt: current.name ?? "Product image" }
          ]
        }));
        toast.success(`${file.name} uploaded`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : `${file.name}: upload failed`);
      } finally {
        setUploadProgress((current) => {
          const { [file.name]: _removed, ...rest } = current;
          return rest;
        });
      }
    }
  };

  const save = async (publish: boolean) => {
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        slug: form.slug || slug,
        active: publish,
        featured: Boolean(form.isFeatured),
        tags: form.tagsInput?.split(",").map((tag) => tag.trim()).filter(Boolean) ?? [],
        stackWith: form.stackWithInput?.split(",").map((item) => item.trim()).filter(Boolean) ?? []
      };
      const url = product ? `/api/products/${product.slug}` : "/api/products";
      const method = product ? "PUT" : "POST";
      const result = await adminFetch<{ product: StoreProduct }>(url, { method, body: JSON.stringify(payload) });
      window.localStorage.removeItem(storageKey);
      toast.success(publish ? "Product published" : "Draft saved");

      const finalSlug = result.data.product.slug;
      if (!product) {
        if (finalSlug !== payload.slug) {
          toast(`Slug "${payload.slug}" was already in use — saved as "${finalSlug}" instead.`, { icon: "ℹ️" });
        }
        router.push(`/admin/products/${finalSlug}/edit`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const images = form.images ?? [];
    const oldIndex = images.findIndex((image) => image.url === active.id);
    const newIndex = images.findIndex((image) => image.url === over.id);
    update("images", arrayMove(images, oldIndex, newIndex));
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name">
            <input value={form.name ?? ""} onChange={(e) => update("name", e.target.value)} className="field-input" />
          </Field>
          <Field label="Category">
            <select value={form.category} onChange={(e) => updateCategory(e.target.value)} className="field-input">
              {availableCategories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </Field>
          <Field label="Subcategory">
            {availableSubcategories.length ? (
              <select value={form.subcategory ?? ""} onChange={(e) => update("subcategory", e.target.value)} className="field-input">
                <option value="">No subcategory</option>
                {availableSubcategories.map((subcategory) => (
                  <option key={subcategory} value={subcategory}>
                    {subcategory}
                  </option>
                ))}
              </select>
            ) : (
              <input value={form.subcategory ?? ""} onChange={(e) => update("subcategory", e.target.value)} className="field-input" placeholder="Add subcategories in Admin > Categories" />
            )}
          </Field>
          <Field label="Price">
            <input type="number" value={form.price ?? 0} onChange={(e) => update("price", Number(e.target.value))} className="field-input" />
          </Field>
          <Field label="Original Price">
            <input type="number" value={form.originalPrice ?? 0} onChange={(e) => update("originalPrice", Number(e.target.value))} className="field-input" />
          </Field>
          <Field label="Stock Count">
            <input
              type="number"
              value={form.stockCount ?? 0}
              onChange={(e) => {
                const stockCount = Number(e.target.value);
                setForm((current) => ({ ...current, stockCount, inStock: stockCount > 0 }));
              }}
              className="field-input"
            />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            value={form.description ?? ""}
            onChange={(event) => update("description", event.target.value)}
            className="field-input min-h-40 resize-y"
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Dimensions">
            <textarea value={form.dimensions ?? ""} onChange={(e) => update("dimensions", e.target.value)} className="field-input min-h-24" />
          </Field>
          <Field label="Care Instructions">
            <textarea value={form.careInstructions ?? ""} onChange={(e) => update("careInstructions", e.target.value)} className="field-input min-h-24" />
          </Field>
          <Field label="Shipping Info">
            <textarea value={form.shippingInfo ?? ""} onChange={(e) => update("shippingInfo", e.target.value)} className="field-input min-h-24" />
          </Field>
          <Field label="Tags">
            <input value={form.tagsInput ?? ""} onChange={(e) => update("tagsInput", e.target.value)} className="field-input" placeholder="gold, ring, gift" />
          </Field>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={Boolean(form.isFeatured)} onChange={(e) => update("isFeatured", e.target.checked)} /> Featured</label>
          <label className={`flex items-center gap-2 font-bold ${(form.stockCount ?? 0) <= 0 ? "opacity-50" : ""}`}>
            <input
              type="checkbox"
              checked={Boolean(form.inStock) && (form.stockCount ?? 0) > 0}
              disabled={(form.stockCount ?? 0) <= 0}
              onChange={(e) => update("inStock", e.target.checked)}
            />
            In Stock {(form.stockCount ?? 0) <= 0 && "(set Stock Count above 0 to enable)"}
          </label>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-heading text-2xl font-bold">Jewellery Details</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Material">
            <input value={form.material ?? ""} onChange={(e) => update("material", e.target.value)} className="field-input" placeholder="316L Stainless Steel" />
          </Field>
          <Field label="Plating">
            <input value={form.plating ?? ""} onChange={(e) => update("plating", e.target.value)} className="field-input" placeholder="18K PVD Gold" />
          </Field>
          <Field label="Metal Tone">
            <select value={form.metalTone ?? "gold"} onChange={(e) => update("metalTone", e.target.value)} className="field-input">
              {METAL_TONES.map((tone) => (
                <option key={tone} value={tone}>
                  {tone === "rose-gold" ? "Rose Gold" : tone[0].toUpperCase() + tone.slice(1)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Size">
            <input value={form.size ?? ""} onChange={(e) => update("size", e.target.value)} className="field-input" placeholder="Ring size, chain length, etc." />
          </Field>
          <Field label="Weight (grams)">
            <input
              type="number"
              step="0.01"
              value={form.weightGrams ?? ""}
              onChange={(e) => update("weightGrams", e.target.value === "" ? undefined : Number(e.target.value))}
              className="field-input"
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 font-bold">
            <input type="checkbox" checked={Boolean(form.isWaterproof)} onChange={(e) => update("isWaterproof", e.target.checked)} /> Waterproof
          </label>
          <label className="flex items-center gap-2 font-bold">
            <input type="checkbox" checked={Boolean(form.isAntiTarnish)} onChange={(e) => update("isAntiTarnish", e.target.checked)} /> Anti-Tarnish
          </label>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-eyebrow text-amanat-sage">Badges</p>
          <div className="mt-2 flex flex-wrap gap-4">
            {PRODUCT_BADGES.map((badge) => (
              <label key={badge} className="flex items-center gap-2 font-bold">
                <input
                  type="checkbox"
                  checked={form.badges?.includes(badge) ?? false}
                  onChange={(e) => {
                    const current = form.badges ?? [];
                    update("badges", e.target.checked ? [...current, badge] : current.filter((b) => b !== badge));
                  }}
                />
                {badge}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-heading text-2xl font-bold">Images</h2>
        <label className="mt-4 flex min-h-36 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-amanat-brown/20 bg-amanat-cream p-6 text-center font-bold">
          <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadFiles(e.target.files)} className="hidden" />
          {isUploading ? "Uploading..." : "Drag images here or click to upload (JPG, PNG, or WebP, up to 10MB)"}
        </label>
        {isUploading && (
          <div className="mt-3 grid gap-2">
            {Object.entries(uploadProgress).map(([fileName, percent]) => (
              <div key={fileName}>
                <div className="flex justify-between text-xs font-bold text-amanat-brown">
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={(form.images ?? []).map((image) => image.url)} strategy={rectSortingStrategy}>
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
              {(form.images ?? []).map((image, index) => (
                <SortableImage
                  key={image.url}
                  image={image}
                  index={index}
                  onDelete={() => update("images", (form.images ?? []).filter((item) => item.url !== image.url))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" disabled={isSaving || isUploading} onClick={() => save(false)} className="rounded-full border border-amanat-brown px-6 py-3 font-black disabled:opacity-60">Save Draft</button>
        <button type="button" disabled={isSaving || isUploading} onClick={() => save(true)} className="rounded-full bg-amanat-terracotta px-6 py-3 font-black text-white disabled:opacity-60">
          {isSaving ? "Saving..." : "Publish"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-bold text-amanat-brown">{label}{children}</label>;
}

function SortableImage({
  image,
  index,
  onDelete
}: {
  image: { url: string; alt?: string };
  index: number;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: image.url });

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="relative aspect-square overflow-hidden rounded-xl bg-amanat-sand">
      <Image src={getDisplayMediaUrl(image.url)} alt={image.alt ?? "Product image"} fill className="object-cover" {...attributes} {...listeners} />
      {index === 0 && <span className="absolute left-2 top-2 rounded-full bg-amanat-brown px-2 py-1 text-xs font-black text-white">Main</span>}
      <button type="button" onClick={onDelete} className="absolute right-2 top-2 rounded-full bg-red-700 px-2 py-1 text-xs font-black text-white">Delete</button>
    </div>
  );
}
