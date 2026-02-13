import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ELRO Elsbacher - Biohort Partner Kärnten',
  description: 'Biohort Gerätehäuser, Hochbeete und Gartenprodukte in Kärnten. Zertifizierter Montagepartner - Lieferung und Montage aus einer Hand.',
  keywords: ['Biohort', 'Gerätehäuser', 'Hochbeete', 'Kärnten', 'Elsbacher', 'ELRO', 'Montage'],
  openGraph: {
    title: 'ELRO Elsbacher - Biohort Partner Kärnten',
    description: 'Biohort Gerätehäuser, Hochbeete und Gartenprodukte in Kärnten',
    type: 'website',
  },
};

const elsbacherJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'ELRO - Ing. Elsbacher Robert',
  description: 'Zertifizierter Biohort Montagepartner in Kärnten',
  telephone: '+43 650 234 6240',
  email: 'robert.elsbacher@gmail.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Klagenfurter Straße 40',
    addressLocality: 'Völkermarkt',
    postalCode: '9100',
    addressCountry: 'AT',
  },
  areaServed: ['Kärnten', 'Steiermark', 'Osttirol', 'Burgenland'],
  url: 'https://kezar.at/elsbacher',
};

export default function ElsbacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(elsbacherJsonLd) }}
      />
      {children}
    </>
  );
}
