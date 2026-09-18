"use client";

import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      window.location.href = callbackUrl;
      return;
    }

    setError("Invalid admin credentials.");
    setIsSubmitting(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-amanat-cream px-4 py-24">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-soft"
      >
        <p className="text-sm font-black uppercase tracking-[0.18em] text-amanat-sage">Amanat House</p>
        <h1 className="mt-3 font-heading text-4xl font-bold text-amanat-brown">Admin Login</h1>
        <div className="mt-8 grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-amanat-brown">
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="field-input" required />
          </label>
          <label className="grid gap-2 text-sm font-bold text-amanat-brown">
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="field-input" required />
          </label>
        </div>
        {error && <p className="mt-4 text-sm font-bold text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-full bg-amanat-brown px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-white disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </motion.form>
    </main>
  );
}
