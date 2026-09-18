"use client";

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-amanat-brown/10 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-amanat-sage">{label}</p>
      <p className="mt-3 font-heading text-4xl font-bold text-amanat-brown">{value}</p>
      {hint && <p className="mt-2 text-sm text-stone-500">{hint}</p>}
    </div>
  );
}

export function AdminSection({
  title,
  description,
  action,
  children
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-amanat-brown/10 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="font-heading text-2xl font-bold text-amanat-brown">{title}</h2>
          {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ConfirmButton({
  children,
  message,
  onConfirm,
  className
}: {
  children: React.ReactNode;
  message: string;
  onConfirm: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (window.confirm(message)) onConfirm();
      }}
      className={className}
    >
      {children}
    </button>
  );
}
