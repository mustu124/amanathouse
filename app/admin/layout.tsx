import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Amanat House Admin",
    template: "%s | Amanat House Admin"
  },
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
