import "@/styles/globals.css";
import type { ReactNode } from "react";
import Providers from "@/components/Providers";
import { RoleProvider } from "@/context/RoleContext";
import { ToastProvider, ToastContainer } from "@/components/ui/ToastContext";
import { Metadata } from "next";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Vico Sports | Tennis Club Management",
  description:
    "Vico Sports is the tennis club management platform for court bookings, tournaments, referee assignments, coaching sessions, analytics, and player development.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://vicotennis.onrender.com"),
  keywords: [
    "tennis club management",
    "sports facility booking",
    "coach dashboard",
    "referee scheduling",
    "tournament management",
    "court booking system",
    "player performance analytics",
  ],
  authors: [
    {
      name: "Vico Sports",
      url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://vicotennis.onrender.com",
    },
  ],
  openGraph: {
    title: "Vico Sports | Tennis Club Management",
    description:
      "Manage tennis courts, tournaments, coaches, referees and player workflows with intelligent scheduling, analytics, and real-time updates.",
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://vicotennis.onrender.com",
    images: [
      {
        url: "/seo/og-image.png",
        width: 1200,
        height: 630,
        alt: "Vico Sports tennis management platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vico Sports | Tennis Club Management",
    description:
      "A modern sports platform for tennis clubs, referees, coaches, court bookings and tournament operations.",
    images: ["/seo/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/vico_logo.png",
    apple: "/vico_logo.png",
    other: [
      { rel: 'icon', url: '/vico_logo.png' },
      { rel: 'apple-touch-icon', url: '/vico_logo.png' },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Epilogue:wght@300;400;500;600&family=Ubuntu:wght@300;400;500;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/vico_logo.png" />
        <link rel="apple-touch-icon" href="/vico_logo.png" />
        <link rel="shortcut icon" href="/vico_logo.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Vico Sports',
              url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vicotennis.onrender.com',
              description:
                'Vico Sports is a tennis club management platform for bookings, tournaments, referee scheduling, coaching, and player analytics.',
              publisher: {
                '@type': 'Organization',
                name: 'Vico Sports',
                url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vicotennis.onrender.com',
              },
              potentialAction: {
                '@type': 'SearchAction',
                target: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vicotennis.onrender.com'}/search?q={search_term_string}`,
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Vico Sports',
              applicationCategory: 'SportsManagementApplication',
              operatingSystem: 'Web, iOS, Android',
              description: 'Tennis club management platform for bookings, tournaments, referees, and coaching.',
              url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vicotennis.onrender.com',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD'
              }
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Vico Sports',
              url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vicotennis.onrender.com',
              logo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vicotennis.onrender.com'}/vico_logo.png`,
              sameAs: [
                'https://twitter.com/vicosports',
                'https://linkedin.com/company/vico-sports',
                'https://github.com/vicosports'
              ]
            }),
          }}
        />
      </head>
      <body>
        <ToastProvider>
          <RoleProvider>
            <Providers>
              {children}
              <Toaster position="top-right" />
              <ToastContainer />
            </Providers>
          </RoleProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
