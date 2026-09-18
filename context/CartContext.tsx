"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import type { StoreProduct } from "@/lib/product-data";

const CART_STORAGE_KEY = "amanat-house-cart";

export type CartProduct = Pick<StoreProduct, "_id" | "name" | "slug" | "price" | "images" | "stockCount"> & {
  category: string;
};

export type CartItem = {
  product: CartProduct;
  quantity: number;
  selectedVariant?: string;
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
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  isCartOpen: boolean;
  itemCount: number;
  totalCount: number;
  subtotal: number;
  totalPrice: number;
};

type CartAction =
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
