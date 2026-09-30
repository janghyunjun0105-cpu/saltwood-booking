import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { StorageNotice } from "@/components/layout/StorageNotice";
import { RESTAURANT, getSiteUrl } from "@/lib/restaurant";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const DESCRIPTION =
  "Saltwood Kitchen is a modern American bistro on Main Street in Austin, TX. See our hours and book a table online in under a minute.";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${RESTAURANT.name} — Modern American Bistro in Austin, TX`,
    template: `%s · ${RESTAURANT.name}`,
  },
  description: DESCRIPTION,
  applicationName: RESTAURANT.name,
  openGraph: {
    type: "website",
    siteName: RESTAURANT.name,
    locale: "en_US",
    title: `${RESTAURANT.name} — Modern American Bistro in Austin, TX`,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f2eb",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${instrumentSans.variable}`}>
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <a
          href="#main"
          className="sr-only rounded-full bg-primary px-4 py-3 font-medium text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
        >
          Skip to content
        </a>
        <DemoBanner />
        <StorageNotice />
        {children}
      </body>
    </html>
  );
}
