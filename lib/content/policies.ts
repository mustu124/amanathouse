// Shared policy copy for the footer, contact page, and PDP shipping/returns
// accordion, so all three stay in sync from one place. Numbers/terms marked
// TODO-confirm are placeholders — the client has not given exact figures.

// TODO-confirm: exact return window and condition wording with the client.
export const RETURNS_POLICY_TEXT =
  "Returns are accepted within 7 days of delivery for damaged or incorrect items. Message us on WhatsApp with your order number and a photo of the item to start a return.";

// TODO-confirm: dispatch time and any shipping charge threshold with the client.
export const SHIPPING_POLICY_TEXT = "We ship all over India. Orders are dispatched within 2-3 business days of confirmation.";

// TODO-confirm: exact warranty coverage/duration with the client — kept
// general here since no specific terms were provided.
export const CARE_WARRANTY_TEXT =
  "Every piece is anti-tarnish and waterproof, made for daily wear. If a piece tarnishes or the plating wears under normal use, message us on WhatsApp with your order number and we'll make it right.";

// TODO-confirm: real business hours with the client — none were provided,
// so this states our current reply-time commitment instead of inventing a schedule.
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
      "Every ring and necklace product page has a size guide with placeholder measurements — open it from the size selector before you order. Message us on WhatsApp if you're still unsure."
  }
];
