"use client";

import { AnimatePresence, motion, useAnimationFrame, useMotionValue, useTransform } from "framer-motion";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { fadeInScale, fadeInUp, staggerContainer } from "@/lib/animations";
import {
  EVERYDAY_STACK_IMAGE,
  EVERYDAY_STACK_TIPS,
  getInstagramHandleLabel,
  HOME_HERO_SLIDES,
  HOME_TESTIMONIALS,
  MARQUEE_TICKER_TEXT
} from "@/lib/content/home";
import { STORE_ADDRESS_TODO } from "@/lib/env";
import { useSiteContact } from "@/lib/use-site-contact";
import { HAMPER_CATEGORY } from "@/lib/hampers";
import { getDisplayMediaUrl } from "@/lib/media";
import { CATEGORY_DETAILS, slugifyCategoryName } from "@/lib/product-data";
import { whatsappLink } from "@/lib/whatsapp";

type CategoryTile = {
  name: string;
  slug: string;
  icon: string;
  image?: string;
  href?: string;
};

type Product = {
  _id: string;
  name: string;
  slug: string;
  isFeatured?: boolean;
  featured?: boolean;
  category: string;
  price: number;
  images: Array<{
    url: string;
    alt: string;
  }>;
  inStock: boolean;
  stockCount: number;
};

type PublicSettings = {
  heroSlides?: Array<{
    image: string;
    title?: string;
    headline?: string;
    name?: string;
    _id?: string;
    id?: string;
    subtitle?: string;
    ctaText?: string;
    ctaLink?: string;
  }>;
  mobileHeroSlides?: Array<{
    image: string;
    title?: string;
    headline?: string;
    name?: string;
    _id?: string;
    id?: string;
    subtitle?: string;
    ctaText?: string;
    ctaLink?: string;
  }>;
  announcementText?: string;
  whatsappNumber?: string;
  storeEmail?: string;
  storeAddress?: string;
  footerCopyright?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
  };
  categories?: Array<{
    name: string;
    slug?: string;
    icon?: string;
    image?: string;
    visible?: boolean;
  }>;
};

type HeroSlide = {
  image: string;
  mobileImage?: string;
  headline: string;
  subtitle?: string;
  cta: string;
  href: string;
};

const heroSlides: HeroSlide[] = HOME_HERO_SLIDES.map((slide) => ({
  image: slide.image,
  mobileImage: slide.mobileImage,
  headline: slide.headline,
  subtitle: slide.subtitle,
  cta: slide.ctaText,
  href: slide.ctaLink
}));

const blockedHeroImageIds = ["wd0gqn7ea0extspvcimh"];
const fallbackHeroHeadline = HOME_HERO_SLIDES[0].headline;

const categories: CategoryTile[] = CATEGORY_DETAILS.map((category) => ({
  name: category.name,
  slug: category.slug,
  icon: category.icon
}));

// Sourced from lib/content/home.ts — the section is hidden while it is empty.
const testimonials = HOME_TESTIMONIALS;

const sectionReveal = { hidden: staggerContainer.hidden, show: staggerContainer.visible };
const itemReveal = { hidden: fadeInUp.hidden, show: fadeInUp.visible };
const scaleReveal = { hidden: fadeInScale.hidden, show: fadeInScale.visible };

function optimizedMediaUrl(src: string, width = 1200) {
  if (src.includes("images.unsplash.com")) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", "80");
    url.searchParams.set("auto", "format");
    return url.toString();
  }

  return getDisplayMediaUrl(src);
}

function looksLikeDatabaseId(value?: string) {
  if (!value) return true;
  const normalized = value.trim();
  const compact = normalized.replace(/[\s-]/g, "");

  return (
    /^[a-f\d]{24}$/i.test(compact) ||
    /^[a-f\d]{32}$/i.test(compact) ||
    /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(normalized)
  );
}

function getProductDisplayName(product: Pick<Product, "name" | "category">) {
  if (!looksLikeDatabaseId(product.name)) return product.name;
  return `Amanat House ${product.category}`;
}

function prioritizeDisplayProducts(products: Product[]) {
  return [...products].sort((a, b) => {
    const aHasRealName = looksLikeDatabaseId(a.name) ? 0 : 1;
    const bHasRealName = looksLikeDatabaseId(b.name) ? 0 : 1;
    if (aHasRealName !== bHasRealName) return bHasRealName - aHasRealName;

    const aFeatured = a.isFeatured || a.featured ? 1 : 0;
    const bFeatured = b.isFeatured || b.featured ? 1 : 0;
    return bFeatured - aFeatured;
  });
}

function getHeroSlideHeadline(slide: NonNullable<PublicSettings["heroSlides"]>[number]) {
  const candidates = [slide.title, slide.headline, slide.name].filter(Boolean) as string[];
  return candidates.find((candidate) => !looksLikeDatabaseId(candidate)) ?? fallbackHeroHeadline;
}

