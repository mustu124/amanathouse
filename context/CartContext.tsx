"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import type { StoreProduct } from "@/lib/product-data";
import { formatMoney } from "@/lib/pricing/hamper";
import { hamperCartProductId, type HamperCartData } from "@/lib/hampers";

const CART_STORAGE_KEY = "amanat-house-cart";

export type CartProduct = Pick<StoreProduct, "_id" | "name" | "slug" | "price" | "images" | "stockCount"> & {
  category: string;
};

export type CartItem = {
  product: CartProduct;
  quantity: number;
  selectedVariant?: string;
  // Present when this line is a build-your-own hamper. product.price is the
  // hamper total (from calculateHamperPrice) so every existing total keeps working.
  hamper?: HamperCartData;
};

type LegacyCartInput = {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  slug?: string;
  category?: string;
};

type CartState = {
  items: CartItem[];
};

type CartContextValue = CartState & {
  addItem: (product: CartProduct | LegacyCartInput, quantity?: number, selectedVariant?: string) => void;
  removeItem: (productId: string, selectedVariant?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedVariant?: string) => void;
  addHamper: (hamper: HamperCartData, selection: HamperSelection[], quantity?: number, replaceProductId?: string) => void;
  patchHamper: (productId: string, patch: Partial<HamperCartData>) => void;
  confirmHamperPrice: (productId: string) => void;
  hasBlockingHamperNotice: boolean;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  isCartOpen: boolean;
  itemCount: number;
  totalCount: number;
  subtotal: number;
  totalPrice: number;
};

export type HamperSelection = { productId: string; quantity: number; variant?: string | null };

const MAX_HAMPER_QUANTITY = 10;

export function hamperSelectionOf(item: CartItem): HamperSelection[] {
  return (item.hamper?.items ?? []).map((line) => ({ productId: line.productId, quantity: line.quantity, variant: line.variant }));
}

type CartAction =
  | { type: "addHamper"; product: CartProduct; hamper: HamperCartData; quantity: number; replaceProductId?: string }
  | { type: "patchHamper"; productId: string; patch: Partial<HamperCartData> }
  | { type: "confirmHamperPrice"; productId: string }
  | { type: "hydrate"; items: CartItem[] }
  | { type: "add"; product: CartProduct; quantity: number; selectedVariant?: string }
  | { type: "remove"; productId: string; selectedVariant?: string }
  | { type: "updateQuantity"; productId: string; quantity: number; selectedVariant?: string }
  | { type: "clear" };

const CartContext = createContext<CartContextValue | undefined>(undefined);

function getCartKey(productId: string, selectedVariant?: string) {
  return `${productId}::${selectedVariant ?? ""}`;
}

