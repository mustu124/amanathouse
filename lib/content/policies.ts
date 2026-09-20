// Shared policy copy for the footer, contact page, and PDP shipping/returns
// accordion, so all three stay in sync from one place. Returns, shipping and
// warranty terms come from the client's product document.

export const SHIPPING_POLICY_INTRO = "At Amanat, every order is packed with love and care.";

export const SHIPPING_POLICY_POINTS = [
  "Orders are processed within 1–3 business days.",
  "Delivery usually takes 5–7 business days, depending on your location.",
  "Once your order is shipped, you will receive a tracking ID/AWB number via email or WhatsApp.",
  "Delivery timelines may vary during sales, festive seasons, or due to unforeseen courier delays."
];

export const RETURNS_POLICY_INTRO = "Your satisfaction is important to us.";

export const RETURNS_POLICY_POINTS = [
  "Please record a clear unboxing video while opening your package. This is mandatory for any return or exchange request.",
  "Returns or exchanges are accepted only if the product is damaged, defective, or incorrect.",
  "You must raise a return/exchange request within 5–7 days of receiving your order.",
  "The item must be unused, in its original packaging, and with all tags intact."
];

export const SHIPPING_POLICY_TEXT = `${SHIPPING_POLICY_INTRO} ${SHIPPING_POLICY_POINTS.join(" ")}`;

export const RETURNS_POLICY_TEXT = `${RETURNS_POLICY_INTRO} ${RETURNS_POLICY_POINTS.join(" ")}`;

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
