"use client";

import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart, type CartItem } from "@/context/CartContext";
import { buildWhatsAppMessage, type CustomerInfo } from "@/lib/whatsapp";
import { slideInRight, staggerContainer } from "@/lib/animations";
import { getDisplayMediaUrl } from "@/lib/media";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useFocusTrap } from "@/hooks/useFocusTrap";

type CheckoutFormState = CustomerInfo & {
  email: string;
};

const initialForm: CheckoutFormState = {
  name: "",
  phone: "",
  email: "",
  address: "",
  pincode: ""
};

export function CartSidebar() {
  const {
    items,
    isCartOpen,
    closeCart,
    itemCount,
    totalPrice,
    updateQuantity,
    removeItem,
    clearCart
  } = useCart();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    const openCheckout = () => {
      window.setTimeout(() => setIsCheckoutOpen(true), 120);
    };

    window.addEventListener("amanat-house:start-checkout", openCheckout);
    return () => window.removeEventListener("amanat-house:start-checkout", openCheckout);
  }, []);

  useEscapeKey(isCartOpen && !isCheckoutOpen, closeCart);
  const cartTrapRef = useFocusTrap(isCartOpen && !isCheckoutOpen);

  return (
    <>
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close cart backdrop"
              className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCart}
            />
            <motion.aside
              ref={cartTrapRef}
              tabIndex={-1}
              className="fixed right-0 top-0 z-[90] flex h-dvh w-full flex-col bg-amanat-cream text-amanat-brown shadow-[-24px_0_70px_rgba(0,0,0,0.24)] focus:outline-none sm:max-w-[420px]"
              variants={slideInRight}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="dialog"
              aria-modal="true"
              aria-label="Your Cart"
            >
              <header className="flex items-center justify-between border-b border-amanat-brown/10 p-5">
                <div className="flex items-center gap-3">
                  <h2 className="font-heading text-3xl font-bold">Your Cart</h2>
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="rounded-full bg-amanat-terracotta px-3 py-1 text-xs font-black text-white"
                  >
                    {itemCount}
                  </motion.span>
                </div>
                <button
                  type="button"
                  onClick={closeCart}
                  aria-label="Close cart"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-amanat-brown/15 font-black focus:outline-none focus:ring-2 focus:ring-amanat-terracotta"
                >
                  ×
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-5">
                {items.length === 0 ? (
                  <EmptyCart onClose={closeCart} />
                ) : (
                  <motion.div
                    className="grid gap-4"
                    initial="hidden"
                    animate="show"
                    variants={{ hidden: staggerContainer.hidden, show: { transition: { staggerChildren: 0.06 } } }}
                  >
                    {items.map((item) => (
                      <motion.article
                        key={`${item.product._id}-${item.selectedVariant ?? "default"}`}
                        variants={{
                          hidden: { opacity: 0, x: 24 },
                          show: { opacity: 1, x: 0 }
                        }}
                        className="grid grid-cols-[60px_1fr_auto] gap-3 rounded-2xl bg-white p-3 shadow-sm"
                      >
                        <Link href={`/shop/${item.product.slug}`} onClick={closeCart}>
                          <Image
                            src={getDisplayMediaUrl(item.product.images[0]?.url)}
                            alt={item.product.images[0]?.alt ?? item.product.name}
                            width={60}
                            height={60}
                            className="h-[60px] w-[60px] rounded-xl object-cover"
                          />
                        </Link>
                        <div>
                          <Link
                            href={`/shop/${item.product.slug}`}
                            onClick={closeCart}
                            className="font-heading text-base font-bold leading-tight"
                          >
                            {item.product.name}
                          </Link>
                          <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-amanat-sage">
                            {item.product.category}
                          </p>
                          {item.selectedVariant && (
                            <p className="mt-1 text-xs font-bold text-stone-500">Size: {item.selectedVariant}</p>
                          )}
                          <p className="mt-2 font-black text-amanat-terracotta">
                            ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-between gap-3">
                          <motion.button
                            type="button"
                            aria-label={`Remove ${item.product.name}`}
                            onClick={() => removeItem(item.product._id, item.selectedVariant)}
                            whileHover={{ scale: 1.08, color: "#b91c1c" }}
                            whileTap={{ scale: 0.9 }}
                            className="text-amanat-terracotta"
                          >
                            <TrashIcon />
                          </motion.button>
                          <div className="flex items-center rounded-full border border-amanat-brown/15">
                            <button
                              type="button"
                              aria-label={`Decrease ${item.product.name} quantity`}
                              onClick={() =>
                                updateQuantity(item.product._id, item.quantity - 1, item.selectedVariant)
                              }
                              className="h-8 w-8 font-black"
                            >
                              -
                            </button>
                            <span className="w-7 text-center text-sm font-black">{item.quantity}</span>
                            <button
                              type="button"
                              aria-label={`Increase ${item.product.name} quantity`}
                              disabled={item.quantity >= item.product.stockCount}
                              onClick={() =>
                                updateQuantity(item.product._id, item.quantity + 1, item.selectedVariant)
                              }
                              className="h-8 w-8 font-black disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                          {item.quantity >= item.product.stockCount && (
                            <p className="text-xs font-bold uppercase tracking-[0.08em] text-amanat-terracotta">
                              Max stock reached
                            </p>
                          )}
                        </div>
                      </motion.article>
                    ))}
                  </motion.div>
                )}
              </div>

              <footer className="sticky bottom-0 border-t border-amanat-brown/10 bg-amanat-cream p-5">
                <div className="flex items-center justify-between font-black">
                  <span>Subtotal</span>
                  <span>₹{totalPrice.toLocaleString("en-IN")}</span>
                </div>
                <p className="mt-2 text-sm font-bold text-amanat-sage">Shipping calculated at checkout</p>
                <motion.button
                  type="button"
                  disabled={items.length === 0}
                  onClick={() => setIsCheckoutOpen(true)}
                  whileHover={{ y: items.length ? -2 : 0 }}
                  whileTap={{ scale: items.length ? 0.98 : 1 }}
                  className="btn-primary mt-4 w-full disabled:cursor-not-allowed"
                >
                  <WhatsAppIcon />
                  Place Order via WhatsApp
                </motion.button>
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        items={items}
        totalPrice={totalPrice}
        onClose={() => setIsCheckoutOpen(false)}
        onComplete={() => {
          clearCart();
        }}
      />
    </>
  );
}

