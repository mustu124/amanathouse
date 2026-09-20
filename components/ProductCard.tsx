"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { fadeInUp } from "@/lib/animations";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { getDisplayMediaUrl } from "@/lib/media";
import type { StoreProduct } from "@/lib/product-data";

type ProductCardProps = {
  product: StoreProduct;
  onQuickView?: (product: StoreProduct) => void;
  onMoreLikeThis?: (product: StoreProduct) => void;
};

function optimizedMediaUrl(src: string, width = 700) {
  return getDisplayMediaUrl(src);
}

export function ProductCard({ product, onQuickView, onMoreLikeThis }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const { addItem, items } = useCart();
  const productHref = `/shop/${product.slug}`;
  const image = product.images[0];
  const cartQuantity = items
    .filter((item) => item.product._id === product._id)
    .reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    const stored = window.localStorage.getItem("amanat-house-wishlist");
    const wishlist = stored ? (JSON.parse(stored) as string[]) : [];
    setIsWishlisted(wishlist.includes(product._id));
  }, [product._id]);

  const toggleWishlist = () => {
    const stored = window.localStorage.getItem("amanat-house-wishlist");
    const wishlist = stored ? (JSON.parse(stored) as string[]) : [];
    const nextWishlist = wishlist.includes(product._id)
      ? wishlist.filter((id) => id !== product._id)
      : [...wishlist, product._id];

    window.localStorage.setItem("amanat-house-wishlist", JSON.stringify(nextWishlist));
    setIsWishlisted(nextWishlist.includes(product._id));
  };

  const maxedOut = cartQuantity >= product.stockCount;

  const handleAddToCart = () => {
    if (!product.inStock || maxedOut) return;
    addItem(product);
    setIsAdded(true);
    window.setTimeout(() => setIsAdded(false), 1200);
  };

  return (
    <motion.article
      layout
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-amanat-brown/10 bg-white shadow-[0_14px_34px_rgba(42,33,28,0.08)]"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-amanat-sand">
        <Link href={productHref} aria-label={`View ${product.name}`}>
          <motion.div className="h-full w-full" whileHover={{ scale: 1.08 }} transition={{ duration: 0.55 }}>
            <Image
              src={image?.url ? optimizedMediaUrl(image.url, 700) : "/logo-mark.png"}
              alt={image?.alt ?? product.name}
              fill
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
              loading="lazy"
              quality={78}
              className="object-cover"
            />
          </motion.div>
        </Link>

        <div className="absolute left-2 top-2 z-10 flex flex-col items-start gap-1.5 sm:left-3 sm:top-3">
          {product.badges?.[0] && (
            <span className="rounded-[2px] border border-gold/40 bg-blush px-2.5 py-1 text-xs font-black uppercase tracking-[0.08em] text-ink">
              {product.badges[0]}
            </span>
          )}
          {!product.inStock && (
            <span className="rounded-full bg-amanat-brown px-2.5 py-1 text-xs font-black uppercase tracking-[0.08em] text-white">
              Out of Stock
            </span>
          )}
        </div>

        <motion.button
          type="button"
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          onClick={toggleWishlist}
          animate={{ scale: isWishlisted ? [1, 1.28, 1] : 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 18 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.88 }}
          className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-amanat-terracotta shadow-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-amanat-terracotta sm:right-3 sm:top-3 sm:h-10 sm:w-10"
        >
          <HeartIcon filled={isWishlisted} />
        </motion.button>

        <motion.div
          initial={{ y: "110%", opacity: 0 }}
          whileHover={{ y: 0, opacity: 1 }}
          className="absolute inset-x-2 bottom-2 sm:inset-x-3 sm:bottom-3"
        >
          <motion.button
            type="button"
            onClick={handleAddToCart}
            disabled={!product.inStock || maxedOut}
            whileHover={product.inStock && !maxedOut ? { scale: 1.02 } : undefined}
            whileTap={product.inStock && !maxedOut ? { scale: 0.97 } : undefined}
            className="btn-primary w-full text-xs"
          >
            {isAdded ? "✓ Added" : !product.inStock ? "Out of Stock" : maxedOut ? "Max in Cart" : "Add to Cart"}
          </motion.button>
        </motion.div>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <Link href={productHref} className="block focus:outline-none focus:ring-2 focus:ring-amanat-terracotta">
          <h3 className="min-h-[2.35rem] font-heading text-[13px] font-bold leading-tight text-amanat-brown sm:text-[15px]">
            {product.name}
          </h3>
        </Link>
        <div className="mt-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex max-w-full flex-wrap gap-1.5">
            <span className="inline-flex min-h-7 max-w-full items-center rounded-full bg-amanat-cream px-2.5 py-1 text-xs font-black uppercase leading-tight tracking-[0.08em] text-amanat-sage sm:min-h-0 sm:px-3 sm:tracking-[0.1em]">
              {product.category}
            </span>
            {product.subcategory && (
              <span className="inline-flex min-h-7 max-w-full items-center rounded-full border border-amanat-brown/10 bg-white px-2.5 py-1 text-xs font-black uppercase leading-tight tracking-[0.08em] text-amanat-terracotta sm:min-h-0 sm:px-3 sm:tracking-[0.1em]">
                {product.subcategory}
              </span>
            )}
          </div>
          <span className="font-black text-amanat-brown sm:text-base">{"\u20B9"}{product.price.toLocaleString("en-IN")}</span>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-3 sm:pt-4">
          <IconAction
            label={`Show more products like ${product.name}`}
            onClick={() => onMoreLikeThis?.(product)}
          >
            <ShuffleIcon />
          </IconAction>
          <IconAction label={`Quick view ${product.name}`} onClick={() => onQuickView?.(product)}>
            <MagnifyIcon />
          </IconAction>
        </div>
        {cartQuantity > 0 && (
          <p className="mt-2 text-center text-xs font-black uppercase tracking-[0.12em] text-amanat-sage">
            In cart: {cartQuantity}
          </p>
        )}
      </div>
    </motion.article>
  );
}

