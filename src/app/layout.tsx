import type { Metadata } from "next";
import { Unbounded, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import {PrivateSessionProvider} from "@/components/private/PrivateSessionProvider";
import {PageMotion} from "@/components/layout/PageMotion";
import { LanguageProvider } from "@/i18n";
import {siteConfig} from "@/config/site";
import { ViewTransitions } from "next-view-transitions";

const unbounded = Unbounded({ 
  subsets: ["cyrillic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-display"
});

const ibmPlexMono = IBM_Plex_Mono({ 
  subsets: ["cyrillic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  metadataBase: siteConfig.url ? new URL(siteConfig.url) : undefined,
  title: "RICHRUSSIANCOMMUNITY — RRC",
  description: "Digital fashion house. Architectural silhouettes. Premium materials.",
  keywords: ["RRC", "RICHRUSSIANCOMMUNITY", "fashion", "streetwear", "premium", "digital fashion house"],
  authors: [{ name: "RICHRUSSIANCOMMUNITY" }],
  openGraph: {
    title: "RICHRUSSIANCOMMUNITY — RRC",
    description: "Digital fashion house. Architectural silhouettes. Premium materials.",
    type: "website",
    locale: "ru_RU",
    alternateLocale: ["en_US"],
    images: siteConfig.url ? [{url: "/images/home/hero.webp", alt: "RICHRUSSIANCOMMUNITY"}] : [],
    siteName: "RICHRUSSIANCOMMUNITY",
  },
};

export const viewport = {
  themeColor: "#080809",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ViewTransitions>
      <html lang="ru">
        <body className={`${unbounded.variable} ${ibmPlexMono.variable} antialiased`}>
          <LanguageProvider><PrivateSessionProvider><PageMotion/>{children}</PrivateSessionProvider></LanguageProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}
