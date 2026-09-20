"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const links = [
  ["Dashboard", "/admin"],
  ["Products", "/admin/products"],
  ["Hampers", "/admin/hampers"],
  ["Orders", "/admin/orders"],
  ["Gallery", "/admin/gallery"],
  ["Homepage Settings", "/admin/homepage"],
  ["Categories", "/admin/categories"],
  ["Site Settings", "/admin/settings"]
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const sidebar = <Sidebar pathname={pathname} onNavigate={() => setIsOpen(false)} />;

  return (
    <div className="min-h-screen bg-amanat-cream text-amanat-brown">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-4 z-[70] rounded-full bg-amanat-brown px-4 py-2 text-sm font-black text-white shadow-soft lg:hidden"
      >
        Menu
      </button>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-60 border-r border-amanat-brown/10 bg-white lg:block">
        {sidebar}
      </aside>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close admin menu"
              className="fixed inset-0 z-[80] bg-black/45 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-[90] w-72 bg-white lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <main className="min-h-screen px-4 pb-12 pt-20 lg:ml-60 lg:px-8 lg:pt-8">{children}</main>
    </div>
  );
}

function Sidebar({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <div className="flex h-full flex-col p-5">
      <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3">
        <Image src="/logo.png" alt="Amanat House" width={1783} height={733} quality={95} className="h-14 w-auto object-contain" />
      </Link>
      <nav className="mt-8 grid gap-2">
        {links.map(([label, href]) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`rounded-xl px-4 py-3 text-sm font-black transition ${
                active ? "bg-amanat-terracotta text-white" : "text-amanat-brown hover:bg-amanat-cream"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={logout}
        className="mt-auto rounded-xl border border-amanat-brown/15 px-4 py-3 text-left text-sm font-black text-amanat-brown hover:border-amanat-terracotta"
      >
        Logout
      </button>
    </div>
  );
}
