import { HamperForm } from "@/components/admin/HamperForm";

export default function NewHamperPage() {
  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-amanat-sage">Catalog</p>
        <h1 className="font-heading text-4xl font-bold text-amanat-brown">Add New Hamper</h1>
      </div>
      <HamperForm />
    </div>
  );
}
