"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";

const sectionReveal = { hidden: staggerContainer.hidden, show: staggerContainer.visible };
const itemReveal = { hidden: fadeInUp.hidden, show: fadeInUp.visible };

const MATERIAL_SPECS = [
  "316L Stainless Steel",
  "18K PVD Gold Plating",
  "Anti-Tarnish",
  "Waterproof",
  "Hypoallergenic",
  "Made for Daily Wear"
];

const VALUES = [
  {
    title: "Everyday-Ready",
    body: "Designed for daily wear, not saved for special occasions — on in the morning, still on at night."
  },
  {
    title: "Built to Last",
    body: "Anti-tarnish, waterproof finishes that hold up through showers, swimming, and everyday routines."
  },
  {
    title: "Yours to Style",
    body: "Mix, stack, and layer pieces to build a look that's entirely your own."
  }
];

export function AboutContent() {
  return (
    <main className="min-h-screen bg-amanat-cream pb-20 pt-24">
      {/* Hero band */}
      <motion.section
        variants={sectionReveal}
        initial="hidden"
        animate="show"
        className="mx-auto flex max-w-4xl flex-col items-center px-5 py-14 text-center sm:px-8 sm:py-20"
      >
        <motion.p variants={itemReveal} className="text-xs font-black uppercase tracking-eyebrow text-amanat-sage">
          About Amanat House
        </motion.p>
        {/* Visually the logo carries the page title; this h1 keeps the
            document structure valid for screen readers without changing
            the design. */}
        <h1 className="sr-only">About Amanat House</h1>
        <motion.div variants={itemReveal} className="relative mt-8 h-28 w-64 sm:h-36 sm:w-80">
          <Image src="/logo.png" alt="Amanat House" fill sizes="320px" priority className="object-contain" />
        </motion.div>
        <motion.p variants={itemReveal} className="mt-6 text-xs font-black uppercase tracking-[0.3em] text-amanat-terracotta">
          Estd 2019
        </motion.p>
      </motion.section>

      {/* Editorial copy block */}
      <motion.section
        variants={sectionReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto max-w-5xl px-5 sm:px-8"
      >
        <motion.p variants={itemReveal} className="font-heading text-2xl font-bold leading-snug text-amanat-brown sm:text-3xl">
          At Amanat House, we believe jewellery is more than an accessory—it&apos;s something you carry with you, a
          little piece of your story.
        </motion.p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
          <motion.div variants={itemReveal} className="grid gap-6">
            <p className="text-lg leading-8 text-stone-700">
              We create timeless, everyday pieces that are elegant, effortless, and made to last. Crafted with 316L
              stainless steel and finished with 18K PVD gold plating, our jewellery is anti-tarnish, waterproof, and
              designed for daily wear.
            </p>
            <p className="text-lg leading-8 text-stone-700">
              From dainty rings and bracelets to statement necklaces, every piece is thoughtfully curated to help you
              stack, style, and shine—without compromising on quality or affordability.
            </p>
          </motion.div>

          <motion.div variants={itemReveal} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-amanat-sand shadow-soft">
            <Image
              src="/brand/about.webp"
              alt="Amanat House Evil Charm Bloom Neck Chain worn layered"
              fill
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="object-contain"
            />
          </motion.div>
        </div>

        <motion.p
          variants={itemReveal}
          className="mt-14 text-center font-heading text-3xl font-bold text-amanat-brown sm:text-4xl"
        >
          Minimal. Modern. Made to be your Amanat.
        </motion.p>
      </motion.section>

      {/* What our pieces are made of */}
      <motion.section
        variants={sectionReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto mt-16 max-w-6xl px-5 sm:px-8"
      >
        <motion.h2 variants={itemReveal} className="text-center font-heading text-3xl font-bold text-amanat-brown sm:text-4xl">
          What Our Pieces Are Made Of
        </motion.h2>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {MATERIAL_SPECS.map((spec) => (
            <motion.div
              key={spec}
              variants={itemReveal}
              className="rounded-2xl border border-gold/30 bg-white px-3 py-5 text-center shadow-sm"
            >
              <p className="text-xs font-black uppercase leading-tight tracking-[0.08em] text-amanat-brown">{spec}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Made to be kept values */}
      <motion.section
        variants={sectionReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto mt-16 max-w-6xl px-5 sm:px-8"
      >
        <motion.h2 variants={itemReveal} className="text-center font-heading text-3xl font-bold text-amanat-brown sm:text-4xl">
          Made to Be Kept
        </motion.h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {VALUES.map((value) => (
            <motion.article key={value.title} variants={itemReveal} className="rounded-2xl border border-amanat-brown/10 bg-white p-6 shadow-sm">
              <span className="block h-10 w-10 rounded-full border-2 border-dashed border-amanat-terracotta" />
              <p className="mt-5 font-heading text-lg font-bold leading-tight text-amanat-brown">{value.title}</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">{value.body}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>

      {/* Closing CTA */}
      <motion.section
        variants={sectionReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="mx-auto mt-16 max-w-3xl px-5 text-center sm:px-8"
      >
        <motion.div variants={itemReveal}>
          <Link href="/shop" className="btn-primary">
            Shop the Collection
          </Link>
        </motion.div>
      </motion.section>
    </main>
  );
}
