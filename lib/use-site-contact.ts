"use client";

import { useEffect, useState } from "react";
import { env } from "@/lib/env";

export type SiteContact = {
  email: string;
  whatsappNumber: string;
  instagramUrl: string;
  address: string;
};

const fallback: SiteContact = {
  email: env.storeEmail,
  whatsappNumber: env.whatsappNumber,
  instagramUrl: env.instagramUrl,
  address: env.storeAddress
};

type SettingsShape = {
  storeEmail?: string;
  whatsappNumber?: string;
  storeAddress?: string;
  socialLinks?: { instagram?: string };
};

const CACHE_MS = 30_000;
let cached: { value: SiteContact; at: number } | null = null;
let inflight: Promise<SiteContact> | null = null;

// The admin's Site Settings win over the build-time env values, so a change
// made in /admin/settings shows up on every page without a redeploy. Env
// values are only the fallback for a blank setting or a failed request.
function loadSiteContact(): Promise<SiteContact> {
  if (cached && Date.now() - cached.at < CACHE_MS) return Promise.resolve(cached.value);
  if (inflight) return inflight;

  inflight = fetch("/api/settings", { cache: "no-store" })
    .then((response) => response.json())
    .then((payload: { data?: { settings?: SettingsShape } }) => {
      const settings: SettingsShape = payload.data?.settings ?? {};
      const value: SiteContact = {
        email: settings.storeEmail?.trim() || fallback.email,
        whatsappNumber: settings.whatsappNumber?.trim() || fallback.whatsappNumber,
        instagramUrl: settings.socialLinks?.instagram?.trim() || fallback.instagramUrl,
        address: settings.storeAddress?.trim() || fallback.address
      };
      cached = { value, at: Date.now() };
      return value;
    })
    .catch(() => fallback)
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function useSiteContact(): SiteContact {
  const [contact, setContact] = useState<SiteContact>(cached?.value ?? fallback);

  useEffect(() => {
    let isMounted = true;
    loadSiteContact().then((value) => {
      if (isMounted) setContact(value);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return contact;
}
