import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registrierung',
  description: 'Konto erstellen bei kezar.at',
  robots: { index: false, follow: false },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
