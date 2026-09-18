import { Cormorant_Garamond, Jost } from "next/font/google";

export const displaySerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"]
});

export const bodySans = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"]
});
