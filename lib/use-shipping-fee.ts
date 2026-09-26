"use client";

import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";

// The flat shipping fee the admin sets in Site Settings, applied to every
// order. 0 until an admin sets one. Mirrors the useSiteContact pattern:
// seeded server-side so the first render already shows the live value, then
// kept fresh via a light client fetch (so a change in another tab shows up
// without a reload).
const ShippingFeeContext = createContext<number | null>(null);

export function ShippingFeeProvider({ value, children }: { value: number; children: ReactNode }) {
  return createElement(ShippingFeeContext.Provider, { value }, children);
}

const CACHE_MS = 30_000;
let cached: { value: number; at: number } | null = null;
let inflight: Promise<number> | null = null;

function loadShippingFee(): Promise<number> {
  if (cached && Date.now() - cached.at < CACHE_MS) return Promise.resolve(cached.value);
  if (inflight) return inflight;

  inflight = fetch("/api/settings", { cache: "no-store" })
    .then((response) => response.json())
    .then((payload: { data?: { settings?: { shippingFee?: number } } }) => {
      const value = Number(payload.data?.settings?.shippingFee ?? 0) || 0;
      cached = { value, at: Date.now() };
      return value;
    })
    .catch(() => 0)
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function useShippingFee(): number {
  const seeded = useContext(ShippingFeeContext);
  const [fee, setFee] = useState<number>(cached?.value ?? seeded ?? 0);

  useEffect(() => {
    let isMounted = true;
    loadShippingFee().then((value) => {
      if (isMounted) setFee(value);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return fee;
}
