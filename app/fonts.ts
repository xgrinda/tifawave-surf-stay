import { Fraunces, Inter } from "next/font/google";

export const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500"],
  variable: "--font-display"
});

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans"
});
