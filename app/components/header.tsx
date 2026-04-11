'use client';

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  Home, LogIn, Cake, Music, Clock, Menu, X, Warehouse, CalendarDays, Activity, UtensilsCrossed, Briefcase, Timer
} from "lucide-react";
import Logo from "./logo";

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
  { href: "/crm", label: "CRM", icon: Briefcase },
  { href: "/elsbacher", label: "ELRO", icon: Warehouse },
  { href: "/termine", label: "Termine", icon: CalendarDays },
  { href: "/fitness", label: "Fitness", icon: Activity },
  { href: "/samy", label: "Samy Döner", icon: UtensilsCrossed },
  { href: "/uhr", label: "Atomuhr", icon: Timer },
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
    <>
      {/* Skip-Navigation für Tastatur-Nutzer (WCAG 2.4.1) */}
      <a href="#main-content" className="skip-nav">
        Zum Hauptinhalt springen
      </a>

      <header ref={menuRef} className="bg-white dark:bg-black text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">

        {/* Obere Linie — dekorativ, für Screenreader verborgen */}
        <div className="animated-line-wrapper mb-0.5" aria-hidden="true">
          <div className="animated-line"></div>
        </div>

        {/* Hauptinhalt */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex justify-between items-center h-12">

            {/* Hamburger Button */}
            <nav aria-label="Hauptnavigation">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
                aria-expanded={menuOpen}
                aria-controls="main-nav-menu"
                aria-haspopup="true"
              >
                {menuOpen ? (
                  <X className="w-6 h-6" aria-hidden="true" />
                ) : (
                  <Menu className="w-6 h-6" aria-hidden="true" />
                )}
              </button>

              {/* Dropdown Menü */}
              <ul
                id="main-nav-menu"
                role="menu"
                aria-label="Navigation"
                className={`absolute top-full left-0 mt-2 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl min-w-56 z-50 ${menuOpen ? '' : 'hidden'}`}
              >
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href} role="none">
                      <Link
                        href={item.href}
                        role="menuitem"
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all focus-visible:bg-gray-100 dark:focus-visible:bg-gray-800"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Icon className="w-5 h-5" aria-hidden="true" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Mitte: Animated Logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <Logo />
            </div>

            {/* Rechts: Platzhalter für Balance */}
            <div className="w-10 md:w-auto" aria-hidden="true"></div>
          </div>
        </div>

        {/* Untere Linie — dekorativ */}
        <div className="animated-line-wrapper mt-0.5" aria-hidden="true">
          <div className="animated-line"></div>
        </div>
      </header>
    </>
  );
}