function EmptyCart({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-28 w-28 items-center justify-center rounded-full bg-white text-5xl shadow-soft"
      >
        🧺
      </motion.div>
      <h3 className="mt-6 font-heading text-3xl font-bold">Your cart is empty</h3>
      <p className="mt-2 max-w-xs text-stone-600">Add a piece and it will wait here for checkout.</p>
      <Link href="/shop" onClick={onClose} className="btn-primary mt-6">
        Start Shopping
      </Link>
    </div>
  );
}

function CheckoutModal({
  isOpen,
  items,
  totalPrice,
  onClose,
  onComplete
}: {
  isOpen: boolean;
  items: CartItem[];
  totalPrice: number;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [form, setForm] = useState<CheckoutFormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const isConfirmed = Boolean(orderNumber);
  const closeModal = () => {
    setOrderNumber("");
    setForm(initialForm);
    setErrors({});
    onClose();
  };

  useEscapeKey(isOpen, closeModal);
  const checkoutTrapRef = useFocusTrap(isOpen);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Name is required.";
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 10) {
      nextErrors.phone = "Valid phone number is required.";
    }
    if (!form.address.trim()) nextErrors.address = "Delivery address is required.";
    if (!form.pincode.trim() || form.pincode.replace(/\D/g, "").length < 6) {
      nextErrors.pincode = "Valid pincode is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const customerInfo: CustomerInfo = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      pincode: form.pincode.trim()
    };
    const whatsappUrl = buildWhatsAppMessage(items, customerInfo);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.product._id,
            name: item.product.name,
            image: item.product.images[0]?.url,
            price: item.product.price,
            quantity: item.quantity,
            selectedVariant: item.selectedVariant
          })),
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          customerEmail: customerInfo.email,
          deliveryAddress: customerInfo.address,
          pincode: customerInfo.pincode,
          totalAmount: totalPrice,
          whatsappSent: true
        })
      });
      const data = (await response.json()) as {
        data?: { order?: { orderNumber?: string } };
        order?: { orderNumber?: string };
      };
      setOrderNumber(
        data.data?.order?.orderNumber ??
          data.order?.orderNumber ??
          `AR-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`
      );
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      confetti({ particleCount: 120, spread: 72, origin: { y: 0.65 } });
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof CheckoutFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[120] overflow-y-auto bg-black/55 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Checkout details"
        >
          <motion.div
            ref={checkoutTrapRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            className="mx-auto mt-10 max-w-2xl rounded-2xl bg-amanat-cream p-6 text-amanat-brown shadow-soft focus:outline-none md:p-8"
          >
            {isConfirmed ? (
              <ConfirmationScreen orderNumber={orderNumber} onClose={closeModal} />
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-amanat-sage">Almost there</p>
                    <h2 className="mt-2 font-heading text-3xl font-bold">Delivery Details</h2>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-full border border-amanat-brown/15 px-3 py-1 font-black"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={submitOrder} className="mt-6 grid gap-4">
                  <FormField label="Name" error={errors.name}>
                    <input
                      value={form.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      className="field-input"
                      required
                    />
                  </FormField>
                  <FormField label="Phone" error={errors.phone}>
                    <input
                      value={form.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                      className="field-input"
                      required
                    />
                  </FormField>
                  <FormField label="Email">
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      className="field-input"
                    />
                  </FormField>
                  <FormField label="Delivery address" error={errors.address}>
                    <textarea
                      value={form.address}
                      onChange={(event) => updateField("address", event.target.value)}
                      className="field-input min-h-28 resize-none"
                      required
                    />
                  </FormField>
                  <FormField label="Pincode" error={errors.pincode}>
                    <input
                      value={form.pincode}
                      onChange={(event) => updateField("pincode", event.target.value)}
                      className="field-input"
                      required
                    />
                  </FormField>

                  <div className="rounded-2xl bg-white p-4">
                    <div className="flex justify-between font-black">
                      <span>Order Total</span>
                      <span>₹{totalPrice.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-60">
                    {isSubmitting ? "Creating Order..." : "Send Order on WhatsApp"}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FormField({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      {children}
      {error && <span className="text-xs font-bold text-red-700">{error}</span>}
    </label>
  );
}

function ConfirmationScreen({ orderNumber, onClose }: { orderNumber: string; onClose: () => void }) {
  return (
    <div className="py-8 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: [0, -6, 6, 0] }}
        className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#1fa855] text-4xl text-white"
      >
        ✓
      </motion.div>
      <h2 className="mt-6 font-heading text-4xl font-bold">Order Sent</h2>
      <p className="mt-3 text-lg font-black text-amanat-terracotta">{orderNumber}</p>
      <p className="mx-auto mt-4 max-w-md leading-7 text-stone-700">
        Your order has been sent to WhatsApp. We&apos;ll confirm within 24 hours.
      </p>
      <button type="button" onClick={onClose} className="btn-primary mt-7">
        Done
      </button>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7l1-3h4l1 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M5.4 18.7 6.3 15A7.7 7.7 0 1 1 9 17.7l-3.6 1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.2 8.8c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .5.4l.6 1.4c.1.3.1.5-.1.7l-.4.5c.5 1 1.3 1.8 2.4 2.3l.6-.5c.2-.2.4-.2.7-.1l1.4.7c.3.1.4.3.4.6v.4c0 .3-.1.5-.4.7-.5.3-1.1.5-1.7.4-3-.4-5.5-2.8-6-5.8-.1-.5.1-1 .4-1.3Z" fill="currentColor" />
    </svg>
  );
}
