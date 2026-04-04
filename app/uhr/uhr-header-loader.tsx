'use client';

import dynamic from 'next/dynamic';

const UhrHeader = dynamic(() => import('./uhr-header'), { ssr: false, loading: () => null });

export default function UhrHeaderLoader() {
  return <UhrHeader />;
}
