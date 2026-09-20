import type { CartItem } from "@/context/CartContext";
import { env } from "@/lib/env";
import { formatMoney } from "@/lib/pricing/hamper";

export type CustomerInfo = {
  name: string;
  phone: string;
  email?: string;
  address: string;
  pincode: string;
};

const STORE_NAME = "Amanat House";

// The one WhatsApp link builder every entry point in the app should call —
// normalises the number (digits only, no + or spaces) and URL-encodes the
// message. Pass no `phone` for a generic "share to anyone" wa.me link.
export function whatsappLink(message: string, phone?: string) {
  const normalizedPhone = phone ? phone.replace(/\D/g, "") : "";
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

const BR = String.fromCharCode(10);
const inr = formatMoney;

function describeLine(item: CartItem, index: number, compact: boolean) {
  const hamper = item.hamper;
  if (!hamper) {
    const variant = item.selectedVariant ? ` (${item.selectedVariant})` : "";
    return `${index + 1}. ${item.product.name}${variant} x${item.quantity} — ${inr(item.product.price * item.quantity)}`;
  }

  const contents = hamper.items
    .map((line) => {
      const detail = [line.variant, line.size].filter(Boolean).join(", ");
      const price = compact ? "" : ` — ${inr(line.unitPrice * line.quantity)}`;
      return `   • ${line.name}${detail ? ` (${detail})` : ""} x${line.quantity}${price}`;
    })
    .join(BR);
  const breakdown = [
    `   Items subtotal: ${inr(hamper.itemsSubtotal)}`,
    hamper.discountAmount > 0 ? `   Hamper discount: −${inr(hamper.discountAmount)}` : "",
    hamper.packagingFee > 0 ? `   Packaging: ${inr(hamper.packagingFee)}` : "",
    `   Hamper total: ${inr(hamper.total)}`
  ]
    .filter(Boolean)
    .join(BR);

  return `${index + 1}. 🎁 *${hamper.name}* (Hamper) x${item.quantity} — ${inr(hamper.total * item.quantity)}${BR}${contents}${BR}${breakdown}`;
}

// Browsers and WhatsApp handle long wa.me links, but very long ones risk being
// cut off, so a large cart drops per-item prices from hamper contents.
const MAX_LINK_LENGTH = 3800;

export function buildWhatsAppMessage(cartItems: CartItem[], customerInfo: CustomerInfo) {
  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const compose = (compact: boolean) => `*${STORE_NAME} — New Order*

*Order Details:*
${cartItems.map((item, index) => describeLine(item, index, compact)).join(BR + BR)}

*Order Total: ${inr(total)}*

*Customer Details:*
Name: ${customerInfo.name}
Pincode: ${customerInfo.pincode}
Phone: ${customerInfo.phone}
Address: ${customerInfo.address}${customerInfo.email ? `
Email: ${customerInfo.email}` : ""}`;

  const full = whatsappLink(compose(false), env.whatsappNumber);
  return full.length <= MAX_LINK_LENGTH ? full : whatsappLink(compose(true), env.whatsappNumber);
}
