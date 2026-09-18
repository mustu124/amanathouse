// Homepage copy — single source of truth for hero slides, the marquee
// ticker, the editorial "everyday stack" block, and testimonials, so future
// copy edits touch this one file instead of every homepage component.

export type ContentHeroSlide = {
  image: string;
  headline: string;
  subtitle?: string;
  ctaText: string;
  ctaLink: string;
};

export const HOME_HERO_SLIDES: ContentHeroSlide[] = [
  {
    image: "/logo.png",
    headline: "Made to be kept.",
    subtitle:
      "Everyday jewellery in 18K gold-plated steel — anti-tarnish, waterproof, yours for the long run.",
    ctaText: "Shop Now",
    ctaLink: "/shop"
  },
  {
    image: "/logo.png",
    headline: "Wear it every day.",
    subtitle: "316L stainless steel with 18K PVD gold plating, built for daily wear — not just special occasions.",
    ctaText: "Shop Now",
    ctaLink: "/shop"
  },
  {
    image: "/logo.png",
    headline: "Stack your story.",
    subtitle: "Mix rings, chains, and studs into a look that's entirely yours. Minimal. Modern. Made to be your Amanat.",
    ctaText: "Shop Now",
    ctaLink: "/shop"
  }
];

export const MARQUEE_TICKER_TEXT =
  "Free shipping on orders above ₹999 · Anti-tarnish & waterproof · 18K PVD gold plating · New drops every month";

export type EverydayStackTip = {
  title: string;
  body: string;
};

export const EVERYDAY_STACK_TIPS: EverydayStackTip[] = [
  {
    title: "Layer different lengths",
    body: "Pair a shorter chain sitting at the collarbone with a longer pendant piece so each layer stays visible instead of overlapping."
  },
  {
    title: "Mix metal tones with intent",
    body: "Gold and silver pieces can sit together — pick one dominant tone and let the other play a smaller, supporting role."
  },
  {
    title: "Build day-to-night pieces",
    body: "Keep studs and a fine chain on for daytime, then add a stack of rings or a pair of hoops to carry the same look into evening."
  },
  {
    title: "Care for the plating",
    body: "Put jewellery on last, after perfume and lotion, and wipe pieces down with a soft cloth after wear to keep the finish looking new."
  }
];

export const EVERYDAY_STACK_IMAGE = "/placeholder-product.png";

export type HomeTestimonial = {
  quote: string;
  name: string;
  city: string;
};

// Placeholder testimonials — replace with real, verified customer reviews before launch.
export const HOME_TESTIMONIALS: HomeTestimonial[] = [
  {
    quote:
      "I wear my rings every day, including in the shower, and they still look brand new months later. No tarnishing at all.",
    name: "Ananya R.",
    city: "Bengaluru"
  },
  {
    quote:
      "Bought the chain and stud set as a gift for my sister — the packaging felt premium and she hasn't taken them off since.",
    name: "Priya M.",
    city: "Mumbai"
  },
  {
    quote:
      "Finally jewellery that survives my daily routine — gym, swimming, everything — and still holds its shine.",
    name: "Karan S.",
    city: "Delhi"
  }
];

export function getInstagramHandleLabel(instagramUrl?: string) {
  if (!instagramUrl) return "Follow us on Instagram";

  try {
    const url = new URL(instagramUrl);
    const handle = url.pathname.split("/").filter(Boolean)[0];
    return handle ? `Follow us @${handle}` : "Follow us on Instagram";
  } catch {
    return "Follow us on Instagram";
  }
}
