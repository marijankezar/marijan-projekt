import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TimeBook',
  description: 'Zeiterfassung und Stundenbuchung',
  robots: { index: false, follow: false },
};

export default function TimebookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
