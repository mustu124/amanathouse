"use client";

import { motion } from "framer-motion";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-amanat-cream px-6 py-28 text-center">
      <section className="max-w-xl">
        <motion.div
          aria-hidden="true"
          animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.04, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-soft"
        >
          <span className="h-12 w-12 rounded-full border-4 border-dashed border-amanat-terracotta" />
        </motion.div>
        <p className="mt-8 text-sm font-black uppercase tracking-[0.2em] text-amanat-sage">Something went wrong</p>
        <h1 className="mt-3 font-heading text-5xl font-bold text-amanat-brown">That didn&apos;t go as planned</h1>
        <p className="mt-4 leading-7 text-stone-700">
          The page hit an unexpected snag. Try again and the site will reload this view.
        </p>
        <button onClick={reset} className="mt-7 rounded-full bg-amanat-terracotta px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-white">
          Try Again
        </button>
      </section>
    </main>
  );
}
