import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fitness & Sport Rechner',
  description: 'Grundumsatz (BMR), Ruhepuls, Blutdruck-Referenzwerte und Lauftempo berechnen',
};

export default function FitnessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