function isConfiguredHeroSlide(slide: NonNullable<PublicSettings["heroSlides"]>[number]) {
  const image = (slide.image ?? "").trim();
  const title = getHeroSlideHeadline(slide).trim();

  return Boolean(
    image &&
      image !== "/logo.png" &&
      !image.includes("images.unsplash.com/photo-1618220179428-22790b461013") &&
      title &&
      !/^Homepage slide \d+$/i.test(title)
  );
}

const frostedTextStyle = {
  background: "rgba(250, 245, 236, 0.55)",
  backdropFilter: "blur(3px)",
  WebkitBackdropFilter: "blur(3px)",
  boxDecorationBreak: "clone",
  WebkitBoxDecorationBreak: "clone",
  padding: "3px 8px 5px 8px",
  borderRadius: "2px"
} as const;

const subtitleFrostedTextStyle = {
  ...frostedTextStyle,
  background: "rgba(250, 245, 236, 0.42)"
} as const;

export default function HomePage() {
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { data?: { settings?: PublicSettings } }) => {
        if (process.env.NODE_ENV === "development") {
          console.debug("Amanat House settings response", payload);
        }
        if (isMounted) setSettings(payload.data?.settings ?? null);
      })
      .catch(() => {
        if (isMounted) setSettings(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobileViewport(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const liveHeroSlides = useMemo<HeroSlide[]>(() => {
    const configuredMobileSlides = settings?.mobileHeroSlides?.filter(isConfiguredHeroSlide);
    const sourceSlides = isMobileViewport && configuredMobileSlides?.length
      ? configuredMobileSlides
      : settings?.heroSlides;
    const slides = sourceSlides
      ?.filter(
        (slide) =>
          slide.image &&
          !blockedHeroImageIds.some((blockedId) => slide.image.includes(blockedId))
      )
      .map((slide) => ({
        image: slide.image,
        headline: getHeroSlideHeadline(slide),
        subtitle: slide.subtitle,
        cta: slide.ctaText || "Shop Now",
        href: slide.ctaLink || "/shop"
      }));

    return slides?.length ? slides : heroSlides;
  }, [isMobileViewport, settings]);

  const liveCategories = useMemo<CategoryTile[]>(() => {
    const nextCategories = settings?.categories
      ?.filter((category) => category.visible !== false)
      .map((category) => ({
        name: category.name,
        slug: category.slug || slugifyCategoryName(category.name),
        icon: category.icon || "✦",
        image: category.image
      }));

    // Hampers is not an admin-managed product category: it always closes the grid and links to /hampers.
    return [
      ...(nextCategories?.length ? nextCategories : categories),
      { name: HAMPER_CATEGORY.name, slug: HAMPER_CATEGORY.slug, icon: HAMPER_CATEGORY.icon, href: HAMPER_CATEGORY.href }
    ];
  }, [settings]);

  return (
    <main className="overflow-hidden bg-amanat-cream text-stone-900">
      <HeroSlider slides={liveHeroSlides} />
      <AnnouncementTicker text={settings?.announcementText} />
      <CategoriesSection categories={liveCategories} />
      <FeaturedProducts />
      <EverydayStackSection />
      <TestimonialsSlider />
      <InstagramStrip instagramUrl={settings?.socialLinks?.instagram} />
      <WhyChooseUs />
      <Footer settings={settings} />
    </main>
  );
}

function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const [isMobileHero, setIsMobileHero] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    setActiveIndex(0);
  }, [slides]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobileHero(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const goToSlide = (index: number) => {
    setActiveIndex((index + slides.length) % slides.length);
  };

  const isPlaceholderHero = slides[activeIndex].image === "/logo.png";
  const heroImageFor = (slide: HeroSlide) => (isMobileHero && slide.mobileImage) || slide.image;
  const currentHeroSrc = optimizedMediaUrl(heroImageFor(slides[activeIndex]), isMobileHero ? 760 : 1500);
  const nextHeroSrc = optimizedMediaUrl(heroImageFor(slides[(activeIndex + 1) % slides.length]), isMobileHero ? 760 : 1500);

  useEffect(() => {
    const nextImage = new window.Image();
    nextImage.decoding = "async";
    nextImage.src = nextHeroSrc;
  }, [nextHeroSrc]);

  return (
    <motion.section
      className="relative min-h-[100svh] overflow-hidden bg-amanat-cream sm:bg-amanat-brown"
      onHoverStart={() => setIsHeroHovered(true)}
      onHoverEnd={() => setIsHeroHovered(false)}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={activeIndex}
          className="absolute inset-0"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.08}
          onDragEnd={(_, info) => {
            if (info.offset.x < -80) goToSlide(activeIndex + 1);
            if (info.offset.x > 80) goToSlide(activeIndex - 1);
          }}
          initial={{ opacity: 0, scale: 1.015 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1 }}
          transition={{ duration: 0.75, ease: "easeInOut" }}
        >
          <motion.div
            className="absolute inset-0 bg-ivory"
            initial={{ scale: 1 }}
            animate={{ scale: isMobileHero || isPlaceholderHero ? 1 : 1.08 }}
            transition={{ duration: 5.2, ease: "easeOut" }}
          >
            <Image
              src={currentHeroSrc}
              alt={isPlaceholderHero ? "Amanat House" : slides[activeIndex].headline}
              fill
              priority
              sizes="100vw"
              quality={90}
              className={isPlaceholderHero ? "object-contain p-16 sm:p-24" : "object-cover"}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <motion.div
        className="relative z-10 flex min-h-[100svh] items-end bg-transparent px-5 pb-28 pt-24 sm:px-8 sm:pb-28 md:px-12 lg:px-20"
        variants={sectionReveal}
        initial="hidden"
        animate="show"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={slides[activeIndex].headline}
            className="max-w-3xl"
            variants={sectionReveal}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -18, transition: { duration: 0.35 } }}
          >
            <motion.p
              variants={itemReveal}
              className="mb-3 max-w-[15ch] text-[13px] font-semibold uppercase leading-[1.4] tracking-eyebrow text-ink sm:mb-4 sm:max-w-3xl sm:text-sm"
            >
              <span style={frostedTextStyle}>Amanat House</span>
            </motion.p>
            <motion.h1
              variants={itemReveal}
              className="max-w-[15ch] font-heading text-[34px] font-semibold leading-[1.12] text-ink sm:max-w-3xl sm:text-[52px] sm:leading-[1.08] xl:text-[68px]"
            >
              <span style={frostedTextStyle}>{slides[activeIndex].headline}</span>
            </motion.h1>
            {slides[activeIndex].subtitle && (
              <motion.p
                variants={itemReveal}
                className="mt-4 max-w-[24rem] text-base font-normal leading-8 text-ink/85 sm:mt-5 sm:text-lg sm:leading-9"
              >
                <span style={subtitleFrostedTextStyle}>{slides[activeIndex].subtitle}</span>
              </motion.p>
            )}
            <motion.a
              variants={itemReveal}
              whileHover={{ y: -3, scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              href={slides[activeIndex].href}
              className="btn-primary mt-7 sm:mt-8"
            >
              {slides[activeIndex].cta}
            </motion.a>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <motion.button
        type="button"
        aria-label="Previous slide"
        onClick={() => goToSlide(activeIndex - 1)}
        className="absolute left-5 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/20 text-3xl leading-none text-white opacity-0 backdrop-blur-md md:flex"
        whileHover={{ scale: 1.08, backgroundColor: "rgba(0,0,0,0.42)" }}
        animate={{ opacity: isHeroHovered ? 1 : 0 }}
        transition={{ duration: 0.25 }}
      >
        ‹
      </motion.button>
      <motion.button
        type="button"
        aria-label="Next slide"
        onClick={() => goToSlide(activeIndex + 1)}
        className="absolute right-5 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/20 text-3xl leading-none text-white opacity-0 backdrop-blur-md md:flex"
        whileHover={{ scale: 1.08, backgroundColor: "rgba(0,0,0,0.42)" }}
        animate={{ opacity: isHeroHovered ? 1 : 0 }}
        transition={{ duration: 0.25 }}
      >
        ›
      </motion.button>

      <motion.div
        className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 sm:bottom-8 sm:gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        {slides.map((slide, index) => (
          <button
            type="button"
            key={slide.headline}
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => goToSlide(index)}
            className="relative h-2 w-8 overflow-hidden rounded-full bg-amanat-brown/12 sm:w-10 sm:bg-white/35"
          >
            <motion.span
              className="absolute inset-y-0 left-0 rounded-full bg-amanat-gold"
              initial={false}
              animate={{ width: index === activeIndex ? "100%" : "0%" }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            />
          </button>
        ))}
      </motion.div>

      <motion.div
        className="absolute bottom-7 right-5 z-20 font-heading text-lg text-amanat-brown sm:bottom-8 sm:right-6 sm:text-xl sm:text-white md:right-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.6 }}
      >
        {String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
      </motion.div>
    </motion.section>
  );
}

function AnnouncementTicker({ text }: { text?: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const tickerX = useMotionValue(0);
  const x = useTransform(tickerX, (value) => `${value}%`);
  const tickerText = text || MARQUEE_TICKER_TEXT;

  useAnimationFrame((_, delta) => {
    if (isHovered) return;

    const next = tickerX.get() - delta * 0.0018;
    tickerX.set(next <= -50 ? 0 : next);
  });

  return (
    <motion.section
      className="overflow-hidden bg-amanat-brown py-3 text-amanat-cream"
      variants={sectionReveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <motion.div
        className="flex w-max gap-10 whitespace-nowrap text-sm font-black uppercase tracking-[0.16em]"
        style={{ x }}
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <span key={index}>{tickerText}</span>
        ))}
      </motion.div>
    </motion.section>
  );
}

function CategoriesSection({ categories }: { categories: CategoryTile[] }) {
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;

    Promise.all(
      categories.filter((category) => !category.href).map(async ({ name }) => {
        const response = await fetch(`/api/products?category=${encodeURIComponent(name)}&limit=1&sort=newest`, {
          cache: "no-store"
        });
        const payload = (await response.json()) as { data?: { products?: Product[] } };
        return [name, payload.data?.products?.[0]?.images?.[0]?.url ?? ""] as const;
      })
    )
      .then(async (categoryEntries) => {
        const nextImages: Record<string, string> = Object.fromEntries(
          categoryEntries.filter(([, imageUrl]) => Boolean(imageUrl))
        );

        // The Hampers tile shows the first live hamper's showcase photo when there is one.
        if (categories.some((category) => category.href)) {
          try {
            const hamperResponse = await fetch("/api/hampers", { cache: "no-store" });
            const hamperPayload = (await hamperResponse.json()) as { data?: { hampers?: Array<{ heroImageUrl?: string }> } };
            const heroUrl = hamperPayload.data?.hampers?.find((hamper) => hamper.heroImageUrl)?.heroImageUrl;
            if (heroUrl) nextImages[HAMPER_CATEGORY.name] = heroUrl;
          } catch {
            // Falls back to the static Hampers tile image.
          }
        }

        if (isMounted) setCategoryImages(nextImages);
      })
      .catch(() => {
        if (isMounted) setCategoryImages({});
      });

    return () => {
      isMounted = false;
    };
  }, [categories]);

  return (
    <motion.section
      className="px-4 py-14 sm:px-6 sm:py-[4.5rem] md:px-10 md:py-20"
      variants={sectionReveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      <motion.div variants={itemReveal} className="mx-auto max-w-7xl text-center">
        <h2 className="font-heading text-[clamp(2rem,10vw,3rem)] font-bold leading-tight text-amanat-brown md:text-5xl">Shop by Category</h2>
        <motion.svg
          width="260"
          height="24"
          viewBox="0 0 260 24"
          fill="none"
          className="mx-auto mt-3 w-48 sm:w-[260px]"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <motion.path
            d="M4 15C45 4 82 22 126 12C168 3 203 18 256 8"
            stroke="#A23E2C"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </motion.svg>
      </motion.div>

      <motion.div
        className="category-grid mx-auto mt-10 w-full max-w-[96rem] gap-y-8 sm:mt-12 sm:gap-y-10"
        style={{ "--category-columns": Math.min(Math.max(categories.length, 1), 6) } as CSSProperties}
        variants={sectionReveal}
      >
        {categories.map((category, index) => (
          <CategoryCircle
            key={category.name}
            name={category.name}
            slug={category.slug}
            href={category.href}
            icon={category.icon}
            imageUrl={category.image || categoryImages[category.name]}
            index={index}
          />
        ))}
      </motion.div>
    </motion.section>
  );
}

