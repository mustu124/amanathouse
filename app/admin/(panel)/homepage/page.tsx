"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AdminSection, ConfirmButton } from "@/components/admin/AdminCards";
import { adminFetch } from "@/lib/admin-client";
import { getDisplayMediaUrl } from "@/lib/media";

type HeroSlide = {
  image: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
};

type HeroSlideDraft = HeroSlide & { id: string };

type SettingsPayload = {
  heroSlides: HeroSlide[];
  mobileHeroSlides?: HeroSlide[];
  announcementText?: string;
  metaTitle?: string;
  metaDescription?: string;
};

const blankSlide = (index = 1): HeroSlideDraft => ({
  id: crypto.randomUUID(),
  image: "/logo.png",
  title: `Homepage slide ${index}`,
  subtitle: "Everyday jewellery in 18K gold-plated steel — anti-tarnish, waterproof, made to be kept.",
  ctaText: "Shop Now",
  ctaLink: "/shop"
});

export default function AdminHomepagePage() {
  const [slides, setSlides] = useState<HeroSlideDraft[]>([blankSlide()]);
  const [mobileSlides, setMobileSlides] = useState<HeroSlideDraft[]>(
    Array.from({ length: 10 }, (_, index) => blankSlide(index + 1))
  );
  const [announcementText, setAnnouncementText] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState("");
  const storageKey = "amanat-house-homepage-draft-v2";
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    adminFetch<{ settings: SettingsPayload }>("/api/settings")
      .then((res) => {
        const settings = res.data.settings;
        setSlides((settings.heroSlides?.length ? settings.heroSlides : [blankSlide()]).map((slide) => ({ ...slide, id: crypto.randomUUID() })));
        setMobileSlides(
          Array.from({ length: 10 }, (_, index) => {
            const slide = settings.mobileHeroSlides?.[index] ?? blankSlide(index + 1);
            return { ...slide, id: crypto.randomUUID() };
          })
        );
        setAnnouncementText(settings.announcementText ?? "");
        setMetaTitle(settings.metaTitle ?? "");
        setMetaDescription(settings.metaDescription ?? "");

        const draft = window.localStorage.getItem(storageKey);
        if (draft) {
          const parsed = JSON.parse(draft) as SettingsPayload;
          setSlides((parsed.heroSlides?.length ? parsed.heroSlides : [blankSlide()]).map((slide) => ({ ...slide, id: crypto.randomUUID() })));
          setMobileSlides(
            Array.from({ length: 10 }, (_, index) => {
              const slide = parsed.mobileHeroSlides?.[index] ?? blankSlide(index + 1);
              return { ...slide, id: crypto.randomUUID() };
            })
          );
          setAnnouncementText(parsed.announcementText ?? "");
          setMetaTitle(parsed.metaTitle ?? "");
          setMetaDescription(parsed.metaDescription ?? "");
          toast("Unsaved homepage draft restored.");
        }
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setIsLoading(false));
  }, []);

  const draft = useMemo<SettingsPayload>(
    () => ({
      heroSlides: slides.map(({ id: _id, ...slide }) => slide),
      mobileHeroSlides: mobileSlides.map(({ id: _id, ...slide }) => slide),
      announcementText,
      metaTitle,
      metaDescription
    }),
    [announcementText, metaDescription, metaTitle, mobileSlides, slides]
  );

  useEffect(() => {
    if (!isLoading) window.localStorage.setItem(storageKey, JSON.stringify(draft));
  }, [draft, isLoading]);

  const updateSlide = (id: string, key: keyof HeroSlide, value: string) => {
    setSlides((current) => current.map((slide) => (slide.id === id ? { ...slide, [key]: value } : slide)));
  };

  const updateMobileSlide = (id: string, key: keyof HeroSlide, value: string) => {
    setMobileSlides((current) => current.map((slide) => (slide.id === id ? { ...slide, [key]: value } : slide)));
  };

  const uploadSlideImage = async (id: string, file?: File) => {
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    setUploadingId(id);
    try {
      const result = await adminFetch<{ url: string }>("/api/upload", { method: "POST", body });
      updateSlide(id, "image", result.data.url);
      toast.success("Slide image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingId("");
    }
  };

  const uploadMobileSlideImage = async (id: string, file?: File) => {
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    setUploadingId(id);
    try {
      const result = await adminFetch<{ url: string }>("/api/upload", { method: "POST", body });
      updateMobileSlide(id, "image", result.data.url);
      toast.success("Mobile slide image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingId("");
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return;
    const oldIndex = slides.findIndex((slide) => slide.id === event.active.id);
    const newIndex = slides.findIndex((slide) => slide.id === event.over?.id);
    setSlides(arrayMove(slides, oldIndex, newIndex));
  };

  const save = async () => {
    setIsSaving(true);
    try {
      const existing = await adminFetch<{ settings: Record<string, unknown> }>("/api/settings");
      const saved = await adminFetch<{ settings: SettingsPayload }>("/api/settings", {
        method: "PUT",
        body: JSON.stringify({ ...existing.data.settings, ...draft })
      });
      setSlides(saved.data.settings.heroSlides.map((slide) => ({ ...slide, id: crypto.randomUUID() })));
      setMobileSlides(
        Array.from({ length: 10 }, (_, index) => {
          const slide = saved.data.settings.mobileHeroSlides?.[index] ?? blankSlide(index + 1);
          return { ...slide, id: crypto.randomUUID() };
        })
      );
      window.localStorage.removeItem(storageKey);
      toast.success("Homepage settings saved");
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
          <p className="text-sm font-black uppercase tracking-[0.18em] text-amanat-sage">Storefront</p>
          <h1 className="font-heading text-4xl font-bold text-amanat-brown">Homepage Settings</h1>
        </div>
        <button disabled={isSaving || isLoading} onClick={save} className="rounded-full bg-amanat-terracotta px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-white disabled:opacity-60">
          {isSaving ? "Saving..." : "Save Homepage"}
        </button>
      </div>

      <AdminSection title="Hero Slides" description="Drag slides to reorder them. The first slide appears first on the homepage.">
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-2xl bg-amanat-cream" />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={slides.map((slide) => slide.id)} strategy={verticalListSortingStrategy}>
              <div className="grid gap-4">
                {slides.map((slide, index) => (
                  <SortableSlide
                    key={slide.id}
                    slide={slide}
                    index={index}
                    uploading={uploadingId === slide.id}
                    onChange={updateSlide}
                    onUpload={uploadSlideImage}
                    onRemove={() => setSlides((current) => current.filter((item) => item.id !== slide.id))}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
        <button type="button" onClick={() => setSlides((current) => [...current, blankSlide()])} className="mt-4 rounded-full border border-amanat-brown px-5 py-2 text-sm font-black text-amanat-brown">
          Add Slide
        </button>
      </AdminSection>

      <AdminSection title="Mobile Homepage Slides" description="These 10 slides are used only on mobile. Use portrait or square artwork with short headings for the cleanest result.">
        <div className="grid gap-4">
          {mobileSlides.map((slide, index) => (
            <SortableSlide
              key={slide.id}
              slide={slide}
              index={index}
              uploading={uploadingId === slide.id}
              onChange={updateMobileSlide}
              onUpload={uploadMobileSlideImage}
              onRemove={() =>
                setMobileSlides((current) =>
                  current.map((item) => (item.id === slide.id ? { ...blankSlide(index + 1), id: item.id } : item))
                )
              }
            />
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Announcement">
        <label className="grid gap-2 text-sm font-bold text-amanat-brown">
          Announcement ticker text
          <textarea value={announcementText} onChange={(event) => setAnnouncementText(event.target.value)} className="field-input min-h-28" />
        </label>
      </AdminSection>

      <AdminSection title="Homepage SEO">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-amanat-brown">
            Meta title
            <input value={metaTitle} onChange={(event) => setMetaTitle(event.target.value)} className="field-input" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-amanat-brown md:col-span-2">
            Meta description
            <textarea value={metaDescription} onChange={(event) => setMetaDescription(event.target.value)} className="field-input min-h-28" />
          </label>
        </div>
      </AdminSection>
    </div>
  );
}

function SortableSlide({
  slide,
  index,
  uploading,
  onChange,
  onUpload,
  onRemove
}: {
  slide: HeroSlideDraft;
  index: number;
  uploading: boolean;
  onChange: (id: string, key: keyof HeroSlide, value: string) => void;
  onUpload: (id: string, file?: File) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: slide.id });
  const [previewFailed, setPreviewFailed] = useState(false);
  const previewUrl = getDisplayMediaUrl(slide.image);

  useEffect(() => {
    setPreviewFailed(false);
  }, [previewUrl]);

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="grid gap-4 rounded-2xl border border-amanat-brown/10 bg-amanat-cream p-4 md:grid-cols-[180px_1fr]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-amanat-sand">
        {previewFailed ? (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs font-black uppercase tracking-[0.12em] text-amanat-brown/60">
            Preview loading
          </div>
        ) : (
          <Image
            src={previewUrl}
            alt={slide.title || "Hero slide"}
            fill
            sizes="180px"
            className="object-cover"
            onError={() => setPreviewFailed(true)}
          />
        )}
        <span className="absolute left-2 top-2 rounded-full bg-amanat-brown px-2 py-1 text-xs font-black text-white">#{index + 1}</span>
      </div>
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" {...attributes} {...listeners} className="rounded-full border border-amanat-brown/20 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-amanat-brown">
            Drag
          </button>
          <label className="rounded-full bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-amanat-brown">
            {uploading ? "Uploading..." : "Upload Image"}
            <input type="file" accept="image/*" onChange={(event) => onUpload(slide.id, event.target.files?.[0])} className="hidden" />
          </label>
          <ConfirmButton message="Remove this slide?" onConfirm={onRemove} className="rounded-full bg-red-700 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white">
            Remove
          </ConfirmButton>
        </div>
        <input value={slide.image} onChange={(event) => onChange(slide.id, "image", event.target.value)} className="field-input" placeholder="Image URL" />
        <div className="grid gap-3 md:grid-cols-2">
          <input value={slide.title} onChange={(event) => onChange(slide.id, "title", event.target.value)} className="field-input" placeholder="Title" />
          <input value={slide.subtitle ?? ""} onChange={(event) => onChange(slide.id, "subtitle", event.target.value)} className="field-input" placeholder="Subtitle" />
          <input value={slide.ctaText ?? ""} onChange={(event) => onChange(slide.id, "ctaText", event.target.value)} className="field-input" placeholder="CTA text" />
          <input value={slide.ctaLink ?? ""} onChange={(event) => onChange(slide.id, "ctaLink", event.target.value)} className="field-input" placeholder="CTA link" />
        </div>
      </div>
    </div>
  );
}
