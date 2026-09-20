"use client";

import { AnimatePresence, motion } from "framer-motion";
import { HAMPER_CATEGORY } from "@/lib/hampers";
import { useCart } from "@/context/CartContext";
import { useDebounce } from "@/hooks/useDebounce";
import { slideInRight } from "@/lib/animations";
import { useSiteContact } from "@/lib/use-site-contact";
import { getDisplayMediaUrl } from "@/lib/media";
import { CATEGORY_DETAILS, slugifyCategoryName } from "@/lib/product-data";
import { whatsappLink } from "@/lib/whatsapp";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type SearchProduct = {
  _id: string;
  slug?: string;
  name: string;
  price: number;
  images?: Array<{
    url: string;
    alt?: string;
  }>;
};

const navLinks = ["Home", "Shop", "Categories", "Collections", "About", "Contact"];

type NavCategory = {
  name: string;
  slug?: string;
  icon?: string;
  href?: string;
  visible?: boolean;
};

const hamperNavItem: NavCategory = { name: HAMPER_CATEGORY.name, slug: HAMPER_CATEGORY.slug, icon: HAMPER_CATEGORY.icon, href: HAMPER_CATEGORY.href };

// Hampers is not a product category: it always trails the list and links to /hampers.
const fallbackCategories: NavCategory[] = [
  ...CATEGORY_DETAILS.map((category) => ({
    name: category.name,
    slug: category.slug,
    icon: category.icon
  })),
  hamperNavItem
];

const sidebarVariants = {
  closed: slideInRight.hidden,
  open: {
    ...slideInRight.visible,
    transition: { type: "spring", stiffness: 280, damping: 32, staggerChildren: 0.06, delayChildren: 0.12 }
  },
  exit: slideInRight.exit
};

const mobileItemVariants = {
  closed: { opacity: 0, x: 24 },
  open: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } }
};

