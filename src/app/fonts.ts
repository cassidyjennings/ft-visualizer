import { Inter, Spectral, Source_Sans_3 } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600"], // pick what you need
  style: ["normal", "italic"],
  variable: "--font-spectral",
  display: "swap",
});

export const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-source-sans",
  display: "swap",
});
