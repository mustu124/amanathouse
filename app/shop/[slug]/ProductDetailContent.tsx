"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { ProductCard, QuickViewModal } from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { RETURNS_POLICY_TEXT, SHIPPING_POLICY_TEXT } from "@/lib/content/policies";
import { env } from "@/lib/env";
import { getDisplayMediaUrl } from "@/lib/media";
import {
  DEFAULT_CARE_INSTRUCTIONS,
  getCategoryByName,
  getMaterialSpecs,
  METAL_TONES,
  type MetalTone,
  type StoreProduct
} from "@/lib/product-data";
import { whatsappLink } from "@/lib/whatsapp";

type ProductResponse = {
  success?: boolean;
  data?: {
    product: StoreProduct | null;
  };
  product?: StoreProduct | null;
};

type ProductsResponse = {
  data?: {
    products: StoreProduct[];
  };
  products?: StoreProduct[];
};

const METAL_TONE_LABELS: Record<MetalTone, string> = {
  gold: "Gold",
  silver: "Silver",
  "rose-gold": "Rose Gold"
};

const METAL_TONE_SWATCHES: Record<MetalTone, string> = {
  gold: "#D4AF37",
  silver: "#C7CDD4",
  "rose-gold": "#D9A79C"
};

const RING_CATEGORIES = ["Rings"];
const CHAIN_CATEGORIES = ["Necklaces"];

const TRUST_STRIP_ITEMS = ["Anti-Tarnish", "Waterproof", "18K PVD Gold", "Hypoallergenic", "Ships All Over India"];

function optimizedMediaUrl(src: string, width = 1100) {
  return getDisplayMediaUrl(src);
}

