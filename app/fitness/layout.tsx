import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fitness Rechner – 8 Module',
  description:
    'BMI, Körperfett, WHR, TDEE, 1RM, Ruhepuls, VO₂max und HRV – alle Fitness-Berechnungen an einem Ort.',
};

export default function FitnessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
