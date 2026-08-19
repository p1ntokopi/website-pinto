import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: "swap",
});

import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: {
    default: "Pinto Coffee — Roastery & Kafe di Bogor",
    template: "%s | Pinto Coffee",
  },
  description:
    "Pinto Coffee — roastery dan kafe di Bogor. Biji kopi Nusantara pilihan, disangrai in-house dalam batch kecil, dan disajikan segar untuk setiap momen.",
  icons: {
    icon: "/Pintokupi.webp",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakarta.variable} ${cormorantGaramond.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