export function ProductDetailContent({ params }: { params: { slug: string } }) {
  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<StoreProduct[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedMetalTone, setSelectedMetalTone] = useState<MetalTone>("gold");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [openSection, setOpenSection] = useState("Full Description");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<StoreProduct | null>(null);
  const [isAdded, setIsAdded] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const [isZooming, setIsZooming] = useState(false);
  const { addItem, items } = useCart();

  useEffect(() => {
    let isMounted = true;

    fetch(`/api/products/${params.slug}`)
      .then((response) => response.json())
      .then((data: ProductResponse) => {
        const nextProduct = data.data?.product ?? data.product;
        if (!isMounted || !nextProduct) return;
        setProduct(nextProduct);
        setSelectedVariant(nextProduct.variants?.[0] ?? "");
        setSelectedMetalTone(nextProduct.metalTone ?? "gold");
        setQuantity(1);
      })
      .catch(() => setProduct(null));

    return () => {
      isMounted = false;
    };
  }, [params.slug]);

  useEffect(() => {
    if (!product) return;
    let isMounted = true;

    async function loadRelated() {
      // "Complete the stack" prefers explicit stack_with matches; falls
      // back to same-category pieces when a product doesn't set any.
      if (product!.stackWith && product!.stackWith.length > 0) {
        const results = await Promise.all(
          product!.stackWith.slice(0, 8).map((slugOrName) =>
            fetch(`/api/products/${encodeURIComponent(slugOrName)}`)
              .then((response) => response.json())
              .then((data: ProductResponse) => data.data?.product ?? data.product ?? null)
              .catch(() => null)
          )
        );
        const found = results.filter((item): item is StoreProduct => Boolean(item));
        if (found.length > 0) {
          if (isMounted) setRelatedProducts(found);
          return;
        }
      }

      const response = await fetch(
        `/api/products?category=${encodeURIComponent(product!.category)}&limit=8&exclude=${encodeURIComponent(product!._id)}`
      );
      const data = (await response.json()) as ProductsResponse;
      if (isMounted) setRelatedProducts(data.data?.products ?? data.products ?? []);
    }

    loadRelated().catch(() => {
      if (isMounted) setRelatedProducts([]);
    });

    return () => {
      isMounted = false;
    };
  }, [product]);

  const galleryItems = useMemo(() => {
    if (!product) return [];
    const images = product.images.length > 0 ? product.images : [{ url: "/logo-mark.png", alt: product.name }];
    return images.map((image) => ({ url: image.url, alt: image.alt }));
  }, [product]);

  const goToImage = (index: number) => {
    setSelectedImage((index + galleryItems.length) % galleryItems.length);
  };

  const handleZoomMove = (event: MouseEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  };

  const currentItem = galleryItems[selectedImage];
  const savings =
    product?.originalPrice && product.originalPrice > product.price ? product.originalPrice - product.price : 0;
  const showRingGuide = product ? RING_CATEGORIES.includes(product.category) : false;
  const showChainGuide = product ? CHAIN_CATEGORIES.includes(product.category) : false;

  if (!product) {
    return (
      <main className="min-h-screen bg-amanat-cream px-6 pt-32">
        <div className="mx-auto flex max-w-7xl justify-center rounded-2xl bg-white p-10 shadow-soft">
          <LoadingSpinner label="Loading product" />
        </div>
      </main>
    );
  }

  const cartQuantity = items
    .filter((item) => item.product._id === product._id)
    .reduce((total, item) => total + item.quantity, 0);
  const remainingStock = Math.max(product.stockCount - cartQuantity, 0);
  const canAddToCart = product.inStock && quantity <= remainingStock;
  const combinedVariant = [
    METAL_TONE_LABELS[selectedMetalTone],
    selectedVariant || (product.size ? product.size : "")
  ]
    .filter(Boolean)
    .join(" / ");

  const accordionSections: Array<[string, string | string[]]> = [
    ...(product.description ? ([["Full Description", product.description]] as Array<[string, string]>) : []),
    ["Materials & Finish", getMaterialSpecs(product)],
    ["Care Instructions", product.careInstructions || DEFAULT_CARE_INSTRUCTIONS],
    [
      "Shipping & Returns",
      `${product.shippingInfo || SHIPPING_POLICY_TEXT}\n${RETURNS_POLICY_TEXT}`
    ]
  ];

  return (
    <main className="min-h-screen bg-amanat-cream pb-20 pt-28">
      <section className="mx-auto grid max-w-7xl gap-10 px-4 md:px-8 lg:grid-cols-[3fr_2fr]">
        <motion.div initial={{ opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55, ease: "easeOut" }}>
          <div className="relative overflow-hidden rounded-2xl bg-amanat-sand shadow-soft">
            <AnimatePresence mode="wait">
              <motion.button
                key={currentItem?.url}
                type="button"
                aria-label="Open product image lightbox"
                onClick={() => setIsLightboxOpen(true)}
                onMouseMove={handleZoomMove}
                onMouseEnter={() => setIsZooming(true)}
                onMouseLeave={() => setIsZooming(false)}
                drag={galleryItems.length > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) goToImage(selectedImage + 1);
                  if (info.offset.x > 80) goToImage(selectedImage - 1);
                }}
                className="relative block aspect-[4/5] w-full overflow-hidden"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.38 }}
              >
                <Image
                  src={currentItem?.url ? optimizedMediaUrl(currentItem.url, 1300) : "/logo-mark.png"}
                  alt={currentItem?.alt ?? product.name}
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  quality={82}
                  className="object-cover transition-transform duration-300 ease-out"
                  style={{
                    transformOrigin: zoomOrigin,
                    transform: isZooming ? "scale(1.6)" : "scale(1)"
                  }}
                />
                <span className="absolute bottom-4 left-4 rounded-full bg-black/45 px-3 py-1 text-xs font-bold text-white backdrop-blur md:hidden">
                  Swipe or tap to zoom
                </span>
              </motion.button>
            </AnimatePresence>

            {galleryItems.length > 1 && (
              <>
                <GalleryArrow label="Previous image" onClick={() => goToImage(selectedImage - 1)} side="left" />
                <GalleryArrow label="Next image" onClick={() => goToImage(selectedImage + 1)} side="right" />
                <div className="absolute bottom-4 right-4 rounded-full bg-black/45 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
                  {selectedImage + 1} / {galleryItems.length}
                </div>
              </>
            )}
          </div>

          {galleryItems.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {galleryItems.map((item, index) => (
                <motion.button
                  key={`${item.url}-${index}`}
                  type="button"
                  aria-label={`View image ${index + 1}`}
                  onClick={() => setSelectedImage(index)}
                  whileHover={{ y: -2 }}
                  className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${
                    selectedImage === index ? "border-amanat-terracotta" : "border-transparent"
                  }`}
                >
                  <Image src={optimizedMediaUrl(item.url, 220)} alt={item.alt ?? product.name} fill sizes="80px" loading="lazy" quality={72} className="object-cover" />
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: "easeOut", delay: 0.08 }}
          className="rounded-2xl bg-white p-5 shadow-soft md:p-8"
        >
          <nav className="text-xs font-bold uppercase tracking-[0.12em] text-amanat-sage">
            <Link href="/">Home</Link> <span>/</span> <Link href="/shop">Shop</Link> <span>/</span>{" "}
            <Link href={`/shop?category=${getCategoryByName(product.category)?.slug ?? encodeURIComponent(product.category)}`}>
              {product.category}
            </Link>{" "}
            <span>/</span> <span>{product.name}</span>
          </nav>

          <p className="mt-4 text-xs font-black uppercase tracking-eyebrow text-amanat-terracotta">{product.category}</p>

          {product.badges && product.badges.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {product.badges.map((badge) => (
                <span key={badge} className="rounded-[2px] border border-gold/40 bg-blush px-2.5 py-1 text-xs font-black uppercase tracking-eyebrow text-ink">
                  {badge}
                </span>
              ))}
            </div>
          )}

          <h1 className="mt-3 font-heading text-[28px] font-bold leading-tight text-amanat-brown md:text-4xl">{product.name}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="font-price text-3xl font-medium text-amanat-terracotta">
              {"₹"}
              {product.price.toLocaleString("en-IN")}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="font-price text-lg font-normal text-stone-400 line-through">
                {"₹"}
                {product.originalPrice.toLocaleString("en-IN")}
              </span>
            )}
            {savings > 0 && (
              <span className="rounded-full bg-amanat-gold/20 px-3 py-1 font-price text-xs font-semibold uppercase tracking-[0.12em] text-amanat-brown">
                Save {"₹"}
                {savings.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 text-amanat-gold">
            {Array.from({ length: 5 }).map((_, index) => (
              <span key={index}>{index < Math.round(product.rating.average) ? "★" : "☆"}</span>
            ))}
            <span className="ml-2 text-sm font-bold text-stone-600">{product.rating.average.toFixed(1)}</span>
          </div>

          {product.description && <p className="mt-5 line-clamp-3 leading-7 text-stone-700">{product.description}</p>}

          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-y border-amanat-brown/10 py-4 text-xs font-bold uppercase tracking-[0.08em] text-amanat-sage">
            {TRUST_STRIP_ITEMS.map((item, index) => (
              <span key={item} className="flex items-center gap-1.5">
                {index > 0 && <span className="text-amanat-brown/20">·</span>}
                {item}
              </span>
            ))}
          </div>

          <div className="mt-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amanat-sage">Metal Tone</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(product.metalTone ? [product.metalTone] : METAL_TONES).map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setSelectedMetalTone(tone)}
                  aria-pressed={selectedMetalTone === tone}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-amanat-terracotta ${
                    selectedMetalTone === tone ? "border-amanat-terracotta bg-amanat-terracotta text-white" : "border-amanat-brown/15 text-amanat-brown"
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-black/10"
                    style={{ backgroundColor: METAL_TONE_SWATCHES[tone] }}
                    aria-hidden="true"
                  />
                  {METAL_TONE_LABELS[tone]}
                </button>
              ))}
            </div>
          </div>

          {product.variants && product.variants.length > 0 ? (
            <div className="mt-7">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amanat-sage">Size / Variant</p>
                {(showRingGuide || showChainGuide) && (
                  <button
                    type="button"
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="text-xs font-bold text-amanat-terracotta underline underline-offset-4"
                  >
                    {showRingGuide ? "Ring Size Guide" : "Chain Length Guide"}
                  </button>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant}
                    type="button"
                    onClick={() => setSelectedVariant(variant)}
                    className={`rounded-full border px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-amanat-terracotta ${
                      selectedVariant === variant ? "border-amanat-terracotta bg-amanat-terracotta text-white" : "border-amanat-brown/15 text-amanat-brown"
                    }`}
                  >
                    {variant}
                  </button>
                ))}
              </div>
            </div>
          ) : product.size ? (
            <div className="mt-7">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amanat-sage">Size</p>
                {(showRingGuide || showChainGuide) && (
                  <button
                    type="button"
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="text-xs font-bold text-amanat-terracotta underline underline-offset-4"
                  >
                    {showRingGuide ? "Ring Size Guide" : "Chain Length Guide"}
                  </button>
                )}
              </div>
              <p className="mt-2 font-bold text-amanat-brown">{product.size}</p>
            </div>
          ) : null}

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <div className="flex items-center rounded-full border border-amanat-brown/15">
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="h-11 w-11 font-black">
                -
              </button>
              <span className="w-10 text-center font-black">{quantity}</span>
              <button
                type="button"
                disabled={quantity >= remainingStock}
                onClick={() => setQuantity((value) => Math.min(remainingStock, value + 1))}
                className="h-11 w-11 font-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
            </div>
            <span className="text-sm font-bold text-amanat-sage">
              {!product.inStock ? "Out of stock" : remainingStock <= 0 ? "Maximum quantity already in cart" : `${product.stockCount} in stock`}
            </span>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <motion.button
              type="button"
              whileHover={canAddToCart ? { y: -2 } : undefined}
              whileTap={canAddToCart ? { scale: 0.98 } : undefined}
              disabled={!canAddToCart}
              onClick={() => {
                addItem(product, quantity, combinedVariant);
                setIsAdded(true);
                window.setTimeout(() => setIsAdded(false), 1200);
              }}
              className="btn-primary disabled:cursor-not-allowed"
            >
              {isAdded ? "✓ Added" : !product.inStock ? "Out of Stock" : remainingStock <= 0 ? "Max in Cart" : "Add to Cart"}
            </motion.button>
            <motion.button
              type="button"
              whileHover={canAddToCart ? { y: -2 } : undefined}
              whileTap={canAddToCart ? { scale: 0.98 } : undefined}
              disabled={!canAddToCart}
              onClick={() => {
                addItem(product, quantity, combinedVariant);
                window.dispatchEvent(new CustomEvent("amanat-house:start-checkout"));
              }}
              className="btn-secondary disabled:cursor-not-allowed"
            >
              {!product.inStock ? "Out of Stock" : "Order on WhatsApp"}
            </motion.button>
          </div>

          <div className="mt-7 divide-y divide-amanat-brown/10 border-y border-amanat-brown/10">
            {accordionSections.map(([title, body]) => (
              <div key={title}>
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === title ? "" : title)}
                  aria-expanded={openSection === title}
                  className="flex w-full items-center justify-between py-4 text-left font-heading text-lg font-bold text-amanat-brown"
                >
                  {title}
                  <motion.span aria-hidden="true" animate={{ rotate: openSection === title ? 180 : 0 }}>⌄</motion.span>
                </button>
                <AnimatePresence>
                  {openSection === title && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pb-4"
                    >
                      {Array.isArray(body) ? (
                        <ul className="grid gap-2 leading-7 text-stone-700">
                          {body.map((item) => (
                            <li key={item} className="flex items-start gap-2">
                              <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-amanat-terracotta" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="whitespace-pre-line leading-7 text-stone-700">{body}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-amanat-sage">Share</span>
            <ShareLink href={whatsappLink(`Check out ${product.name} from Amanat House: ${typeof window !== "undefined" ? window.location.href : ""}`)}>
              WhatsApp
            </ShareLink>
            <ShareLink href={env.instagramUrl}>Instagram</ShareLink>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
              className="rounded-full bg-amanat-cream px-4 py-2 text-sm font-bold text-amanat-brown"
            >
              Copy Link
            </button>
          </div>
        </motion.div>
      </section>

      <CompleteTheStackSection products={relatedProducts} onQuickView={setQuickViewProduct} />
      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      <Lightbox
        isOpen={isLightboxOpen}
        imageUrl={currentItem?.url ?? ""}
        alt={currentItem?.alt ?? product.name}
        onClose={() => setIsLightboxOpen(false)}
      />
      {showRingGuide && <RingSizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />}
      {showChainGuide && <ChainLengthGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />}
    </main>
  );
}

function GalleryArrow({ label, onClick, side }: { label: string; onClick: () => void; side: "left" | "right" }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/86 text-2xl text-amanat-brown shadow-sm backdrop-blur ${
        side === "left" ? "left-4" : "right-4"
      }`}
    >
      {side === "left" ? "‹" : "›"}
    </button>
  );
}

function ShareLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="rounded-full bg-amanat-cream px-4 py-2 text-sm font-bold text-amanat-brown" target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

function CompleteTheStackSection({
  products,
  onQuickView
}: {
  products: StoreProduct[];
  onQuickView: (product: StoreProduct) => void;
}) {
  if (products.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      className="mx-auto mt-16 max-w-7xl px-4 md:px-8"
    >
      <h2 className="font-heading text-4xl font-bold text-amanat-brown">Complete the Stack</h2>
      <div className="mt-8 flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-4 md:overflow-visible">
        {products.map((product) => (
          <div key={product._id} className="w-64 shrink-0 md:w-auto">
            <ProductCard product={product} onQuickView={onQuickView} />
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function Lightbox({
  isOpen,
  imageUrl,
  alt,
  onClose
}: {
  isOpen: boolean;
  imageUrl: string;
  alt: string;
  onClose: () => void;
}) {
  useEscapeKey(isOpen && Boolean(imageUrl), onClose);
  const trapRef = useFocusTrap(isOpen && Boolean(imageUrl));

  return (
    <AnimatePresence>
      {isOpen && imageUrl && (
        <motion.div
          ref={trapRef}
          tabIndex={-1}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur focus:outline-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={onClose}
        >
          <button type="button" onClick={onClose} className="absolute right-6 top-6 rounded-full bg-white px-4 py-2 font-black text-amanat-brown">
            Close
          </button>
          <motion.div className="relative h-[84vh] w-full max-w-4xl" initial={{ scale: 0.94 }} animate={{ scale: 1 }} exit={{ scale: 0.94 }}>
            <Image src={optimizedMediaUrl(imageUrl, 1600)} alt={alt} fill sizes="92vw" quality={84} className="object-contain" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GuideModalShell({
  isOpen,
  onClose,
  title,
  children
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEscapeKey(isOpen, onClose);
  const trapRef = useFocusTrap(isOpen);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={onClose}
        >
          <motion.div
            ref={trapRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-soft focus:outline-none md:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-heading text-2xl font-bold text-amanat-brown">{title}</h2>
              <button type="button" onClick={onClose} className="rounded-full border border-amanat-brown/15 px-3 py-1 text-sm font-black text-amanat-brown">
                Close
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const RING_SIZE_ROWS = [
  { india: "8", us: "4", diameterMm: "14.9", circumferenceMm: "46.8" },
  { india: "10", us: "5", diameterMm: "15.7", circumferenceMm: "49.3" },
  { india: "12", us: "6", diameterMm: "16.5", circumferenceMm: "51.9" },
  { india: "14", us: "7", diameterMm: "17.3", circumferenceMm: "54.4" },
  { india: "16", us: "8", diameterMm: "18.1", circumferenceMm: "56.9" },
  { india: "18", us: "9", diameterMm: "18.9", circumferenceMm: "59.5" },
  { india: "20", us: "10", diameterMm: "19.8", circumferenceMm: "62.1" }
];

function RingSizeGuideModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <GuideModalShell isOpen={isOpen} onClose={onClose} title="Ring Size Guide">
      <p className="mt-3 text-sm leading-6 text-stone-600">
        Standard reference measurements. Wrap a strip of paper
        around your finger, mark where it overlaps, and measure the length against the circumference column below.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead className="text-xs font-black uppercase tracking-[0.1em] text-amanat-sage">
            <tr>
              <th className="py-2">India</th>
              <th className="py-2">US</th>
              <th className="py-2">Diameter (mm)</th>
              <th className="py-2">Circumference (mm)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amanat-brown/10 font-bold text-amanat-brown">
            {RING_SIZE_ROWS.map((row) => (
              <tr key={row.india}>
                <td className="py-2">{row.india}</td>
                <td className="py-2">{row.us}</td>
                <td className="py-2">{row.diameterMm}</td>
                <td className="py-2">{row.circumferenceMm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GuideModalShell>
  );
}

const CHAIN_LENGTH_ROWS = [
  { length: "14 in", style: "Choker", fit: "Sits snugly at the base of the neck" },
  { length: "16 in", style: "Collar", fit: "Rests on the collarbone" },
  { length: "18 in", style: "Princess", fit: "Falls just below the collarbone — the most common everyday length" },
  { length: "20 in", style: "Matinee", fit: "Sits at the top of the bust" },
  { length: "24 in", style: "Opera", fit: "Falls at or below the bust, layers well over necklines" }
];

function ChainLengthGuideModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <GuideModalShell isOpen={isOpen} onClose={onClose} title="Chain Length Guide">
      <p className="mt-3 text-sm leading-6 text-stone-600">
        Standard reference lengths. Measure an existing necklace you like the fit
        of, end to end, and compare it against the lengths below.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead className="text-xs font-black uppercase tracking-[0.1em] text-amanat-sage">
            <tr>
              <th className="py-2">Length</th>
              <th className="py-2">Style</th>
              <th className="py-2">Typical fit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amanat-brown/10 font-bold text-amanat-brown">
            {CHAIN_LENGTH_ROWS.map((row) => (
              <tr key={row.length}>
                <td className="py-2">{row.length}</td>
                <td className="py-2">{row.style}</td>
                <td className="py-2 text-sm font-medium text-stone-600">{row.fit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GuideModalShell>
  );
}
