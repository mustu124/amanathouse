// Shared policy copy for the footer, contact page, and PDP shipping/returns
// accordion, so all three stay in sync from one place. Returns, shipping and
// warranty terms come from the client's product document.

export const RETURNS_POLICY_TEXT =
  "Please record a clear unboxing video while opening your package — it is mandatory for any return or exchange request. If you receive a damaged, defective, or incorrect product, you can request an exchange within 5–7 days of delivery. We also accept returns within 5–7 days of delivery, provided the item is unused, in its original condition, and returned with its original packaging. Requests without a valid unboxing video may not be eligible.";

export const SHIPPING_POLICY_TEXT =
  "We offer reliable domestic standard shipping across India, with delivery typically taking 5–7 business days after processing. All packages are shipped with tracking and are fully insured until delivery.";

export const WARRANTY_TEXT = "Every Amanat House piece comes with a 6-month warranty.";

export const CARE_WARRANTY_TEXT = `${WARRANTY_TEXT} Our pieces are anti-tarnish and waterproof, made for daily wear. If there's any issue with your order, message us on WhatsApp with your order number and we're here to help.`;

// We reply to WhatsApp and email within one working day; no fixed opening
// hours were provided, so none are stated.
export const BUSINESS_HOURS_TEXT = "We reply to WhatsApp and email messages within one working day.";

export type ContactFaqItem = {
  question: string;
  answer: string;
};

export const CONTACT_FAQ: ContactFaqItem[] = [
  {
    question: "How long does shipping take?",
    answer: SHIPPING_POLICY_TEXT
  },
  {
    question: "What's your return policy?",
    answer: RETURNS_POLICY_TEXT
  },
  {
    question: "Will my jewellery tarnish?",
    answer: CARE_WARRANTY_TEXT
  },
  {
    question: "How do I find my size?",
    answer:
      "Ring and necklace product pages have a size guide — open it from the size selector before you order. Message us on WhatsApp if you're still unsure."
  }
];
