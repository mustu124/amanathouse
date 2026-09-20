"use client";

import { motion } from "framer-motion";
import { useSiteContact } from "@/lib/use-site-contact";
import { whatsappLink } from "@/lib/whatsapp";

export function WhatsAppBubble() {
  const { whatsappNumber } = useSiteContact();

  return (
    <motion.a
      href={whatsappLink("Hi Amanat House! I have a question about your jewellery.", whatsappNumber)}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Amanat House on WhatsApp"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      whileHover={{ y: -3, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-4 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-2xl text-white shadow-[0_16px_38px_rgba(42,33,28,0.24)] focus:outline-none focus-visible:ring-2 focus-visible:ring-amanat-brown focus-visible:ring-offset-2 focus-visible:ring-offset-amanat-cream sm:bottom-5 sm:left-5"
    >
      <WhatsAppIcon />
    </motion.a>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.1.2-.3.2-.5.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.1-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.5-.3z" />
      <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .9.9-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
    </svg>
  );
}
