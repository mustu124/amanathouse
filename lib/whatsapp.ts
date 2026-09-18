import type { CartItem } from "@/context/CartContext";
import { env } from "@/lib/env";

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

export function buildWhatsAppMessage(cartItems: CartItem[], customerInfo: CustomerInfo) {
  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const orderLines = cartItems
    .map((item, index) => {
      const variant = item.selectedVariant ? ` (${item.selectedVariant})` : "";
      const lineTotal = item.product.price * item.quantity;

      return `${index + 1}. ${item.product.name}${variant} x${item.quantity} — ₹${lineTotal.toLocaleString("en-IN")}`;
    })
    .join("\n");

  const message = `*${STORE_NAME} — New Order*

*Order Details:*
${orderLines}

*Order Total: ₹${total.toLocaleString("en-IN")}*

*Customer Details:*
Name: ${customerInfo.name}
Pincode: ${customerInfo.pincode}
Phone: ${customerInfo.phone}
Address: ${customerInfo.address}${customerInfo.email ? `\nEmail: ${customerInfo.email}` : ""}`;

  return whatsappLink(message, env.whatsappNumber);
}