export function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-amanat-brown/10 bg-white">
      <div className="aspect-[3/4] animate-pulse bg-amanat-sand" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-amanat-sand" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-amanat-sand" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-10 animate-pulse rounded-full bg-amanat-sand" />
          <div className="h-10 animate-pulse rounded-full bg-amanat-sand" />
        </div>
      </div>
    </div>
  );
}

export function QuickViewModal({
  product,
  onClose
}: {
  product: StoreProduct | null;
  onClose: () => void;
}) {
  useEscapeKey(Boolean(product), onClose);
  const trapRef = useFocusTrap(Boolean(product));

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={`Quick view ${product.name}`}
          onClick={onClose}
        >
          <motion.div
            ref={trapRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="grid max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-amanat-cream shadow-soft md:grid-cols-[0.95fr_1.05fr] focus:outline-none"
          >
            <div className="relative aspect-[4/5] bg-amanat-sand md:aspect-auto">
              <Image
                src={product.images[0]?.url ? optimizedMediaUrl(product.images[0].url, 1000) : "/logo-mark.png"}
                alt={product.images[0]?.alt ?? product.name}
                fill
                sizes="(min-width: 768px) 44vw, 92vw"
                loading="lazy"
                quality={82}
                className="object-cover"
              />
            </div>
            <div className="overflow-y-auto p-6 md:p-8">
              <button
                type="button"
                onClick={onClose}
                className="float-right rounded-full border border-amanat-brown/15 px-3 py-1 text-sm font-black text-amanat-brown focus:outline-none focus:ring-2 focus:ring-amanat-terracotta"
              >
                Close
              </button>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amanat-sage">
                {product.subcategory ? `${product.category} / ${product.subcategory}` : product.category}
              </p>
              <h2 className="mt-3 font-heading text-3xl font-bold text-amanat-brown">{product.name}</h2>
              <p className="mt-3 text-2xl font-black text-amanat-terracotta">
                {"\u20B9"}{product.price.toLocaleString("en-IN")}
              </p>
              <p className="mt-5 leading-7 text-stone-700">{product.description}</p>
              <Link href={`/shop/${product.slug}`} className="btn-primary mt-7">
                View Details
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function IconAction({
  label,
  onClick,
  children
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileHover={{ y: -2, backgroundColor: "#FAF5EC" }}
      whileTap={{ scale: 0.96 }}
      className="flex h-9 items-center justify-center rounded-full border border-amanat-brown/12 text-amanat-brown focus:outline-none focus:ring-2 focus:ring-amanat-terracotta sm:h-10"
    >
      {children}
    </motion.button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"}>
      <path
        d="M12 20.3S4.5 16.1 3 10.2C2.2 7 4.2 4.5 7.2 4.5c1.7 0 3.3.9 4.1 2.4.8-1.5 2.4-2.4 4.1-2.4 3 0 5 2.5 4.2 5.7C18.1 16.1 12 20.3 12 20.3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShuffleIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M16 3h5v5M4 17h3.5c2.2 0 3.7-1.2 5-3.2l2.7-4.2C16.4 7.8 17.8 7 20 7h1M16 21h5v-5M4 7h3.4c1.7 0 2.9.7 4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MagnifyIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M10.8 18.1a7.3 7.3 0 1 0 0-14.6 7.3 7.3 0 0 0 0 14.6Z" stroke="currentColor" strokeWidth="2" />
      <path d="m16.2 16.2 4.3 4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
