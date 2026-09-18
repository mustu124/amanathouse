"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { usePathname } from "next/navigation";
import { WhatsAppBubble } from "@/components/WhatsAppBubble";

export function PageChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return <div id="main-content">{children}</div>;
  }

  return (
    <>
      <div id="main-content" tabIndex={-1}>{children}</div>
      <ScrollToTopButton />
      <WhatsAppBubble />
    </>
  );
}

function ScrollToTopButton() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [320, 420], [0, 1]);
  const scale = useTransform(scrollY, [320, 420], [0.9, 1]);

  return (
    <motion.button
      type="button"
      aria-label="Scroll to top"
      style={{ opacity, scale }}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.94 }}
      className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-amanat-terracotta text-lg font-black text-white shadow-[0_16px_38px_rgba(42,33,28,0.24)] focus:outline-none focus-visible:ring-2 focus-visible:ring-amanat-brown focus-visible:ring-offset-2 focus-visible:ring-offset-amanat-cream sm:bottom-5 sm:right-5 sm:h-12 sm:w-12 sm:text-xl"
    >
      ^
    </motion.button>
  );
}
