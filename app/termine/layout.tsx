import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termine',
  description: 'Veranstaltungen und Termine 2022-2026',
};

export default function TermineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
