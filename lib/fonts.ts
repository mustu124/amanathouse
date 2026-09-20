import { Cormorant_Garamond, Jost, Source_Serif_4 } from "next/font/google";

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

// Prices: a text serif with lining figures and a proper rupee sign
// (Cormorant's numerals are old-style and it has no INR glyph).
export const priceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-price",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"]
});
