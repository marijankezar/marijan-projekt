'use client';

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  Home, LogIn, Cake, Music, Clock, Menu, X, ChevronDown,
  ExternalLink
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
  // Neue Links hier hinzufügen:
  // { href: "/neuer-link", label: "Neuer Link", icon: SomeIcon },
];

export default function MyHeder() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Schließe Menü wenn außerhalb geklickt wird
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Schließe mobile Menü bei Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        setActiveDropdown(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const NavLink = ({ item, mobile = false }: { item: NavItem; mobile?: boolean }) => {
    const Icon = item.icon;
    const baseClasses = mobile
      ? "flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all rounded-lg"
      : "flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all rounded-lg text-sm";

    if (item.external) {
      return (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={baseClasses}
          onClick={() => mobile && setMobileMenuOpen(false)}
        >
          <Icon className="w-4 h-4" />
          <span>{item.label}</span>
          <ExternalLink className="w-3 h-3 opacity-50" />
        </a>
      );
    }

    return (
      <Link
        href={item.href}
        className={baseClasses}
        onClick={() => mobile && setMobileMenuOpen(false)}
      >
        <Icon className="w-4 h-4" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <header ref={menuRef} className="bg-white dark:bg-black text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">

      {/* Obere Linie */}
      <div className="animated-line-wrapper mb-0.5">
        <div className="animated-line"></div>
      </div>

      {/* Hauptinhalt */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex justify-between items-center h-12">

          {/* Mobile: Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Menü öffnen"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Desktop: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => (
              item.children ? (
                // Dropdown-Menü für Items mit Untermenüs
                <div key={item.href} className="relative">
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === item.href ? null : item.href)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all rounded-lg text-sm"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${activeDropdown === item.href ? 'rotate-180' : ''}`} />
                  </button>

                  {activeDropdown === item.href && (
                    <div className="absolute top-full left-0 mt-1 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg min-w-48 z-50">
                      {item.children.map((child) => (
                        <NavLink key={child.href} item={child} />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <NavLink key={item.href} item={item} />
              )
            ))}
          </nav>

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

      {/* Mobile: Dropdown Menü */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-lg z-50">
          <nav className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {navigationItems.map((item) => (
              item.children ? (
                <div key={item.href}>
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === item.href ? null : item.href)}
                    className="flex items-center justify-between w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === item.href ? 'rotate-180' : ''}`} />
                  </button>

                  {activeDropdown === item.href && (
                    <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                      {item.children.map((child) => (
                        <NavLink key={child.href} item={child} mobile />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <NavLink key={item.href} item={item} mobile />
              )
            ))}
          </nav>
        </div>
      )}

      {/* Untere Linie */}
      <div className="animated-line-wrapper mt-0.5">
        <div className="animated-line"></div>
      </div>
    </header>
  );
}
