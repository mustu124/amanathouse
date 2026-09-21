"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AdminSection } from "@/components/admin/AdminCards";
import { adminFetch } from "@/lib/admin-client";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

type SiteSettings = {
  whatsappNumber?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    whatsappGroup?: string;
  };
  aboutText?: string;
  storeEmail?: string;
  footerCopyright?: string;
};

export default function AdminSiteSettingsPage() {
  const [form, setForm] = useState<SiteSettings>({
    whatsappNumber: "",
    socialLinks: { instagram: "", facebook: "", whatsappGroup: "" },
    aboutText: "",
    storeEmail: "",
    footerCopyright: ""
  });
  const [baseSettings, setBaseSettings] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // v3: earlier versions saved the untouched form as a "draft" on every visit, which then
  // overwrote newer saved values on the next visit. Drafts now only exist for real edits.
  const storageKey = "amanat-house-site-settings-draft-v3";
  const [serverForm, setServerForm] = useState<SiteSettings | null>(null);

  useEffect(() => {
    adminFetch<{ settings: Record<string, unknown> & SiteSettings }>("/api/settings")
      .then((res) => {
        const settings = res.data.settings;
        setBaseSettings(settings);
        const loaded: SiteSettings = {
          whatsappNumber: settings.whatsappNumber ?? "",
          socialLinks: {
            instagram: settings.socialLinks?.instagram ?? "",
            facebook: settings.socialLinks?.facebook ?? "",
            whatsappGroup: settings.socialLinks?.whatsappGroup ?? ""
          },
          aboutText: settings.aboutText ?? "",
          storeEmail: settings.storeEmail ?? "",
          footerCopyright: settings.footerCopyright ?? ""
        };
        setForm(loaded);
        setServerForm(loaded);

        const draft = window.localStorage.getItem(storageKey);
        if (draft && draft !== JSON.stringify(loaded)) {
          setForm(JSON.parse(draft) as SiteSettings);
          toast("Unsaved site settings draft restored.");
        }
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setIsLoading(false));
  }, []);

  const draft = useMemo(() => form, [form]);

  useEffect(() => {
    if (isLoading || !serverForm) return;
    if (JSON.stringify(draft) === JSON.stringify(serverForm)) window.localStorage.removeItem(storageKey);
    else window.localStorage.setItem(storageKey, JSON.stringify(draft));
  }, [draft, isLoading, serverForm]);

  const update = (key: keyof SiteSettings, value: unknown) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateSocial = (key: "instagram" | "facebook" | "whatsappGroup", value: string) => {
    setForm((current) => ({
      ...current,
      socialLinks: {
        ...current.socialLinks,
        [key]: value
      }
    }));
  };

  const save = async () => {
    setIsSaving(true);
    try {
      const saved = await adminFetch<{ settings: Record<string, unknown> & SiteSettings }>("/api/settings", {
        method: "PUT",
        body: JSON.stringify({ ...baseSettings, ...form })
      });
      setBaseSettings(saved.data.settings);
      setServerForm(form);
      window.localStorage.removeItem(storageKey);
      toast.success("Site settings saved");
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
          <p className="text-sm font-black uppercase tracking-[0.18em] text-amanat-sage">Configuration</p>
          <h1 className="font-heading text-4xl font-bold text-amanat-brown">Site Settings</h1>
        </div>
        <button disabled={isSaving || isLoading} onClick={save} className="rounded-full bg-amanat-terracotta px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-white disabled:opacity-60">
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <AdminSection title="Contact and Social">
        {isLoading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-amanat-cream" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-amanat-brown">
              WhatsApp number
              <input value={form.whatsappNumber ?? ""} onChange={(event) => update("whatsappNumber", event.target.value)} className="field-input" placeholder="919999999999" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-amanat-brown">
              Store email
              <input type="email" value={form.storeEmail ?? ""} onChange={(event) => update("storeEmail", event.target.value)} className="field-input" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-amanat-brown">
              Instagram URL
              <input value={form.socialLinks?.instagram ?? ""} onChange={(event) => updateSocial("instagram", event.target.value)} className="field-input" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-amanat-brown">
              Facebook URL
              <input value={form.socialLinks?.facebook ?? ""} onChange={(event) => updateSocial("facebook", event.target.value)} className="field-input" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-amanat-brown md:col-span-2">
              WhatsApp community group link
              <input value={form.socialLinks?.whatsappGroup ?? ""} onChange={(event) => updateSocial("whatsappGroup", event.target.value)} className="field-input" placeholder="https://chat.whatsapp.com/..." />
            </label>
          </div>
        )}
      </AdminSection>

      <AdminSection title="About Page Text" description="Markdown is supported for headings, paragraphs, and lists.">
        <div data-color-mode="light">
          <MDEditor value={form.aboutText ?? ""} onChange={(value) => update("aboutText", value ?? "")} height={260} />
        </div>
      </AdminSection>

      <AdminSection title="Footer">
        <label className="grid gap-2 text-sm font-bold text-amanat-brown">
          Footer copyright text
          <input value={form.footerCopyright ?? ""} onChange={(event) => update("footerCopyright", event.target.value)} className="field-input" placeholder="(c) 2026 Amanat House" />
        </label>
      </AdminSection>
    </div>
  );
}
