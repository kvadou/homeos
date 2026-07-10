import "@/env";
import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Instrument_Serif, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { CapacitorProvider } from "@/components/capacitor-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeScript } from "@/components/theme-script";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#3C5268",
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "HomeOS — AI Home Management for Homeowners & Property Managers",
  description:
    "Scan any appliance, instantly access manuals, track warranties, and get AI-powered maintenance reminders. Free for 1 home. Start managing your home smarter today.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HomeOS",
  },
  openGraph: {
    title: "HomeOS — Know Every Item in Your Home",
    description:
      "AI-powered home management. Scan appliances, access manuals instantly, track warranties, and get proactive maintenance reminders. Free for your first home.",
    url: "https://homebase-ai-omega.vercel.app",
    siteName: "HomeOS",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "HomeOS — AI Home Management",
    description:
      "Scan any appliance, instantly access manuals, track warranties, and get AI maintenance reminders. Free for 1 home.",
    images: ["/og-image.png"],
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
  alternates: {
    canonical: "https://homebase-ai-omega.vercel.app",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider dynamic>
      <html lang="en" suppressHydrationWarning>
        <head>
          <ThemeScript />
        </head>
        <body
          className={`${geist.variable} ${instrumentSerif.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} font-sans antialiased`}
        >
          <ThemeProvider>
            <CapacitorProvider>
              <Toaster>{children}</Toaster>
            </CapacitorProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
