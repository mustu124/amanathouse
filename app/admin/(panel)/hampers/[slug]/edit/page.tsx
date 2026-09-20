"use client";

import { useEffect, useState } from "react";
import { HamperForm } from "@/components/admin/HamperForm";
import { adminFetch } from "@/lib/admin-client";
import type { Hamper } from "@/lib/hampers";

export default function EditHamperPage({ params }: { params: { slug: string } }) {
  const [hamper, setHamper] = useState<Hamper | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    setHamper(null);

    adminFetch<{ hamper: Hamper }>(`/api/hampers/${encodeURIComponent(params.slug)}?admin=true`)
      .then((res) => setHamper(res.data.hamper))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load hamper."));
  }, [params.slug]);

  if (error) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="font-heading text-3xl font-bold text-amanat-brown">Unable to load hamper</h1>
        <p className="mt-2 text-sm font-bold text-red-700">{error}</p>
      </div>
    );
  }

  if (!hamper) return <div className="rounded-2xl bg-white p-6 shadow-sm">Loading hamper...</div>;

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-amanat-sage">Catalog</p>
        <h1 className="font-heading text-4xl font-bold text-amanat-brown">Edit Hamper</h1>
      </div>
      <HamperForm hamper={hamper} />
    </div>
  );
}
