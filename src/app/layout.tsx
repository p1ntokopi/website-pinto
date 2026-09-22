import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: "swap",
});

import { Toaster } from '@/components/ui/toaster';
import { getSiteUrl, SITE_CONFIG, PRODUCTION_SITE_URL } from '@/config/site';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Pinto Kupi — Roastery & Kafe di Bogor",
    template: "%s | Pinto Kupi",
  },
  description: SITE_CONFIG.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: SITE_CONFIG.locale,
    url: PRODUCTION_SITE_URL,
    siteName: SITE_CONFIG.name,
    title: "Pinto Kupi — Roastery & Kafe di Bogor",
    description: SITE_CONFIG.description,
    images: [
      {
        url: "/Pintokupi.webp",
        width: 800,
        height: 800,
        alt: "Pinto Kupi Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Pinto Kupi — Roastery & Kafe di Bogor",
    description: SITE_CONFIG.description,
    images: ["/Pintokupi.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/Pintokupi.webp", type: "image/webp" }],
    apple: "/Pintokupi.webp",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CafeOrCoffeeShop",
  "name": "Pinto Kupi",
  "image": `${PRODUCTION_SITE_URL}/Pintokupi.webp`,
  "url": PRODUCTION_SITE_URL,
  "description": SITE_CONFIG.description,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": SITE_CONFIG.address.street,
    "addressLocality": SITE_CONFIG.address.city,
    "addressRegion": SITE_CONFIG.address.province,
    "postalCode": SITE_CONFIG.address.postalCode,
    "addressCountry": SITE_CONFIG.address.country,
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -6.484493,
    "longitude": 106.753144,
  },
  "hasMap": SITE_CONFIG.mapsUrl,
  "openingHours": "Mo-Su 13:00-24:00",
  "servesCuisine": "Coffee",
  "priceRange": "$$",
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
