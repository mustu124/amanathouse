"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AdminSection, ConfirmButton } from "@/components/admin/AdminCards";
import { adminFetch } from "@/lib/admin-client";
import { hamperToPayload, type Hamper } from "@/lib/hampers";
import { getDisplayMediaUrl } from "@/lib/media";
import { formatMoney } from "@/lib/pricing/hamper";

export default function AdminHampersPage() {
  const [hampers, setHampers] = useState<Hamper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = () =>
    adminFetch<{ hampers: Hamper[] }>("/api/hampers?admin=true")
      .then((res) => setHampers(res.data.hampers))
      .catch((error) => toast.error(error.message))
      .finally(() => setIsLoading(false));

  useEffect(() => {
    load();
  }, []);

  const update = async (hamper: Hamper, overrides: Partial<Hamper>, message: string) => {
    try {
      await adminFetch(`/api/hampers/${hamper._id}`, { method: "PUT", body: JSON.stringify(hamperToPayload(hamper, overrides)) });
      toast.success(message);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  };

  const remove = async (hamper: Hamper) => {
    try {
      const result = await adminFetch<{ archived: boolean }>(`/api/hampers/${hamper._id}`, { method: "DELETE" });
      toast.success(result.message, { duration: result.data.archived ? 7000 : 3000 });
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-amanat-sage">Catalog</p>
          <h1 className="font-heading text-4xl font-bold">Hampers</h1>
        </div>
        <Link href="/admin/hampers/new" className="rounded-full bg-amanat-terracotta px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white">
          Add New Hamper
        </Link>
      </div>

      <AdminSection title="Hamper Manager" description="Customers build these themselves from the eligible products you choose.">
        {isLoading ? (
          <p className="text-sm text-stone-500">Loading hampers...</p>
        ) : hampers.length === 0 ? (
          <p className="rounded-xl bg-amanat-cream p-6 text-center text-sm font-bold">
            No hampers yet. If this is unexpected, make sure migration <code>0003_hampers.sql</code> has been run in Supabase.
          </p>
        ) : (
          <div className="grid gap-3">
            <div className="hidden rounded-xl bg-amanat-cream px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-amanat-sage xl:grid xl:grid-cols-[minmax(260px,1.6fr)_minmax(160px,1fr)_90px_100px_150px] xl:gap-4">
              <span>Hamper</span>
              <span>Pricing</span>
              <span>Products</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {hampers.map((hamper) => (
              <article
                key={hamper._id}
                className="grid gap-4 rounded-2xl border border-amanat-brown/10 bg-white p-4 shadow-sm xl:grid-cols-[minmax(260px,1.6fr)_minmax(160px,1fr)_90px_100px_150px] xl:items-center xl:gap-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Image src={getDisplayMediaUrl(hamper.heroImageUrl)} alt={hamper.name} width={64} height={80} className="h-20 w-16 shrink-0 rounded-xl bg-amanat-sand object-cover" />
                  <div className="min-w-0">
                    <p className="truncate font-heading text-lg font-bold">{hamper.name}</p>
                    <p className="truncate text-xs text-stone-500">/hampers/{hamper.slug}{hamper.isPlaceholder ? " · placeholder" : ""}</p>
                  </div>
                </div>
                <p className="text-sm font-bold">
                  {hamper.pricingMode === "percentage" ? `${hamper.discountPercent}% off` : `${formatMoney(hamper.fixedPrice ?? 0)} flat`}
                  <span className="block text-xs font-normal text-stone-500">
                    {hamper.minItems}–{hamper.maxItems ?? "∞"} items{hamper.packagingFee > 0 ? ` · +${formatMoney(hamper.packagingFee)} packaging` : ""}
                  </span>
                </p>
                <p className="text-sm font-bold">{hamper.products.length}</p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={hamper.isActive}
                  onClick={() => update(hamper, { isActive: !hamper.isActive }, hamper.isActive ? "Hamper hidden" : "Hamper is live")}
                  className={`w-fit rounded-full px-3 py-1 text-xs font-black uppercase ${hamper.isActive ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"}`}
                >
                  {hamper.isActive ? "Active" : "Hidden"}
                </button>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/hampers/${hamper.slug}/edit`} className="rounded-full border border-amanat-brown px-4 py-2 text-xs font-black">
                    Edit
                  </Link>
                  <ConfirmButton
                    message="Delete this hamper? If it appears in past orders it will be archived (hidden) instead, so order history stays intact."
                    onConfirm={() => remove(hamper)}
                    className="rounded-full bg-red-700 px-4 py-2 text-xs font-black text-white"
                  >
                    Delete
                  </ConfirmButton>
                </div>
              </article>
            ))}
          </div>
        )}
      </AdminSection>
    </div>
  );
}