function CategoryCircle({
  name,
  slug,
  href,
  icon,
  imageUrl,
  index
}: {
  name: string;
  slug: string;
  href?: string;
  icon: string;
  imageUrl?: string;
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const categoryPlaceholder = `/categories/${slug}.jpg`;
  const displayImageUrl = imageUrl ? getDisplayMediaUrl(imageUrl) : categoryPlaceholder;

  return (
    <motion.a
      href={href ?? `/shop?category=${slug}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.06, 0.42), duration: 0.45, ease: "easeOut" }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{
        scale: 1.06
      }}
      whileTap={{ scale: 0.97 }}
      className="group flex w-full min-w-0 flex-col items-center gap-3 text-center"
    >
      <span className="relative flex h-[clamp(120px,36vw,150px)] w-[clamp(120px,36vw,150px)] items-center justify-center rounded-full bg-white shadow-soft transition-shadow duration-200 group-hover:shadow-[0_18px_45px_rgba(162,62,44,0.34)] sm:h-[120px] sm:w-[120px] lg:h-[150px] lg:w-[150px] xl:h-[180px] xl:w-[180px] 2xl:h-[200px] 2xl:w-[200px]">
        <motion.span
          className="absolute inset-[-3px] rounded-full border-2 border-dashed border-amanat-terracotta sm:inset-[-6px]"
          animate={{ rotate: isHovered ? 360 : 0 }}
          transition={{
            duration: 1.2,
            repeat: isHovered ? Infinity : 0,
            ease: "linear"
          }}
        />
        <span className="absolute inset-0 overflow-hidden rounded-full bg-amanat-sand">
          <motion.img
            src={displayImageUrl}
            alt={`${name} category`}
            loading="lazy"
            animate={{ scale: isHovered ? 1.09 : 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-amanat-brown/12 via-transparent to-white/8" />
        </span>
      </span>
      <span className="min-h-[2.4rem] max-w-full text-xs font-black uppercase leading-[1.12] tracking-[0.04em] text-amanat-brown">
        {name}
      </span>
    </motion.a>
  );
}

function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem, items } = useCart();

  useEffect(() => {
    let isMounted = true;

    async function loadBestsellers() {
      setIsLoading(true);
      const productsResponse = await fetch("/api/products?limit=50&sort=newest", { cache: "no-store" });
      const productsData = (await productsResponse.json()) as { data?: { products: Product[] }; products?: Product[] };
      let nextProducts = prioritizeDisplayProducts(productsData.data?.products ?? productsData.products ?? []);

      if (!nextProducts.length) {
        const fallbackResponse = await fetch("/api/products?featured=true", { cache: "no-store" });
        const fallbackData = (await fallbackResponse.json()) as { data?: { products: Product[] }; products?: Product[] };
        nextProducts = prioritizeDisplayProducts(fallbackData.data?.products ?? fallbackData.products ?? []);
      }

      if (isMounted) {
        setProducts(nextProducts);
        setIsLoading(false);
      }
    }

    loadBestsellers()
      .catch(() => {
        if (isMounted) {
          setProducts([]);
          setIsLoading(false);
        }
      })

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <motion.section
      className="bg-white px-4 py-16 md:px-10 md:py-20"
      variants={sectionReveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.16 }}
    >
      <motion.div variants={itemReveal} className="mx-auto max-w-7xl text-center">
        <LeafOrnament />
        <h2 className="mt-4 font-heading text-[clamp(2.2rem,12vw,3.2rem)] font-bold leading-none text-amanat-brown md:text-5xl">Our Bestsellers</h2>
      </motion.div>

      <motion.div
        className="mx-auto mt-10 grid max-w-7xl grid-cols-2 gap-3 sm:mt-12 sm:grid-cols-3 sm:gap-4 md:gap-6 xl:grid-cols-4"
        variants={sectionReveal}
      >
        {isLoading &&
          Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl bg-amanat-cream shadow-soft">
              <div className="aspect-[4/5] animate-pulse bg-amanat-sand" />
              <div className="space-y-3 p-4">
                <div className="h-5 w-3/4 animate-pulse rounded-full bg-amanat-sand" />
                <div className="h-7 w-1/2 animate-pulse rounded-full bg-amanat-sand" />
                <div className="h-10 animate-pulse rounded-full bg-amanat-sand" />
              </div>
            </div>
          ))}

        {!isLoading && products.slice(0, 8).map((product) => {
          const displayName = getProductDisplayName(product);
          const cartQuantity = items
            .filter((item) => item.product._id === product._id)
            .reduce((total, item) => total + item.quantity, 0);

          return (
            <motion.article
              key={product._id}
              variants={itemReveal}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.12 }}
              whileHover={{ y: -6 }}
              className="flex h-full flex-col overflow-hidden rounded-2xl bg-amanat-cream shadow-soft"
            >
            <div className="aspect-[4/5] overflow-hidden bg-amanat-sand">
              <motion.div className="relative h-full w-full" whileHover={{ scale: 1.07 }} transition={{ duration: 0.5, ease: "easeOut" }}>
                <Image
                  src={getDisplayMediaUrl(product.images?.[0]?.url)}
                  alt={looksLikeDatabaseId(product.images?.[0]?.alt) ? displayName : product.images?.[0]?.alt ?? displayName}
                  fill
                  sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 50vw"
                  loading="lazy"
                  className="object-cover"
                />
              </motion.div>
            </div>
            <div className="flex flex-1 flex-col space-y-2.5 p-3 sm:space-y-3 sm:p-4 md:p-5">
              <h3 className="min-h-[2.6rem] font-heading text-[1rem] font-bold leading-tight text-amanat-brown sm:text-lg md:text-xl">
                {displayName}
              </h3>
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <span className="inline-flex min-h-8 max-w-full items-center rounded-full bg-amanat-sand px-2.5 py-1 text-xs font-black uppercase leading-tight tracking-[0.08em] text-amanat-sage sm:min-h-0 sm:px-3 sm:tracking-[0.12em]">
                  {product.category}
                </span>
                <span className="font-price font-medium text-amanat-brown sm:text-base">{"\u20B9"}{product.price.toLocaleString("en-IN")}</span>
              </div>
              <div className="mt-auto flex items-center gap-2 pt-1">
                <motion.button
                  type="button"
                  disabled={!product.inStock || cartQuantity >= product.stockCount}
                  onClick={() =>
                    addItem({
                      _id: product._id,
                      name: displayName,
                      slug: product.slug,
                      category: product.category,
                      price: product.price,
                      images: product.images,
                      stockCount: product.stockCount
                    })
                  }
                  whileHover={product.inStock && cartQuantity < product.stockCount ? { scale: 1.02 } : undefined}
                  whileTap={product.inStock && cartQuantity < product.stockCount ? { scale: 0.97 } : undefined}
                  className="btn-primary flex-1 text-xs"
                >
                  <span className="sm:hidden">{!product.inStock ? "Sold Out" : "Add"}</span>
                  <span className="hidden sm:inline">{!product.inStock ? "Out of Stock" : "Add to Cart"}</span>
                </motion.button>
                <motion.button
                  type="button"
                  aria-label={`Add ${displayName} to wishlist`}
                  whileHover={{ scale: 1.12, color: "#A23E2C" }}
                  whileTap={{ scale: 0.9 }}
                  className="h-10 w-10 shrink-0 rounded-[2px] border border-ink/15 bg-white text-lg text-ink"
                >
                  ♥
                </motion.button>
              </div>
              {cartQuantity > 0 && (
                <p className="text-center text-xs font-black uppercase tracking-[0.12em] text-amanat-sage">
                  In cart: {cartQuantity}
                </p>
              )}
            </div>
          </motion.article>
          );
        })}
      </motion.div>

      {!isLoading && !products.length && (
        <div className="mx-auto mt-10 max-w-2xl rounded-2xl bg-amanat-cream p-8 text-center shadow-soft">
          <h3 className="font-heading text-2xl font-bold text-amanat-brown">Products are being prepared</h3>
          <p className="mt-2 text-sm font-bold text-stone-600">Please check the shop while bestsellers are selected.</p>
        </div>
      )}

      <motion.div variants={itemReveal} className="mt-12 text-center">
        <motion.a
          href="/shop"
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary"
        >
          View All Products
        </motion.a>
      </motion.div>
    </motion.section>
  );
}

function EverydayStackSection() {
  return (
    <motion.section
      className="relative overflow-hidden px-6 py-20 md:px-10"
      variants={sectionReveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.18 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(196,160,83,0.18),transparent_28%),linear-gradient(120deg,#FAF5EC,#EDE0D4)]" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(45deg,#2A211C_1px,transparent_1px),linear-gradient(-45deg,#A23E2C_1px,transparent_1px)] [background-size:26px_26px]" />

      <motion.div className="relative z-10 mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]" variants={sectionReveal}>
        <motion.div variants={itemReveal} className="relative aspect-square overflow-hidden rounded-2xl bg-amanat-sand shadow-soft lg:aspect-auto">
          <Image
            src={EVERYDAY_STACK_IMAGE}
            alt="Amanat House pieces styled together"
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-contain p-10"
          />
        </motion.div>

        <motion.div variants={sectionReveal} className="flex flex-col justify-center">
          <motion.p variants={itemReveal} className="text-sm font-black uppercase tracking-[0.2em] text-amanat-sage">
            Styling Guide
          </motion.p>
          <motion.h2 variants={itemReveal} className="mt-3 font-heading text-4xl font-bold text-amanat-brown md:text-5xl">
            How to Build Your Everyday Stack
          </motion.h2>
          <motion.div variants={sectionReveal} className="mt-8 grid gap-4">
            {EVERYDAY_STACK_TIPS.map((tip) => (
              <motion.div
                key={tip.title}
                variants={itemReveal}
                whileHover={{ x: 8, backgroundColor: "rgba(255,255,255,0.72)" }}
                className="rounded-2xl bg-white/46 p-4 shadow-sm backdrop-blur"
              >
                <p className="font-heading text-lg font-bold text-amanat-brown">{tip.title}</p>
                <p className="mt-1 text-sm leading-6 text-stone-600">{tip.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

function TestimonialsSlider() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (testimonials.length < 2) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % testimonials.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, []);

  const testimonial = testimonials[active];

  if (!testimonial) return null;

  return (
    <motion.section
      className="bg-amanat-brown px-6 py-20 text-amanat-cream md:px-10"
      variants={sectionReveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
    >
      <motion.div variants={sectionReveal} className="mx-auto max-w-4xl text-center">
        <motion.h2 variants={itemReveal} className="font-heading text-4xl font-bold text-white md:text-5xl">
          Worn Daily, Loved Daily
        </motion.h2>
        <div className="relative mt-10 min-h-[240px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -18, filter: "blur(8px)" }}
              transition={{ duration: 0.65, ease: "easeOut" }}
              className="rounded-2xl border border-white/12 bg-white/8 p-8 backdrop-blur"
            >
              <motion.div
                className="flex justify-center gap-1 text-amanat-gold"
                initial="hidden"
                animate="show"
                variants={sectionReveal}
              >
                {Array.from({ length: 5 }).map((_, index) => (
                  <motion.span key={index} variants={itemReveal}>
                    ★
                  </motion.span>
                ))}
              </motion.div>
              <p className="mt-5 font-heading text-2xl leading-9 text-white">“{testimonial.quote}”</p>
              <p className="mt-6 text-sm font-black uppercase tracking-[0.16em] text-amanat-sand">
                {testimonial.name}, {testimonial.city}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.section>
  );
}

function InstagramStrip({ instagramUrl }: { instagramUrl?: string }) {
  const [productImages, setProductImages] = useState<Array<{ url: string; alt: string }>>([]);
  const feedLink = instagramUrl || "#";

  useEffect(() => {
    let isMounted = true;

    fetch("/api/products?limit=6&sort=newest", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { data?: { products?: Product[] } }) => {
        const products = payload.data?.products ?? [];
        const nextImages = products
          .map((product) => ({
            url: product.images?.[0]?.url,
            alt: product.name
          }))
          .filter((image): image is { url: string; alt: string } => Boolean(image.url))
          .slice(0, 6);

        if (isMounted) setProductImages(nextImages);
      })
      .catch(() => {
        if (isMounted) setProductImages([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const feedImages = productImages.slice(0, 6);

  return (
    <motion.section
      className="bg-white py-16"
      variants={sectionReveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      <motion.div variants={itemReveal} className="mb-8 text-center">
        <h2 className="font-heading text-4xl font-bold text-amanat-brown">{getInstagramHandleLabel(instagramUrl)}</h2>
      </motion.div>
      <motion.div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6" variants={sectionReveal}>
        {(feedImages.length ? feedImages : Array.from({ length: 6 }, (_, index) => ({ url: "", alt: `Amanat House product ${index + 1}` }))).map((image, index) => (
          <motion.a
            key={`${image.url || "placeholder"}-${index}`}
            href={feedLink}
            onClick={(event) => {
              if (feedLink === "#") event.preventDefault();
            }}
            aria-label={instagramUrl ? "Open Amanat House Instagram" : "Instagram link coming soon"}
            variants={itemReveal}
            // Tiles remount when the product images arrive, after the parent's
            // reveal has already finished, so they must trigger their own reveal.
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            whileHover={{ scale: 0.97 }}
            className="group relative aspect-square overflow-hidden bg-amanat-sand"
          >
            {image.url ? (
              <motion.div className="relative h-full w-full" whileHover={{ scale: 1.08 }} transition={{ duration: 0.45 }}>
                <Image
                  src={optimizedMediaUrl(image.url, 720)}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
                  loading="lazy"
                  quality={78}
                  className="object-cover"
                />
              </motion.div>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-amanat-cream">
                <Image src="/logo-mark.png" alt={image.alt} width={96} height={96} className="object-contain opacity-70" />
              </div>
            )}
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-amanat-brown/70 text-center text-sm font-black uppercase tracking-[0.12em] text-white opacity-0"
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              <InstagramIcon className="h-10 w-10 text-white" />
            </motion.div>
          </motion.a>
        ))}
      </motion.div>
    </motion.section>
  );
}

const WHY_CHOOSE_ITEMS = [
  {
    title: "Everyday Proof",
    text: "Designed to keep up, through it all",
    icon: <path d="M12 3C9 7.5 6.5 10.5 6.5 14a5.5 5.5 0 0 0 11 0C17.5 10.5 15 7.5 12 3Z" />
  },
  {
    title: "Premium Quality",
    text: "18K Gold PVD Coating",
    icon: <path d="M6 4h12l3 5-9 11L3 9l3-5Zm-3 5h18M9 4l-2 5 5 11 5-11-2-5" />
  },
  {
    title: "Hypoallergenic",
    text: "Skin Friendly & Safe",
    icon: <path d="M12 20S3.5 14.5 3.5 8.8A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.5 2.2C20.5 14.5 12 20 12 20Z" />
  },
  {
    title: "Made to Stay",
    text: "Waterproof & tarnish-free",
    icon: <path d="M3 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
  },
  {
    title: "Perfect for Gifting",
    text: "Comes in a luxe pouch & box",
    icon: <path d="M4 10h16v10H4V10Zm-1-4h18v4H3V6Zm9 0v14M12 6C9 6 7 4.5 8 3s4 1 4 3Zm0 0c3 0 5-1.5 4-3s-4 1-4 3Z" />
  }
];

function WhyChooseUs() {
  return (
    <motion.section
      className="bg-ivory px-6 py-16 md:px-10 md:py-20"
      variants={sectionReveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
    >
      <motion.div variants={itemReveal} className="text-center">
        <h2 className="font-heading text-3xl font-semibold uppercase tracking-[0.12em] text-ink sm:text-4xl">Why choose Amanat House?</h2>
        <div className="mx-auto mt-5 h-px w-20 bg-gold" />
      </motion.div>
      <motion.ul variants={sectionReveal} className="mx-auto mt-12 grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-5">
        {WHY_CHOOSE_ITEMS.map((item) => (
          <motion.li key={item.title} variants={itemReveal} className="flex flex-col items-center text-center">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-ink">
              {item.icon}
            </svg>
            <h3 className="mt-5 font-heading text-2xl font-medium text-ink">{item.title}</h3>
            <p className="mt-2 max-w-[16rem] text-sm leading-6 text-stone-600">{item.text}</p>
          </motion.li>
        ))}
      </motion.ul>
    </motion.section>
  );
}

function Footer({ settings }: { settings: PublicSettings | null }) {
  const contact = useSiteContact();
  const whatsappNumber = contact.whatsappNumber;
  const instagramUrl = contact.instagramUrl;
  const address = contact.address;
  const email = contact.email;
  const phone = `+${whatsappNumber.replace(/\D/g, "")}`;
  const footerWhatsAppLink = whatsappLink("Hi Amanat House! I have a question about your jewellery.", whatsappNumber);
  const socials = [
    { label: "Instagram", href: instagramUrl, icon: <InstagramIcon className="h-5 w-5" /> },
    ...(settings?.socialLinks?.facebook ? [{ label: "Facebook", href: settings.socialLinks.facebook, icon: <span className="text-lg font-bold">f</span> }] : []),
    { label: "WhatsApp", href: footerWhatsAppLink, icon: <span className="text-lg">☎</span> }
  ];

  return (
    <motion.footer
      className="bg-ink px-6 py-14 text-ivory md:px-10"
      variants={sectionReveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
    >
      <motion.div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr] md:gap-12" variants={sectionReveal}>
        <motion.div variants={itemReveal}>
          <a href="/" aria-label="Amanat House home" className="inline-block bg-ivory px-6 py-3">
            <Image src="/logo.png" alt="Amanat House" width={1783} height={733} quality={95} className="h-20 w-auto" />
          </a>
          <p className="mt-5 max-w-xs text-sm leading-7 text-ivory/70">
            Minimal everyday jewellery in 316L steel and 18K PVD gold — waterproof, anti-tarnish, made in India.
          </p>
        </motion.div>

        <motion.div variants={itemReveal}>
          <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Contact</h3>
          <div className="mt-4 grid gap-2 text-sm leading-7">
            {address && address !== STORE_ADDRESS_TODO && <p className="text-ivory/80">{address}</p>}
            <a href={`mailto:${email}`} className="hover:text-gold">
              {email}
            </a>
            <a href={`tel:${phone}`} className="hover:text-gold">
              {phone}
            </a>
          </div>
        </motion.div>

        <motion.div variants={itemReveal}>
          <FooterAccordion title="Support">
            <a href="/shop" className="hover:text-gold">Shop</a>
            <a href="/hampers" className="hover:text-gold">Gift hampers</a>
            <a href="/about" className="hover:text-gold">About us</a>
            <a href="/contact" className="hover:text-gold">Contact &amp; FAQs</a>
            <a href={footerWhatsAppLink} className="hover:text-gold">Chat on WhatsApp</a>
            <a href={contact.whatsappGroupUrl} target="_blank" rel="noreferrer" className="hover:text-gold">Join our WhatsApp community</a>
          </FooterAccordion>
        </motion.div>

        <motion.div variants={itemReveal}>
          <FooterAccordion title="Policies">
            <a href="/contact#returns" className="hover:text-gold">Returns &amp; Exchange</a>
            <a href="/shipping" className="hover:text-gold">Shipping Policy</a>
          </FooterAccordion>
        </motion.div>
      </motion.div>

      <motion.div variants={itemReveal} className="mx-auto mt-12 max-w-7xl border-t border-ivory/20 pt-8 text-center">
        <p className="text-sm text-ivory/60">{settings?.footerCopyright || "\u00A9 2026 Amanat House"}</p>
        <div className="mt-5 flex justify-center gap-4">
          {socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              aria-label={social.label}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-ivory/30 text-ivory transition hover:border-gold hover:text-gold"
            >
              {social.icon}
            </a>
          ))}
        </div>
      </motion.div>
    </motion.footer>
  );
}

function FooterAccordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  // Collapsible on phones; always expanded from md up.
  return (
    <div className="border-b border-ivory/20 pb-3 md:border-0 md:pb-0">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-[0.24em] text-gold md:cursor-default"
      >
        {title}
        <span aria-hidden="true" className="text-lg leading-none text-ivory md:hidden">
          {isOpen ? "−" : "+"}
        </span>
      </button>
      <div className={`mt-4 gap-3 text-sm leading-7 md:grid ${isOpen ? "grid" : "hidden"}`}>{children}</div>
    </div>
  );
}

function InstagramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function LeafOrnament() {
  return (
    <motion.svg
      width="86"
      height="32"
      viewBox="0 0 86 32"
      fill="none"
      className="mx-auto"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={sectionReveal}
    >
      <motion.path variants={itemReveal} d="M8 22C25 8 53 8 78 22" stroke="#7A6E66" strokeWidth="3" strokeLinecap="round" />
      <motion.path variants={itemReveal} d="M28 15C25 7 17 6 13 12C18 18 25 18 28 15Z" fill="#7A6E66" />
      <motion.path variants={itemReveal} d="M45 12C43 4 35 3 31 9C35 16 43 16 45 12Z" fill="#A23E2C" />
      <motion.path variants={itemReveal} d="M61 15C64 7 72 6 76 12C71 18 64 18 61 15Z" fill="#C4A053" />
    </motion.svg>
  );
}