function normalizeCartProduct(product: CartProduct | LegacyCartInput): CartProduct {
  if ("_id" in product) {
    return product;
  }

  return {
    _id: product.productId,
    name: product.name,
    slug: product.slug ?? product.productId,
    category: product.category ?? "Jewellery",
    price: product.price,
    images: product.imageUrl ? [{ url: product.imageUrl, alt: product.name }] : [],
    stockCount: Infinity
  };
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "hydrate":
      return { items: action.items };
    case "addHamper": {
      const replaced = action.replaceProductId
        ? state.items.find((item) => item.product._id === action.replaceProductId)
        : undefined;
      const rest = state.items.filter((item) => item.product._id !== action.replaceProductId);
      const existing = rest.find((item) => item.product._id === action.product._id);
      if (existing) {
        return {
          items: rest.map((item) =>
            item === existing
              ? { ...item, hamper: action.hamper, product: action.product, quantity: Math.min(item.quantity + action.quantity, MAX_HAMPER_QUANTITY) }
              : item
          )
        };
      }
      const quantity = replaced ? replaced.quantity : action.quantity;
      const index = replaced ? state.items.indexOf(replaced) : rest.length;
      const next = [...rest];
      next.splice(Math.min(index, next.length), 0, { product: action.product, quantity, hamper: action.hamper });
      return { items: next };
    }
    case "patchHamper":
      return {
        items: state.items.map((item) =>
          item.product._id === action.productId && item.hamper ? { ...item, hamper: { ...item.hamper, ...action.patch } } : item
        )
      };
    case "confirmHamperPrice":
      return {
        items: state.items.map((item) => {
          if (item.product._id !== action.productId || !item.hamper || item.hamper.freshTotal === undefined) return item;
          const total = item.hamper.freshTotal;
          return {
            ...item,
            product: { ...item.product, price: total },
            hamper: { ...item.hamper, total, notice: undefined, freshTotal: undefined }
          };
        })
      };
    case "add": {
      const stockLimit = action.product.stockCount ?? Infinity;
      const incomingKey = getCartKey(action.product._id, action.selectedVariant);
      const existingItem = state.items.find(
        (item) => getCartKey(item.product._id, item.selectedVariant) === incomingKey
      );
      const currentQuantity = existingItem?.quantity ?? 0;
      const nextQuantity = Math.min(currentQuantity + action.quantity, stockLimit);
      if (nextQuantity <= currentQuantity) return state;

      if (existingItem) {
        return {
          items: state.items.map((item) =>
            getCartKey(item.product._id, item.selectedVariant) === incomingKey
              ? { ...item, quantity: nextQuantity }
              : item
          )
        };
      }

      return {
        items: [
          ...state.items,
          {
            product: action.product,
            quantity: nextQuantity,
            selectedVariant: action.selectedVariant
          }
        ]
      };
    }
    case "remove":
      return {
        items: state.items.filter(
          (item) =>
            getCartKey(item.product._id, item.selectedVariant) !==
            getCartKey(action.productId, action.selectedVariant)
        )
      };
    case "updateQuantity":
      if (action.quantity <= 0) {
        return cartReducer(state, {
          type: "remove",
          productId: action.productId,
          selectedVariant: action.selectedVariant
        });
      }

      return {
        items: state.items.map((item) =>
          getCartKey(item.product._id, item.selectedVariant) ===
          getCartKey(action.productId, action.selectedVariant)
            ? { ...item, quantity: Math.min(action.quantity, item.product.stockCount ?? Infinity) }
            : item
        )
      };
    case "clear":
      return { items: [] };
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);

    if (stored) {
      try {
        dispatch({ type: "hydrate", items: JSON.parse(stored) as CartItem[] });
      } catch {
        window.localStorage.removeItem(CART_STORAGE_KEY);
      }
    }

    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
  }, [hasHydrated, state.items]);

  // Re-validate saved hamper lines against live prices/stock on load and each
  // time the cart opens. A change never rewrites the price silently: it sets a
  // notice the customer must resolve (confirm / edit / remove) before checkout.
  const hamperSignature = state.items
    .filter((item) => item.hamper)
    .map((item) => `${item.product._id}@${item.hamper?.total}`)
    .join("|");
  useEffect(() => {
    if (!hasHydrated || !hamperSignature) return;
    let cancelled = false;

    state.items.forEach(async (item) => {
      const hamper = item.hamper;
      if (!hamper) return;
      try {
        const response = await fetch("/api/hampers/price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: hamper.slug, items: hamperSelectionOf(item) })
        });
        if (cancelled) return;
        const payload = (await response.json()) as {
          success: boolean;
          data: { result: { total: number }; errors: string[] } | null;
        };
        if (!response.ok || !payload.data) {
          dispatch({ type: "patchHamper", productId: item.product._id, patch: { notice: "This hamper is no longer available. Please remove it.", freshTotal: undefined } });
          return;
        }
        const { result, errors } = payload.data;
        if (errors.length) {
          dispatch({ type: "patchHamper", productId: item.product._id, patch: { notice: `${errors[0]} Edit your hamper to continue.`, freshTotal: undefined } });
        } else if (Math.abs(result.total - hamper.total) >= 0.01) {
          dispatch({
            type: "patchHamper",
            productId: item.product._id,
            patch: {
              notice: `The price changed from ${formatMoney(hamper.total)} to ${formatMoney(result.total)}.`,
              freshTotal: result.total
            }
          });
        } else if (hamper.notice) {
          dispatch({ type: "patchHamper", productId: item.product._id, patch: { notice: undefined, freshTotal: undefined } });
        }
      } catch {
        // Offline / API down: leave the line as-is; the order API re-checks server-side anyway.
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, isCartOpen, hamperSignature]);

  const value = useMemo<CartContextValue>(() => {
    const totalCount = state.items.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = state.items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );

    return {
      ...state,
      addItem: (product, quantity = 1, selectedVariant) => {
        dispatch({
          type: "add",
          product: normalizeCartProduct(product),
          quantity,
          selectedVariant
        });
        setIsCartOpen(true);
      },
      addHamper: (hamper, selection, quantity = 1, replaceProductId) => {
        const product: CartProduct = {
          _id: hamperCartProductId(hamper.slug, selection),
          name: hamper.name,
          slug: hamper.slug,
          category: "Hampers",
          price: hamper.total,
          images: hamper.heroImageUrl ? [{ url: hamper.heroImageUrl, alt: hamper.name }] : [],
          stockCount: MAX_HAMPER_QUANTITY
        };
        dispatch({ type: "addHamper", product, hamper, quantity, replaceProductId });
        setIsCartOpen(true);
      },
      patchHamper: (productId, patch) => dispatch({ type: "patchHamper", productId, patch }),
      confirmHamperPrice: (productId) => dispatch({ type: "confirmHamperPrice", productId }),
      hasBlockingHamperNotice: state.items.some((item) => Boolean(item.hamper?.notice)),
      removeItem: (productId, selectedVariant) =>
        dispatch({ type: "remove", productId, selectedVariant }),
      updateQuantity: (productId, quantity, selectedVariant) =>
        dispatch({ type: "updateQuantity", productId, quantity, selectedVariant }),
      clearCart: () => dispatch({ type: "clear" }),
      openCart: () => setIsCartOpen(true),
      closeCart: () => setIsCartOpen(false),
      isCartOpen,
      itemCount: totalCount,
      totalCount,
      subtotal: totalPrice,
      totalPrice
    };
  }, [isCartOpen, state]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider.");
  }

  return context;
}
