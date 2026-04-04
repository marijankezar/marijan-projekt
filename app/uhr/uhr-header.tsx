'use client';

import { useEffect, useRef } from 'react';
import MyHeder from "../components/header";

export default function UhrHeader() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current!;

    const update = () => {
      if (window.scrollY < 10) {
        el.style.transform = 'translateY(0)';
      } else {
        el.style.transform = 'translateY(-100%)';
      }
    };

    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <div
      ref={wrapRef}
      className="fixed top-0 left-0 right-0 z-50 transition-transform duration-300"
      style={{ transform: 'translateY(-100%)' }}
    >
      <MyHeder />
    </div>
  );
}
