'use client';

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  Home, LogIn, Cake, Music, Clock, Menu, X, Warehouse, CalendarDays
} from "lucide-react";

// ============================================
// NAVIGATION KONFIGURATION
// Neue Links hier hinzufügen!
// ============================================
interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  external?: boolean;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  { href: "/", label: "Start", icon: Home },
  { href: "/login", label: "Login", icon: LogIn },
  { href: "/birthday", label: "Birthday", icon: Cake },
  { href: "/songs", label: "Pesmi", icon: Music },
  { href: "/timebook", label: "TimeBook", icon: Clock },
  { href: "/elsbacher", label: "ELRO", icon: Warehouse },
  { href: "/termine", label: "Termine", icon: CalendarDays },
  // Neue Links hier hinzufügen:
  // { href: "/neuer-link", label: "Neuer Link", icon: SomeIcon },
];

export default function MyHeder() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Schließe Menü wenn außerhalb geklickt wird
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Schließe Menü bei Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <header ref={menuRef} className="bg-white dark:bg-black text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">

      {/* Obere Linie */}
      <div className="animated-line-wrapper mb-0.5">
        <div className="animated-line"></div>
      </div>

      {/* Hauptinhalt */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex justify-between items-center h-12">

          {/* Hamburger Button - funktioniert auf allen Bildschirmgrößen */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Menü öffnen"
            >
              {menuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            {/* Dropdown Menü - erscheint direkt unter dem Button */}
            {menuOpen && (
              <div className="absolute top-full left-0 mt-2 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl min-w-56 z-50">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mitte: kezar.at Logo */}
          <a
            href="https://kezar.at"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute left-1/2 transform -translate-x-1/2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold text-sm sm:text-base tracking-wide whitespace-nowrap transition-colors"
          >
            2026 kezar.at
          </a>

          {/* Rechts: Platzhalter für Balance */}
          <div className="w-10 md:w-auto"></div>
        </div>
      </div>


      {/* Untere Linie */}
      <div className="animated-line-wrapper mt-0.5">
        <div className="animated-line"></div>
      </div>
    </header>
  );
}
