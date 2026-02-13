import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import './hilis.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://kezar.at'),
  title: {
    template: '%s | Marijan KEŽAR',
    default: 'Marijan KEŽAR 2026 - Web Development',
  },
  description: 'Webseite von Marijan Kežar BSc - Web Development, Video Archiv und mehr',
  authors: [{ name: 'Marijan Kežar' }],
  keywords: ['Marijan Kežar', 'Web Development', 'kezar.at'],
  openGraph: {
    type: 'website',
    locale: 'de_AT',
    url: 'https://kezar.at',
    siteName: 'Marijan KEŽAR',
    title: 'Marijan KEŽAR 2026 - Web Development',
    description: 'Webseite von Marijan Kežar BSc - Web Development, Video Archiv und mehr',
  },
  twitter: {
    card: 'summary',
    title: 'Marijan KEŽAR 2026',
    description: 'Webseite von Marijan Kežar BSc - Web Development, Video Archiv und mehr',
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Script to set dark mode class based on system preference
const themeScript = `
  (function() {
    function setTheme() {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    setTheme();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setTheme);
  })();
`;

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'Marijan KEŽAR',
      url: 'https://kezar.at',
    },
    {
      '@type': 'Person',
      name: 'Marijan Kežar',
      url: 'https://kezar.at',
      jobTitle: 'Web Developer',
      honorificSuffix: 'BSc',
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