export function Navbar() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const [categories, setCategories] = useState<NavCategory[]>(fallbackCategories);
  const { itemCount, openCart } = useCart();

  useEffect(() => {
    document.body.style.overflow = isMenuOpen || isSearchOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen, isSearchOpen]);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { data?: { settings?: { categories?: NavCategory[] } } }) => {
        const nextCategories = payload.data?.settings?.categories?.filter(
          (category) => category.name && category.visible !== false
        );
        if (isMounted && nextCategories?.length) setCategories([...nextCategories, hamperNavItem]);
      })
      .catch(() => {
        if (isMounted) setCategories(fallbackCategories);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <motion.header className="fixed inset-x-0 top-0 z-50 border-b border-gold/30 bg-ivory">
        <motion.nav
          aria-label="Primary navigation"
          className="mx-auto hidden h-[88px] max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-8 px-8 text-ink md:grid"
        >
          <motion.a href="/" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center">
            <Image
              src="/logo.png"
              alt="Amanat House"
              width={1783}
              height={733}
              quality={95}
              priority
              className="h-[68px] w-auto object-contain"
            />
          </motion.a>

          <div className="flex items-center justify-center gap-8">
            {navLinks.map((link) =>
              link === "Categories" ? (
                <div
                  key={link}
                  className="relative"
                  onMouseEnter={() => setIsMegaOpen(true)}
                  onMouseLeave={() => setIsMegaOpen(false)}
                >
                  <NavLink href="/shop#categories" label="Categories" />
                  <AnimatePresence>
                    {isMegaOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: 12 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: 12 }}
                        transition={{ duration: 0.28, ease: "easeOut" }}
                        className="absolute left-1/2 top-9 w-[min(680px,92vw)] -translate-x-1/2 overflow-hidden rounded-2xl border border-[#E0D0BE] bg-[#EDE0D4] text-[#2A211C] shadow-[0_24px_70px_rgba(42,33,28,0.16)]"
                      >
                        <motion.div
                          className="grid grid-cols-3 gap-3 p-5 lg:grid-cols-5"
                          initial="hidden"
                          animate="show"
                          variants={{
                            hidden: {},
                            show: { transition: { staggerChildren: 0.04 } }
                          }}
                        >
                          {categories.map((category) => (
                            <motion.a
                              key={category.name}
                              href={category.href ?? `/shop?category=${category.slug || slugifyCategoryName(category.name)}`}
                              variants={{
                                hidden: { opacity: 0, y: 10 },
                                show: { opacity: 1, y: 0 }
                              }}
                              whileHover={{ y: -3, backgroundColor: "rgba(232, 213, 188, 0.34)" }}
                              className="min-h-[118px] rounded-xl p-3 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-amanat-terracotta"
                            >
                              <span className="block text-xs font-black uppercase tracking-[0.16em] text-amanat-terracotta drop-shadow-[0_1px_0_rgba(255,248,240,0.85)]">
                                {category.icon || "✦"}
                              </span>
                              <span className="mt-2 block text-xs font-black leading-tight text-[#2A211C] drop-shadow-[0_1px_0_rgba(255,248,240,0.85)]">
                                {category.name}
                              </span>
                            </motion.a>
                          ))}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <NavLink
                  key={link}
                  href={link === "Home" ? "/" : `/${link.toLowerCase()}`}
                  label={link}
                />
              )
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <IconButton label="Open search" onClick={() => setIsSearchOpen(true)}>
              <SearchIcon />
            </IconButton>
            <CartButton itemCount={itemCount} onClick={openCart} />
          </div>
        </motion.nav>

        <motion.nav
          aria-label="Mobile navigation"
          className="grid h-[72px] grid-cols-3 items-center px-4 text-ink md:hidden"
        >
          <CartButton itemCount={itemCount} onClick={openCart} />
          <motion.a href="/" whileTap={{ scale: 0.96 }} className="justify-self-center">
            <Image
              src="/logo.png"
              alt="Amanat House"
              width={1783}
              height={733}
              quality={95}
              priority
              className="h-[46px] w-auto object-contain"
            />
          </motion.a>
          <motion.button
            type="button"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(true)}
            whileTap={{ scale: 0.94 }}
            className="relative h-11 w-11 justify-self-end rounded-full border border-current/20 focus:outline-none focus:ring-2 focus:ring-amanat-terracotta"
          >
            <HamburgerIcon isOpen={isMenuOpen} />
          </motion.button>
        </motion.nav>
      </motion.header>

      <MobileSidebar
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onSearch={() => {
          setIsMenuOpen(false);
          setIsSearchOpen(true);
        }}
        categories={categories}
      />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <motion.a
      href={href}
      whileHover="hover"
      className="group relative py-2 text-sm font-black uppercase tracking-[0.13em] focus:outline-none focus:ring-2 focus:ring-amanat-terracotta"
    >
      {label}
      <motion.span
        className="absolute bottom-0 left-0 h-px w-full origin-left bg-amanat-terracotta"
        initial={{ scaleX: 0 }}
        variants={{ hover: { scaleX: 1 } }}
        transition={{ duration: 0.24, ease: "easeOut" }}
      />
    </motion.a>
  );
}

function CartButton({ itemCount, onClick }: { itemCount: number; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={`Cart with ${itemCount} items`}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.94 }}
      className="relative flex h-11 w-11 items-center justify-center rounded-full border border-current/20 focus:outline-none focus:ring-2 focus:ring-amanat-terracotta"
    >
      <CartIcon />
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.span
            key={itemCount}
            initial={{ scale: 0, y: 6 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 6 }}
            className="absolute -right-1.5 -top-1.5 flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-amanat-terracotta px-1 text-xs font-black text-white"
          >
            {itemCount}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function IconButton({
  label,
  onClick,
  children
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.94 }}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-current/20 focus:outline-none focus:ring-2 focus:ring-amanat-terracotta"
    >
      {children}
    </motion.button>
  );
}

