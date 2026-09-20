"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { hamperSelectionOf, useCart, type HamperSelection } from "@/context/CartContext";
import {
  hamperOfferLabel,
  hamperRules,
  selectedItemFromProduct,
  type Hamper,
  type HamperCartData,
  type HamperContentLine
} from "@/lib/hampers";
import { getDisplayMediaUrl } from "@/lib/media";
import { calculateHamperPrice, formatMoney } from "@/lib/pricing/hamper";

type Picked = { quantity: number; variant: string | null };

export function HamperBuilder({ hamper }: { hamper: Hamper }) {
  const { items: cartItems, addHamper, openCart } = useCart();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  // Inactive products never appear; out-of-stock ones stay visible but disabled.
  const eligible = useMemo(() => hamper.products.filter((entry) => entry.product.active !== false), [hamper.products]);
  const requiredIds = useMemo(
    () => eligible.filter((entry) => entry.isRequired && entry.product.inStock && entry.product.stockCount > 0).map((entry) => entry.product._id),
    [eligible]
  );

  const [picked, setPicked] = useState<Record<string, Picked>>(() =>
    Object.fromEntries(requiredIds.map((id) => [id, { quantity: 1, variant: null }]))
  );
  const [variantDraft, setVariantDraft] = useState<Record<string, string>>({});
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [hasLoadedEdit, setHasLoadedEdit] = useState(false);

  // "Edit hamper" from the cart: pre-fill from the saved line once the cart has hydrated.
  useEffect(() => {
    if (!editId || hasLoadedEdit) return;
    const line = cartItems.find((item) => item.product._id === editId && item.hamper);
    if (!line) return;
    const next: Record<string, Picked> = {};
    for (const entry of hamperSelectionOf(line)) next[entry.productId] = { quantity: entry.quantity, variant: entry.variant ?? null };
    for (const id of requiredIds) next[id] = next[id] ?? { quantity: 1, variant: null };
    setPicked(next);
    setHasLoadedEdit(true);
  }, [cartItems, editId, hasLoadedEdit, requiredIds]);

  const rules = useMemo(() => hamperRules(hamper), [hamper]);
  const selectedProducts = useMemo(
    () => eligible.filter((entry) => (picked[entry.product._id]?.quantity ?? 0) > 0),
    [eligible, picked]
  );
  const price = useMemo(
    () =>
      calculateHamperPrice(
        rules,
        selectedProducts.map((entry) => selectedItemFromProduct(entry.product, picked[entry.product._id].quantity))
      ),
    [rules, selectedProducts, picked]
  );

  const atMax = hamper.maxItems != null && price.itemCount >= hamper.maxItems;
  const availableCount = eligible.filter((entry) => entry.product.inStock && entry.product.stockCount > 0).length;
  const isFixed = hamper.pricingMode === "fixed";
  const showWorth = isFixed && price.itemsSubtotal > 0;

  const setQuantity = (productId: string, quantity: number, variant?: string | null) => {
    setPicked((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[productId];
      else next[productId] = { quantity, variant: variant ?? current[productId]?.variant ?? null };
      return next;
    });
  };

  const submit = () => {
    if (!price.isValid) return;
    const lines: HamperContentLine[] = selectedProducts.map((entry) => ({
      productId: entry.product._id,
      name: entry.product.name,
      slug: entry.product.slug,
      variant: picked[entry.product._id].variant,
      metalTone: entry.product.metalTone ?? null,
      size: entry.product.size ?? null,
      unitPrice: entry.product.price,
      quantity: picked[entry.product._id].quantity
    }));
    const data: HamperCartData = {
      hamperId: hamper._id,
      slug: hamper.slug,
      name: hamper.name,
      heroImageUrl: hamper.heroImageUrl,
      items: lines,
      itemsSubtotal: price.itemsSubtotal,
      discountAmount: price.discountAmount,
      packagingFee: price.packagingFee,
      total: price.total,
      pricingMode: hamper.pricingMode
    };
    const selection: HamperSelection[] = lines.map((line) => ({ productId: line.productId, quantity: line.quantity, variant: line.variant }));
    addHamper(data, selection, 1, editId && cartItems.some((item) => item.product._id === editId) ? editId : undefined);
    openCart();
  };

  const summary = (
    <SummaryPanel
      hamper={hamper}
      lines={selectedProducts.map((entry) => ({
        entry,
        quantity: picked[entry.product._id].quantity,
        variant: picked[entry.product._id].variant
      }))}
      price={price}
      isFixed={isFixed}
      showWorth={showWorth}
      onSubmit={submit}
      onRemove={(id) => setQuantity(id, 0)}
      requiredIds={requiredIds}
    />
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pb-40 pt-8 sm:px-6 lg:pb-16 lg:pt-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs font-bold uppercase tracking-[0.16em] text-amanat-sage">
        <Link href="/">Home</Link> / <Link href="/hampers">Hampers</Link> / <span className="text-ink">{hamper.name}</span>
      </nav>

      <section className="grid items-start gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-blush sm:aspect-[3/2] lg:aspect-[4/5]">
          {hamper.heroImageUrl ? (
            <Image
              src={getDisplayMediaUrl(hamper.heroImageUrl)}
              alt={hamper.name}
              fill
              priority
              sizes="(min-width: 1024px) 52vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-heading text-2xl text-amanat-sage">{hamper.name}</div>
          )}
          <span className="absolute left-4 top-4 bg-ink px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ivory">
            {hamperOfferLabel(hamper)}
          </span>
        </div>

        <div className="lg:pt-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-amanat-terracotta">Build your own hamper</p>
          <h1 className="mt-3 font-heading text-4xl font-bold leading-tight sm:text-5xl">{hamper.name}</h1>
          <div className="my-6 h-px w-24 bg-gold" />
          {hamper.shortDescription && <p className="text-lg text-amanat-sage">{hamper.shortDescription}</p>}
          {hamper.longDescription && <p className="mt-4 whitespace-pre-line leading-8 text-stone-700">{hamper.longDescription}</p>}
          <ul className="mt-6 grid gap-2 text-sm font-bold">
            <li>
              Choose {hamper.minItems}
              {hamper.maxItems != null ? `–${hamper.maxItems}` : "+"} pieces
            </li>
            <li>{isFixed ? `One flat price of ${formatMoney(hamper.fixedPrice ?? 0)}` : `${hamper.discountPercent}% off everything you pick`}</li>
            {hamper.packagingFee > 0 && <li>Gift packaging {formatMoney(hamper.packagingFee)}</li>}
          </ul>
        </div>
      </section>

      <section className="mt-14 grid items-start gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">Build your hamper</h2>
          <div className="mt-3 h-px w-16 bg-gold" />

          {eligible.length === 0 || availableCount === 0 ? (
            <div className="mt-8 border border-amanat-brown/10 bg-white p-8 text-center">
              <p className="font-heading text-2xl font-bold">Nothing to pick from just yet</p>
              <p className="mt-2 text-stone-600">Every piece in this hamper is out of stock right now. Please check back soon.</p>
            </div>
          ) : (
            <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-3">
              {eligible.map((entry) => {
                const product = entry.product;
                const current = picked[product._id];
                const outOfStock = !product.inStock || product.stockCount <= 0;
                const isRequired = entry.isRequired;
                const needsVariant = (product.variants?.length ?? 0) > 0;
                const draftVariant = variantDraft[product._id] ?? product.variants?.[0] ?? "";

                return (
                  <li key={product._id} className={`flex flex-col ${outOfStock ? "opacity-60" : ""}`}>
                    <div className="relative aspect-[4/5] overflow-hidden bg-blush">
                      {product.images[0]?.url && (
                        <Image
                          src={getDisplayMediaUrl(product.images[0].url)}
                          alt={product.images[0].alt ?? product.name}
                          fill
                          sizes="(min-width: 1024px) 22vw, 46vw"
                          className="object-cover"
                        />
                      )}
                      {isRequired && (
                        <span className="absolute left-2 top-2 bg-ink px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ivory">
                          Included
                        </span>
                      )}
                      {outOfStock && (
                        <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-1.5 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-ivory">
                          Out of stock
                        </span>
                      )}
                    </div>
                    <p className="mt-3 font-heading text-lg font-bold leading-tight">{product.name}</p>
                    <p className="text-sm text-amanat-sage">
                      {formatMoney(product.price)}
                      {product.metalTone ? ` · ${product.metalTone.replace("-", " ")}` : ""}
                    </p>

                    {needsVariant && !current && !outOfStock && (
                      <select
                        aria-label={`Size for ${product.name}`}
                        value={draftVariant}
                        onChange={(event) => setVariantDraft((drafts) => ({ ...drafts, [product._id]: event.target.value }))}
                        className="field-input mt-2 py-2 text-sm"
                      >
                        {product.variants?.map((variant) => (
                          <option key={variant}>{variant}</option>
                        ))}
                      </select>
                    )}

                    <div className="mt-3">
                      {isRequired && current ? (
                        <p className="border border-gold/60 py-2 text-center text-xs font-bold uppercase tracking-[0.14em]">Locked in</p>
                      ) : current ? (
                        <div className="flex items-center justify-between border border-ink/20">
                          <button type="button" aria-label={`Decrease ${product.name}`} onClick={() => setQuantity(product._id, current.quantity - 1)} className="h-10 w-10 text-lg font-bold">
                            −
                          </button>
                          <span className="text-sm font-bold">{current.quantity}</span>
                          <button
                            type="button"
                            aria-label={`Increase ${product.name}`}
                            disabled={atMax || current.quantity >= product.stockCount}
                            onClick={() => setQuantity(product._id, current.quantity + 1)}
                            className="h-10 w-10 text-lg font-bold disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={outOfStock || atMax}
                          onClick={() => setQuantity(product._id, 1, needsVariant ? draftVariant : null)}
                          className="btn-secondary w-full py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {outOfStock ? "Unavailable" : atMax ? "Hamper is full" : "Add"}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className="hidden lg:sticky lg:top-28 lg:block">{summary}</aside>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-[55] border-t border-gold/60 bg-ivory shadow-[0_-12px_30px_rgba(0,0,0,0.08)] lg:hidden">
        <button
          type="button"
          aria-expanded={isSummaryOpen}
          onClick={() => setIsSummaryOpen((open) => !open)}
          className="flex w-full items-center justify-between px-4 pt-3 text-left"
        >
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-amanat-sage">
            Your hamper · {price.itemCount} item{price.itemCount === 1 ? "" : "s"} {isSummaryOpen ? "▾" : "▴"}
          </span>
          <span className="font-heading text-2xl font-bold">{formatMoney(price.total)}</span>
        </button>
        {isSummaryOpen && <div className="max-h-[55vh] overflow-y-auto px-4 pb-2 pt-2">{summary}</div>}
        {!isSummaryOpen && (
          <div className="px-4 pb-3 pt-2">
            <p className="mb-2 text-xs font-bold text-amanat-terracotta" role="status">
              {price.isValid ? (price.savings > 0 ? `You save ${formatMoney(price.savings)}` : "Ready to add to cart") : price.validationErrors[0]}
            </p>
            <button type="button" disabled={!price.isValid} onClick={submit} className="btn-primary w-full disabled:cursor-not-allowed">
              {editId ? "Update hamper in cart" : "Add hamper to cart"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryPanel({
  hamper,
  lines,
  price,
  isFixed,
  showWorth,
  onSubmit,
  onRemove,
  requiredIds
}: {
  hamper: Hamper;
  lines: Array<{ entry: Hamper["products"][number]; quantity: number; variant: string | null }>;
  price: ReturnType<typeof calculateHamperPrice>;
  isFixed: boolean;
  showWorth: boolean;
  onSubmit: () => void;
  onRemove: (productId: string) => void;
  requiredIds: string[];
}) {
  const minHint = price.itemCount < hamper.minItems;

  return (
    <div className="border border-gold/60 bg-white p-5">
      <h3 className="font-heading text-2xl font-bold">Your hamper</h3>
      <div className="my-3 h-px w-12 bg-gold" />

      {lines.length === 0 ? (
        <p className="text-sm text-stone-500">Nothing added yet — pick pieces from the list.</p>
      ) : (
        <ul className="grid gap-2 text-sm">
          {lines.map(({ entry, quantity, variant }) => (
            <li key={entry.product._id} className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                {entry.product.name}
                {variant ? ` (${variant})` : ""} × {quantity}
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="text-stone-500">{formatMoney(entry.product.price * quantity)}</span>
                {!requiredIds.includes(entry.product._id) && (
                  <button type="button" aria-label={`Remove ${entry.product.name}`} onClick={() => onRemove(entry.product._id)} className="text-xs font-bold text-amanat-terracotta">
                    Remove
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <dl className="mt-4 grid gap-1.5 border-t border-ink/10 pt-4 text-sm">
        <div className="flex justify-between">
          <dt>{showWorth ? "Worth" : "Items subtotal"}</dt>
          <dd>{formatMoney(price.itemsSubtotal)}</dd>
        </div>
        {!isFixed && price.discountAmount > 0 && (
          <div className="flex justify-between text-amanat-terracotta">
            <dt>Discount ({price.discountPercentApplied}%)</dt>
            <dd>−{formatMoney(price.discountAmount)}</dd>
          </div>
        )}
        {isFixed && (
          <div className="flex justify-between">
            <dt>Hamper price</dt>
            <dd>{formatMoney(hamper.fixedPrice ?? 0)}</dd>
          </div>
        )}
        {price.packagingFee > 0 && (
          <div className="flex justify-between">
            <dt>Gift packaging</dt>
            <dd>{formatMoney(price.packagingFee)}</dd>
          </div>
        )}
        <div className="mt-2 flex items-baseline justify-between border-t border-ink/10 pt-3">
          <dt className="font-bold">Total</dt>
          <dd className="font-heading text-3xl font-bold">{formatMoney(price.total)}</dd>
        </div>
        {price.savings > 0 && <p className="text-right text-sm font-bold text-amanat-terracotta">You save {formatMoney(price.savings)}</p>}
      </dl>

      <p role="status" className={`mt-4 text-sm font-bold ${price.isValid ? "text-amanat-sage" : "text-amanat-terracotta"}`}>
        {price.isValid
          ? "Your hamper is ready."
          : minHint
            ? `Add ${hamper.minItems - price.itemCount} more item${hamper.minItems - price.itemCount === 1 ? "" : "s"} to complete your hamper (minimum ${hamper.minItems}).`
            : price.validationErrors[0]}
      </p>
      <button type="button" disabled={!price.isValid} onClick={onSubmit} className="btn-primary mt-3 w-full disabled:cursor-not-allowed">
        Add hamper to cart
      </button>
      {!price.isValid && <p className="mt-2 text-xs text-stone-500">The button unlocks once the hamper meets the rules above.</p>}
    </div>
  );
}
