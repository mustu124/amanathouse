import Link from "next/link";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-amanat-cream px-6 py-28 text-center">
      <section className="max-w-xl">
        <LoadingSpinner label="Page not found" />
        <p className="mt-8 text-sm font-black uppercase tracking-[0.2em] text-amanat-sage">404</p>
        <h1 className="mt-3 font-heading text-5xl font-bold text-amanat-brown">This page isn&apos;t in the collection</h1>
        <p className="mt-4 leading-7 text-stone-700">
          The page you&apos;re looking for doesn&apos;t exist. Head back to the shop and keep browsing everyday jewellery.
        </p>
        <Link href="/shop" className="mt-7 inline-flex rounded-full bg-amanat-terracotta px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-white">
          Browse Shop
        </Link>
      </section>
    </main>
  );
}