function MobileSidebar({
  isOpen,
  onClose,
  onSearch,
  categories
}: {
  isOpen: boolean;
  onClose: () => void;
  onSearch: () => void;
  categories: NavCategory[];
}) {
  const contact = useSiteContact();
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  useEscapeKey(isOpen, onClose);
  const trapRef = useFocusTrap(isOpen);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close navigation backdrop"
            className="fixed inset-0 z-[60] bg-black/38 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            ref={trapRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile menu"
            className="fixed right-0 top-0 z-[70] flex h-dvh w-[86vw] max-w-sm flex-col bg-amanat-cream p-5 text-amanat-brown shadow-[-24px_0_60px_rgba(0,0,0,0.18)] focus:outline-none md:hidden"
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <motion.button
              type="button"
              aria-label="Close navigation menu"
              onClick={onClose}
              variants={mobileItemVariants}
              whileTap={{ scale: 0.94 }}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-amanat-brown/15 focus:outline-none focus:ring-2 focus:ring-amanat-terracotta"
            >
              <CloseIcon />
            </motion.button>

            <motion.div
              variants={mobileItemVariants}
              className="h-16 w-40 overflow-hidden"
            >
              <Image src="/logo.png" alt="Amanat House" width={1783} height={733} quality={95} className="h-full w-full object-contain object-left" />
            </motion.div>

            <motion.nav className="mt-8 grid gap-1" variants={mobileItemVariants}>
              {navLinks.map((link) =>
                link === "Categories" ? (
                  <div key={link}>
                    <motion.button
                      type="button"
                      variants={mobileItemVariants}
                      onClick={() => setIsCategoriesOpen((value) => !value)}
                      aria-expanded={isCategoriesOpen}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left font-heading text-[1.55rem] font-bold leading-tight focus:outline-none focus:ring-2 focus:ring-amanat-terracotta"
                    >
                      Categories
                      <motion.span animate={{ rotate: isCategoriesOpen ? 180 : 0 }}>⌄</motion.span>
                    </motion.button>
                    <AnimatePresence>
                      {isCategoriesOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <motion.div
                            className="grid grid-cols-1 gap-2 px-3 py-3"
                            initial="hidden"
                            animate="show"
                            variants={{
                              hidden: {},
                              show: { transition: { staggerChildren: 0.04 } }
                            }}
                          >
                            {categories.map((category) => (
                              <motion.a
                                key={category.name}
                                href={category.href ?? `/shop?category=${category.slug || slugifyCategoryName(category.name)}`}
                                onClick={onClose}
                                variants={{
                                  hidden: { opacity: 0, x: 12 },
                                  show: { opacity: 1, x: 0 }
                                }}
                                className="rounded-xl bg-white/70 p-3 text-sm font-bold leading-tight focus:outline-none focus:ring-2 focus:ring-amanat-terracotta"
                              >
                                <span className="mr-2 text-xs uppercase tracking-[0.12em] text-amanat-terracotta">
                                  {category.icon || "✦"}
                                </span>
                                {category.name}
                              </motion.a>
                            ))}
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <motion.a
                    key={link}
                    href={link === "Home" ? "/" : `/${link.toLowerCase()}`}
                    onClick={onClose}
                    variants={mobileItemVariants}
                    whileHover={{ x: 8 }}
                    className="rounded-xl px-3 py-2.5 font-heading text-[1.55rem] font-bold leading-tight focus:outline-none focus:ring-2 focus:ring-amanat-terracotta"
                  >
                    {link}
                  </motion.a>
                )
              )}
              <motion.button
                type="button"
                onClick={onSearch}
                variants={mobileItemVariants}
                className="mt-2 rounded-xl bg-amanat-brown px-4 py-3 text-left text-xs font-black uppercase tracking-[0.14em] text-white focus:outline-none focus:ring-2 focus:ring-amanat-terracotta"
              >
                Search Products
              </motion.button>
            </motion.nav>

            <motion.div variants={mobileItemVariants} className="mt-auto flex items-center gap-3 pt-8">
              {[
                ["Instagram", contact.instagramUrl, "◎"],
                ["WhatsApp", whatsappLink("Hi Amanat House! I have a question about your jewellery.", contact.whatsappNumber), "☎"]
              ].map(([label, href, icon]) => (
                <motion.a
                  key={label}
                  href={href}
                  aria-label={label}
                  whileHover={{ y: -3, backgroundColor: "#A23E2C", color: "#ffffff" }}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white font-black shadow-sm focus:outline-none focus:ring-2 focus:ring-amanat-terracotta"
                >
                  {label === "Instagram" ? <InstagramIcon /> : icon}
                </motion.a>
              ))}
            </motion.div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function SearchOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const timeoutId = window.setTimeout(() => inputRef.current?.focus(), 120);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || debouncedQuery.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    fetch(`/api/products/search?q=${encodeURIComponent(debouncedQuery.trim())}`, {
      signal: controller.signal
    })
      .then((response) => response.json())
      .then((data: { data?: { products: SearchProduct[] }; products?: SearchProduct[] }) =>
        setResults(data.data?.products ?? data.products ?? [])
      )
      .catch((error: Error) => {
        if (error.name !== "AbortError") setResults([]);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [debouncedQuery, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setIsLoading(false);
    }
  }, [isOpen]);

  const trapRef = useFocusTrap(isOpen);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={trapRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Search products"
          className="fixed inset-0 z-[90] overflow-y-auto bg-amanat-cream/88 px-6 py-24 text-amanat-brown backdrop-blur-xl focus:outline-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            aria-label="Close search"
            onClick={onClose}
            whileHover={{ rotate: 4, scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            className="fixed right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-soft focus:outline-none focus:ring-2 focus:ring-amanat-terracotta"
          >
            <CloseIcon />
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.42, ease: "easeOut" }}
            className="mx-auto max-w-4xl"
          >
            <label htmlFor="site-search" className="block text-center font-heading text-4xl font-bold md:text-6xl">
              Search Amanat House
            </label>
            <div className="mt-8 rounded-full bg-white p-2 shadow-soft">
              <input
                id="site-search"
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search rings, necklaces, studs..."
                className="h-16 w-full rounded-full bg-transparent px-6 text-lg font-bold outline-none placeholder:text-amanat-brown/42 focus:ring-2 focus:ring-amanat-terracotta"
              />
            </div>

            <motion.div
              className="mt-10 grid gap-4 sm:grid-cols-2"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.06 } }
              }}
            >
              {isLoading && (
                <motion.p
                  variants={mobileItemVariants}
                  className="col-span-full text-center text-sm font-black uppercase tracking-[0.16em] text-amanat-sage"
                >
                  Searching...
                </motion.p>
              )}
              {!isLoading &&
                results.map((product) => (
                  <motion.a
                    key={product._id}
                    href={`/shop/${product.slug ?? product._id}`}
                    variants={mobileItemVariants}
                    whileHover={{ y: -4 }}
                    className="grid grid-cols-[96px_1fr] gap-4 rounded-2xl bg-white p-3 shadow-soft focus:outline-none focus:ring-2 focus:ring-amanat-terracotta"
                  >
                    <Image
                      src={getDisplayMediaUrl(product.images?.[0]?.url)}
                      alt={product.images?.[0]?.alt ?? product.name}
                      width={96}
                      height={96}
                      className="h-24 w-24 rounded-xl object-cover"
                    />
                    <span className="flex flex-col justify-center">
                      <span className="font-heading text-xl font-bold">{product.name}</span>
                      <span className="mt-2 font-price font-medium text-amanat-terracotta">
                        ₹{product.price.toLocaleString("en-IN")}
                      </span>
                    </span>
                  </motion.a>
                ))}
              {!isLoading && debouncedQuery.trim().length >= 2 && results.length === 0 && (
                <motion.p variants={mobileItemVariants} className="col-span-full text-center font-bold text-amanat-sage">
                  No products found.
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <span className="absolute left-1/2 top-1/2 block h-5 w-6 -translate-x-1/2 -translate-y-1/2">
      <motion.span
        className="absolute left-0 top-1 block h-0.5 w-6 rounded-full bg-current"
        animate={{ rotate: isOpen ? 45 : 0, y: isOpen ? 7 : 0 }}
      />
      <motion.span
        className="absolute left-0 top-1/2 block h-0.5 w-6 rounded-full bg-current"
        animate={{ opacity: isOpen ? 0 : 1 }}
      />
      <motion.span
        className="absolute bottom-1 left-0 block h-0.5 w-6 rounded-full bg-current"
        animate={{ rotate: isOpen ? -45 : 0, y: isOpen ? -7 : 0 }}
      />
    </span>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M10.8 18.1a7.3 7.3 0 1 0 0-14.6 7.3 7.3 0 0 0 0 14.6Z" stroke="currentColor" strokeWidth="2" />
      <path d="m16.2 16.2 4.3 4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M7 8h13l-1.4 7.4a2 2 0 0 1-2 1.6H9.1a2 2 0 0 1-2-1.7L6 4H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 21h.01M17 21h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
