import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: ["400", "500"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

import { SmoothScroll } from '@/components/providers/smooth-scroll';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: "P1NTO Coffee",
  description: "Digital Coffee Shop Platform",
  icons: {
    icon: "/Pintokupi.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${cormorantGaramond.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        <SmoothScroll>
          {children}
        </SmoothScroll>
        <Toaster />
      </body>
    </html>
  );
}
