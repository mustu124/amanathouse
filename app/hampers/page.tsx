import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { env } from "@/lib/env";
import { hamperOfferLabel } from "@/lib/hampers";
import { getDisplayMediaUrl } from "@/lib/media";
import { listHampers } from "@/lib/server-hampers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const title = "Gift Hampers";
const description =
  "Build your own Amanat House gift hamper — choose your favourite everyday jewellery pieces and save when you bundle them.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${env.siteUrl}/hampers` },
  openGraph: {
    type: "website",
    url: `${env.siteUrl}/hampers`,
    title,
    description,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Amanat House" }]
  },
  twitter: { card: "summary_large_image", title, description, images: ["/og-image.png"] }
};

export default async function HampersPage() {
  const hampers = await listHampers();

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:pt-14">
      <header className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amanat-terracotta">Made to be gifted</p>
        <h1 className="mt-3 font-heading text-4xl font-bold sm:text-6xl">Gift Hampers</h1>
        <div className="mx-auto my-6 h-px w-24 bg-gold" />
        <p className="mx-auto max-w-2xl text-lg text-amanat-sage">
          Pick the pieces, we do the rest. Build a hamper from your favourites and the offer applies automatically.
        </p>
      </header>

      {hampers.length === 0 ? (
        <div className="mx-auto mt-12 max-w-xl border border-amanat-brown/10 bg-white p-10 text-center">
          <p className="font-heading text-2xl font-bold">Hampers are on their way</p>
          <p className="mt-2 text-stone-600">We are putting the finishing touches on our gift hampers. Meanwhile, explore the collection.</p>
          <Link href="/shop" className="btn-primary mt-6">
            Shop jewellery
          </Link>
        </div>
      ) : (
        <ul className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {hampers.map((hamper) => (
            <li key={hamper._id}>
              <Link href={`/hampers/${hamper.slug}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden bg-blush">
                  {hamper.heroImageUrl && (
                    <Image
                      src={getDisplayMediaUrl(hamper.heroImageUrl)}
                      alt={hamper.name}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-amanat-terracotta">{hamperOfferLabel(hamper)}</p>
                <h2 className="mt-2 font-heading text-2xl font-bold">{hamper.name}</h2>
                {hamper.shortDescription && <p className="mt-2 text-stone-600">{hamper.shortDescription}</p>}
                <span className="mt-4 inline-block border-b border-ink pb-1 text-xs font-bold uppercase tracking-[0.18em]">Build yours</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
