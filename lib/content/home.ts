// Homepage copy — single source of truth for hero slides, the marquee
// ticker, the editorial "everyday stack" block, and testimonials, so future
// copy edits touch this one file instead of every homepage component.

export type ContentHeroSlide = {
  image: string;
  mobileImage?: string;
  headline: string;
  subtitle?: string;
  ctaText: string;
  ctaLink: string;
};

export const HOME_HERO_SLIDES: ContentHeroSlide[] = [
  {
    image: "/hero/hero-4.webp",
    mobileImage: "/hero/hero-4-mobile.webp",
    headline: "Details, done right.",
    subtitle: "Rings and earrings finished in 18K PVD gold — waterproof, anti-tarnish, made to be stacked and worn every day.",
    ctaText: "Shop Now",
    ctaLink: "/shop"
  },
  {
    image: "/hero/hero-1.webp",
    mobileImage: "/hero/hero-1-mobile.webp",
    headline: "Made to be kept.",
    subtitle:
      "Everyday jewellery in 18K gold-plated steel — anti-tarnish, waterproof, yours for the long run.",
    ctaText: "Shop Now",
    ctaLink: "/shop"
  },
  {
    image: "/hero/hero-2.webp",
    mobileImage: "/hero/hero-2-mobile.webp",
    headline: "Wear it every day.",
    subtitle: "316L stainless steel with 18K PVD gold plating, built for daily wear — not just special occasions.",
    ctaText: "Shop Now",
    ctaLink: "/shop"
  },
  {
    image: "/hero/hero-3.webp",
    mobileImage: "/hero/hero-3-mobile.webp",
    headline: "Stack your story.",
    subtitle: "Mix pearls, charms, and chains into a look that's entirely yours. Minimal. Modern. Made to be your Amanat.",
    ctaText: "Shop Now",
    ctaLink: "/shop"
  }
];

export const MARQUEE_TICKER_TEXT =
  "Free shipping on orders above ₹999 · Welcome offer: 5% off with code new50 · Anti-tarnish & waterproof · 18K PVD gold plating · 6-month warranty · New drops every month";

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

export const EVERYDAY_STACK_IMAGE = "/brand/stack.webp";

export type HomeTestimonial = {
  quote: string;
  name: string;
  city: string;
};

// No customer reviews have been supplied yet, so this stays empty and the
// homepage hides the testimonials section. Add real, verified reviews here.
export const HOME_TESTIMONIALS: HomeTestimonial[] = [];

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
