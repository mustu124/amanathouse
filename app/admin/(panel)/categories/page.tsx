"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AdminSection } from "@/components/admin/AdminCards";
import { adminFetch } from "@/lib/admin-client";
import { getDisplayMediaUrl } from "@/lib/media";
import { CATEGORY_DETAILS, slugifyCategoryName } from "@/lib/product-data";

type CategorySetting = {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
  description?: string;
  image?: string;
  subcategories?: string[];
  subcategoriesInput?: string;
  visible?: boolean;
};

const defaultCategories: CategorySetting[] = CATEGORY_DETAILS.map((category) => ({
  id: crypto.randomUUID(),
  name: category.name,
  slug: category.slug,
  icon: category.icon,
  description: category.description,
  image: category.image,
  subcategories: [],
  subcategoriesInput: "",
  visible: true
}));

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategorySetting[]>(defaultCategories);
  const [baseSettings, setBaseSettings] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState("");
  const savedCategoryNames = useRef<string[]>(defaultCategories.map((category) => category.name));
  const storageKey = "amanat-house-categories-draft-v3";
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    adminFetch<{ settings: Record<string, unknown> & { categories?: Omit<CategorySetting, "id">[] } }>("/api/settings")
      .then((res) => {
        setBaseSettings(res.data.settings);
        const loadedCategories = res.data.settings.categories?.length ? res.data.settings.categories : defaultCategories;
        savedCategoryNames.current = loadedCategories.map((category) => category.name);
        setCategories(
          loadedCategories.map((category) => ({
            ...category,
            id: crypto.randomUUID(),
            subcategoriesInput: category.subcategories?.join(", ") ?? ""
          }))
        );

        const draft = window.localStorage.getItem(storageKey);
        if (draft) {
          setCategories(
            (JSON.parse(draft) as CategorySetting[]).map((category) => ({ ...category, id: category.id || crypto.randomUUID() }))
          );
          toast("Unsaved category draft restored.");
        }
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setIsLoading(false));
  }, []);

  const visibleCount = useMemo(() => categories.filter((category) => category.visible !== false).length, [categories]);

  useEffect(() => {
    if (!isLoading) window.localStorage.setItem(storageKey, JSON.stringify(categories));
  }, [categories, isLoading]);

  const update = (id: string, key: keyof CategorySetting, value: string | boolean) => {
    setCategories((current) => current.map((category) => (category.id === id ? { ...category, [key]: value } : category)));
  };

  const addCategory = () => {
    setCategories((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: `New category ${current.length + 1}`,
        icon: "✦",
        description: "",
        image: "",
        subcategories: [],
        subcategoriesInput: "",
        visible: true
      }
    ]);
  };

  const removeCategory = (id: string, name: string) => {
    if (!window.confirm(`Remove "${name}"? Any products still assigned to this category will stay in the catalog but won't be reachable from a category filter until you reassign them.`)) {
      return;
    }
    setCategories((current) => current.filter((category) => category.id !== id));
  };

  const uploadImage = async (id: string, file?: File) => {
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB.");
      return;
    }

    const body = new FormData();
    body.append("file", file);
    setUploadingId(id);

    try {
      const result = await adminFetch<{ url: string }>("/api/upload", { method: "POST", body });
      update(id, "image", result.data.url);
      toast.success("Category image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingId("");
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return;
    setCategories((current) => {
      const oldIndex = current.findIndex((category) => category.id === event.active.id);
      const newIndex = current.findIndex((category) => category.id === event.over?.id);
      return arrayMove(current, oldIndex, newIndex);
    });
  };

  const save = async () => {
    setIsSaving(true);
    try {
      const payloadCategories = categories.map(({ id: _id, subcategoriesInput, ...category }) => ({
        ...category,
        slug: slugifyCategoryName(category.name),
        subcategories: (subcategoriesInput ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      }));

      const categoryRenames = payloadCategories.flatMap((category, index) => {
        const previousName = savedCategoryNames.current[index];
        return previousName && previousName !== category.name
          ? [{ from: previousName, to: category.name }]
          : [];
      });

      if (payloadCategories.some((category) => !category.name.trim())) {
        throw new Error("Every category needs a name.");
      }

      const normalizedNames = payloadCategories.map((category) => category.name.trim().toLowerCase());
      if (new Set(normalizedNames).size !== normalizedNames.length) {
        throw new Error("Category names must be unique.");
      }

      const saved = await adminFetch<{ settings: Record<string, unknown> }>("/api/settings", {
        method: "PUT",
        body: JSON.stringify({ ...baseSettings, categories: payloadCategories, categoryRenames })
      });
      setBaseSettings(saved.data.settings);
      savedCategoryNames.current = payloadCategories.map((category) => category.name);
      window.localStorage.removeItem(storageKey);
      toast.success("Categories saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-amanat-sage">Catalog</p>
          <h1 className="font-heading text-4xl font-bold text-amanat-brown">Categories</h1>
          <p className="mt-1 text-sm text-stone-500">
            {visibleCount} visible categories. Drag a card by its handle to change the display order shown on the homepage and shop filters.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={isSaving || isLoading} onClick={addCategory} className="rounded-full border border-amanat-brown px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-amanat-brown disabled:opacity-60">
            Add Category
          </button>
          <button disabled={isSaving || isLoading} onClick={save} className="rounded-full bg-amanat-terracotta px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-white disabled:opacity-60">
            {isSaving ? "Saving..." : "Save Categories"}
          </button>
        </div>
      </div>

      <AdminSection title="Category Manager" description="Edit display labels, photos, descriptions, order, and storefront visibility.">
        {isLoading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-amanat-cream" />)}
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={categories.map((category) => category.id)} strategy={verticalListSortingStrategy}>
              <div className="grid gap-3">
                {categories.map((category) => (
                  <SortableCategory
                    key={category.id}
                    category={category}
                    uploading={uploadingId === category.id}
                    onChange={update}
                    onUpload={uploadImage}
                    onRemove={() => removeCategory(category.id, category.name)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </AdminSection>
    </div>
  );
}

function SortableCategory({
  category,
  uploading,
  onChange,
  onUpload,
  onRemove
}: {
  category: CategorySetting;
  uploading: boolean;
  onChange: (id: string, key: keyof CategorySetting, value: string | boolean) => void;
  onUpload: (id: string, file?: File) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category.id });
  const previewUrl = category.image ? getDisplayMediaUrl(category.image) : `/categories/${category.slug || slugifyCategoryName(category.name)}.jpg`;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="grid gap-3 rounded-2xl border border-amanat-brown/10 bg-amanat-cream p-4 md:grid-cols-[auto_120px_1fr_1.4fr_1.2fr_auto] md:items-center"
    >
      <button type="button" {...attributes} {...listeners} aria-label="Drag to reorder" className="hidden h-9 w-9 items-center justify-center rounded-full border border-amanat-brown/20 bg-white text-sm font-black text-amanat-brown md:flex">
        ⠿
      </button>

      <div className="grid gap-2">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-amanat-sand">
          <Image src={previewUrl} alt={category.name} fill sizes="120px" className="object-cover" />
        </div>
        <label className="rounded-full bg-white px-2 py-1.5 text-center text-xs font-black uppercase tracking-[0.1em] text-amanat-brown">
          {uploading ? "Uploading..." : "Upload Photo"}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onUpload(category.id, event.target.files?.[0])} className="hidden" />
        </label>
      </div>

      <label className="grid gap-1 text-xs font-black uppercase tracking-[0.12em] text-amanat-sage">
        Name
        <input value={category.name} onChange={(event) => onChange(category.id, "name", event.target.value)} className="field-input bg-white" />
        <span className="text-xs font-bold normal-case tracking-normal text-stone-400">
          /shop?category={slugifyCategoryName(category.name) || "..."}
        </span>
      </label>
      <label className="grid gap-1 text-xs font-black uppercase tracking-[0.12em] text-amanat-sage">
        Description
        <input value={category.description ?? ""} onChange={(event) => onChange(category.id, "description", event.target.value)} className="field-input bg-white" />
      </label>
      <label className="grid gap-1 text-xs font-black uppercase tracking-[0.12em] text-amanat-sage">
        Subcategories
        <input value={category.subcategoriesInput ?? ""} onChange={(event) => onChange(category.id, "subcategoriesInput", event.target.value)} className="field-input bg-white" placeholder="Comma separated" />
      </label>

      <div className="grid gap-2">
        <label className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-black text-amanat-brown">
          <input type="checkbox" checked={category.visible !== false} onChange={(event) => onChange(category.id, "visible", event.target.checked)} />
          Visible
        </label>
        <button type="button" onClick={onRemove} className="rounded-full border border-red-700 px-3 py-2 text-xs font-black uppercase tracking-[0.1em] text-red-700">
          Remove
        </button>
      </div>
    </div>
  );
}
