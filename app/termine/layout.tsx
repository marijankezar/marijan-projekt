import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termine — Vinko Poljanec',
  description: 'Konzert- und Veranstaltungstermine des MoPZ Vinko Poljanec 2022–2026',
};

export default function TermineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
