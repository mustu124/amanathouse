"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { BUSINESS_HOURS_TEXT, CONTACT_FAQ, RETURNS_POLICY_TEXT, SHIPPING_POLICY_TEXT } from "@/lib/content/policies";
import { env } from "@/lib/env";
import { whatsappLink } from "@/lib/whatsapp";

export function ContactContent() {
  const whatsappNumber = env.whatsappNumber;
  const storeEmail = env.storeEmail;
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [openFaq, setOpenFaq] = useState(CONTACT_FAQ[0]?.question ?? "");

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  // No backend contact-form endpoint exists — this builds a pre-filled
  // WhatsApp message from whatever the visitor has typed so far, rather than
  // silently discarding it (the previous form had no onSubmit at all).
  const formWhatsAppLink = useMemo(() => {
    const lines = [
      "Hello Amanat House, I would like to enquire about your jewellery.",
      form.name ? `Name: ${form.name}` : "",
      form.phone ? `Phone: ${form.phone}` : "",
      form.message ? `Message: ${form.message}` : ""
    ].filter(Boolean);

    return whatsappLink(lines.join("\n"), whatsappNumber);
  }, [form, whatsappNumber]);

  return (
    <main className="min-h-screen bg-amanat-cream pb-20 pt-24">
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl px-5 py-12 sm:px-8"
      >
        <motion.p variants={fadeInUp} className="text-sm font-black uppercase tracking-[0.2em] text-amanat-sage">
          Contact
        </motion.p>
        <motion.h1 variants={fadeInUp} className="mt-4 max-w-3xl font-heading text-5xl font-bold leading-tight text-amanat-brown sm:text-6xl">
          Let us help you find the right piece.
        </motion.h1>
        <motion.p variants={fadeInUp} className="mt-5 max-w-2xl text-lg leading-8 text-stone-700">
          Ask about sizing, metal tones, bulk gifting, or styling ideas. {BUSINESS_HOURS_TEXT}
        </motion.p>
      </motion.section>

      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        className="mx-auto grid max-w-7xl gap-6 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]"
      >
        <motion.div variants={fadeInUp} className="rounded-2xl bg-amanat-brown p-6 text-white shadow-soft">
          <h2 className="font-heading text-3xl font-bold text-white">Reach Us</h2>
          <div className="mt-6 grid gap-4 text-sm font-bold">
            <a
              href={whatsappLink("Hello Amanat House, I would like to enquire about your jewellery.", whatsappNumber)}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-white/10 p-4"
            >
              WhatsApp: +{whatsappNumber}
            </a>
            <a href={`mailto:${storeEmail}`} className="rounded-xl bg-white/10 p-4">
              Email: {storeEmail}
            </a>
            {/* TODO-confirm: real city/address — see NEXT_PUBLIC_STORE_ADDRESS in docs/ENV_SETUP.md */}
            <p className="rounded-xl bg-white/10 p-4">Address: {env.storeAddress}</p>
            <p className="rounded-xl bg-white/10 p-4">Hours: {BUSINESS_HOURS_TEXT}</p>
          </div>
        </motion.div>

        <motion.form
          variants={fadeInUp}
          onSubmit={(event) => {
            event.preventDefault();
            window.open(formWhatsAppLink, "_blank", "noopener,noreferrer");
          }}
          className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-amanat-brown">
              Name
              <input
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                className="field-input"
                placeholder="Your name"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-amanat-brown">
              Phone
              <input
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                className="field-input"
                placeholder="Your phone number"
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-bold text-amanat-brown">
            Message
            <textarea
              value={form.message}
              onChange={(event) => update("message", event.target.value)}
              className="field-input min-h-36 resize-none"
              placeholder="Tell us what you are looking for"
            />
          </label>
          <button type="submit" className="btn-primary">
            Continue on WhatsApp
          </button>
        </motion.form>
      </motion.section>

      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        className="mx-auto mt-8 grid max-w-7xl gap-4 px-5 sm:px-8 md:grid-cols-2"
      >
        {/* TODO-confirm: exact returns/shipping terms with the client — see lib/content/policies.ts */}
        <motion.article variants={fadeInUp} className="rounded-2xl border border-amanat-brown/10 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amanat-sage">Returns</p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-amanat-brown">Refund &amp; cancellation policy</h2>
          <p className="mt-3 leading-7 text-stone-700">{RETURNS_POLICY_TEXT}</p>
        </motion.article>
        <motion.article variants={fadeInUp} className="rounded-2xl border border-amanat-brown/10 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amanat-sage">Shipping</p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-amanat-brown">Delivery availability</h2>
          <p className="mt-3 leading-7 text-stone-700">{SHIPPING_POLICY_TEXT}</p>
        </motion.article>
      </motion.section>

      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        className="mx-auto mt-8 max-w-4xl px-5 sm:px-8"
      >
        <motion.h2 variants={fadeInUp} className="font-heading text-3xl font-bold text-amanat-brown sm:text-4xl">
          Frequently Asked Questions
        </motion.h2>
        <div className="mt-6 divide-y divide-amanat-brown/10 rounded-2xl border border-amanat-brown/10 bg-white shadow-sm">
          {CONTACT_FAQ.map((faq) => (
            <motion.div key={faq.question} variants={fadeInUp}>
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === faq.question ? "" : faq.question)}
                aria-expanded={openFaq === faq.question}
                className="flex w-full items-center justify-between gap-4 p-5 text-left font-heading text-lg font-bold text-amanat-brown"
              >
                {faq.question}
                <span aria-hidden="true">{openFaq === faq.question ? "−" : "+"}</span>
              </button>
              {openFaq === faq.question && <p className="px-5 pb-5 leading-7 text-stone-700">{faq.answer}</p>}
            </motion.div>
          ))}
        </div>
      </motion.section>
    </main>
  );
}
