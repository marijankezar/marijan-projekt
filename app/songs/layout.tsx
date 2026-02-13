import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pesmarica',
  description: 'Pesmarica - Sammlung slowenischer Lieder',
};

export default function SongsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
