import type { Metadata, Viewport } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_TITLE} | Folk Planner`,
    template: `%s | ${SITE_NAME}`
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Newport Folk Festival 2026",
    "Newport Folk schedule",
    "Newport Folk set times",
    "Newport Folk 2026 lineup",
    "Fort Adams",
    "Newport Rhode Island music festival",
    "festival planner"
  ],
  alternates: {
    canonical: "/"
  },
  appleWebApp: {
    capable: true,
    title: "Folk Planner"
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg"
  },
  other: {
    "mobile-web-app-capable": "yes"
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: "/",
    locale: "en_US",
    title: `${SITE_TITLE} | Folk Planner`,
    description: SITE_DESCRIPTION
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_TITLE} | Folk Planner`,
    description: SITE_DESCRIPTION
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  }
};

export const viewport: Viewport = {
  themeColor: "#17231d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
