import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Geburtstag',
  description: 'Geburtstagsgrüße',
};

export default function BirthdayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
