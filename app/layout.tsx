import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";

import { LocaleProvider } from "@/components/providers/locale-provider";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

import "./globals.css";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "MyPixel Studio",
  description:
    "Convert images into editable pixel art and perler-ready patterns with a modern browser editor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable}`}>
        <LocaleProvider>
          <div className="min-h-screen bg-ink-950 text-mist-50">
            <SiteHeader />
            <main>{children}</main>
            <SiteFooter />
          </div>
        </LocaleProvider>
      </body>
    </html>
  );
}
