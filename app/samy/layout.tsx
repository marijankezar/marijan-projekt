import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Samy Döner Kebap',
  description: 'Döner, Dürüm, Kebap Spezialitäten und Bowls - Speisekarte mit allen Gerichten und Preisen',
  keywords: ['Döner', 'Kebap', 'Dürüm', 'Bowl', 'Speisekarte', 'Samy'],
};

export default function SamyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
