'use client';

import { useState, useEffect } from 'react';
import MyHeder from '../components/header';
import MyFooter from '../components/footer';
import { UtensilsCrossed, Flame, Salad, ChefHat, Star } from 'lucide-react';

// ============================================
// MENÜ-DATEN
// ============================================

interface MenuItem {
  name: string;
  description: string;
  price: string;
  badge?: string;
}

interface MenuCategory {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: MenuItem[];
}

const categories: MenuCategory[] = [
  {
    title: 'Döner & Dürüm',
    icon: Flame,
    items: [
      {
        name: 'Döner Kebap',
        description: 'Kebapfleisch, Salat, Tomaten, Zwiebel, Rotkraut, Karotten, Gurken und Saucen nach Wahl',
        price: '€6,30',
        badge: 'ACFGN',
      },
      {
        name: 'Döner Kebap mit Käse',
        description: 'Kebapfleisch, Käse, Salat, Tomaten, Zwiebel, Rotkraut, Karotten, Gurken und Saucen nach Wahl',
        price: '€7,70',
        badge: 'ACFGN',
      },
      {
        name: 'Döner Vegetarisch',
        description: 'Salat, Tomaten, Zwiebel, Rotkraut, Karotten, Gurken und Saucen nach Wahl',
        price: '€5,50',
        badge: 'ACFGN',
      },
      {
        name: 'Dürüm Kebap',
        description: 'Kebapfleisch, Salat, Tomaten, Zwiebel, Rotkraut, Karotten, Gurken und Saucen nach Wahl',
        price: '€7,30',
        badge: 'ACFGN',
      },
      {
        name: 'Dürüm Kebap mit Käse',
        description: 'Kebapfleisch, Käse, Salat, Tomaten, Zwiebel, Rotkraut, Karotten, Gurken und Saucen nach Wahl',
        price: '€8,40',
        badge: 'ACFGN',
      },
      {
        name: 'Jumbo Dürüm Kebap',
        description: 'Kebapfleisch, Käse, Salat, Tomaten, Zwiebel, Rotkraut, Karotten, Gurken und Saucen nach Wahl',
        price: '€6,70',
        badge: 'ACFGN',
      },
      {
        name: 'Dürüm Vegetarisch',
        description: 'Salat, Tomaten, Zwiebel, Rotkraut, Karotten, Gurken und Saucen nach Wahl',
        price: '€6,70',
        badge: 'ACFGN',
      },
    ],
  },
  {
    title: 'Kebap Spezialitäten',
    icon: ChefHat,
    items: [
      {
        name: 'Kebap Box mit Salat',
        description: 'Kebapfleisch, Salat, Tomaten, Zwiebel, Rotkraut, Karotten, Gurken und Saucen nach Wahl + Brot',
        price: '€7,90',
        badge: 'ACFGN',
      },
      {
        name: 'Kebap Box',
        description: 'Kebapfleisch, Pommes, Salat, Tomaten, Zwiebel, Rotkraut, Karotten, Gurken und Saucen nach Wahl',
        price: '€8,90',
        badge: 'ACFGN',
      },
      {
        name: 'Kebap Box Menü',
        description: 'Mit Pommes und 0,33l Getränk',
        price: '€14,90',
        badge: 'ACFGN',
      },
      {
        name: 'Kebap Teller mit Salat',
        description: 'Kebapfleisch, Salat, Tomaten, Zwiebel, Rotkraut, Karotten, Gurken und Saucen nach Wahl + Brot',
        price: '€10,20',
        badge: 'ACFGN',
      },
      {
        name: 'Kebap Teller',
        description: 'Wahl aus Pommes, Reis oder Fladenbrot',
        price: '€11,50',
        badge: 'ACFGN',
      },
      {
        name: 'Kebap Teller Menü',
        description: 'Mit Pommes und 0,33l Getränk',
        price: '€15,90',
        badge: 'ACFGN',
      },
    ],
  },
  {
    title: 'Kebap Bowls',
    icon: Salad,
    items: [
      {
        name: 'Kebap Bowl',
        description: 'Cheddar-Mix, Salat, Reis, Kebapfleisch, Mais, Gurken, Tomaten, Zwiebel, Rotkraut, Rucola, Schafskäse',
        price: '€12,90',
        badge: 'ACFGN',
      },
      {
        name: 'Kebap Bowl Menü',
        description: 'Mit Pommes und 0,33l Getränk',
        price: '€15,90',
        badge: 'ACFGN',
      },
    ],
  },
];

// ============================================
// KOMPONENTEN
// ============================================

function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <div className="group flex items-start justify-between gap-4 rounded-lg px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {item.name}
          </h3>
          {item.badge && (
            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 tracking-wider">
              {item.badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          {item.description}
        </p>
      </div>
      <span className="shrink-0 font-bold text-red-600 dark:text-red-400 tabular-nums">
        {item.price}
      </span>
    </div>
  );
}

function MenuSection({ category }: { category: MenuCategory }) {
  const Icon = category.icon;
  return (
    <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50 dark:bg-gray-900/80">
        <Icon className="w-5 h-5 text-red-500" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          {category.title}
        </h2>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800/50 p-1">
        {category.items.map((item) => (
          <MenuItemCard key={item.name} item={item} />
        ))}
      </div>
    </section>
  );
}

// ============================================
// HAUPTSEITE
// ============================================

const directions = ['left', 'right', 'top', 'bottom'] as const;

export default function SamyPage() {
  const [dir, setDir] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDir((d) => (d + 1) % directions.length);
      setAnimKey((k) => k + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentDir = directions[dir];
  const titleAnim = currentDir === 'left' ? 'slideFromLeft' :
                     currentDir === 'right' ? 'slideFromRight' :
                     currentDir === 'top' ? 'slideFromTop' : 'slideFromBottom';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col">
      <header>
        <MyHeder />
      </header>

      <main className="flex-1">
        {/* Hero */}
        <style>{`
          @keyframes slideFromLeft {
            from { opacity: 0; transform: translateX(-40px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes slideFromRight {
            from { opacity: 0; transform: translateX(40px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes slideFromTop {
            from { opacity: 0; transform: translateY(-25px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideFromBottom {
            from { opacity: 0; transform: translateY(25px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes subtitleReveal {
            from { opacity: 0; letter-spacing: 0.3em; }
            to { opacity: 1; letter-spacing: 0.05em; }
          }
          @keyframes iconPop {
            0% { transform: rotate(0deg) scale(0.5); opacity: 0; }
            60% { transform: rotate(360deg) scale(1.1); opacity: 1; }
            100% { transform: rotate(360deg) scale(1); opacity: 1; }
          }
        `}</style>
        <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 text-center">
            <div className="inline-flex items-center gap-4">
              <div key={`icon-${animKey}`} className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm" style={{ animation: 'iconPop 0.8s ease-out both' }}>
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h1 key={`title-${animKey}`} className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight" style={{ animation: `${titleAnim} 0.8s ease-out both` }}>
                  Samy Döner Kebap
                </h1>
                <p key={`sub-${animKey}`} className="text-red-100 text-sm sm:text-base tracking-wide" style={{ animation: 'subtitleReveal 1s ease-out 0.3s both' }}>
                  Frisch zubereitet, mit Liebe serviert
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Menü-Kategorien */}
        <div className="grid grid-cols-2 gap-6 px-4 py-6">
          {/* Linke Spalte: Döner & Dürüm + Extras */}
          <div className="space-y-6">
            <MenuSection category={categories[0]} />

            {/* Extras */}
            <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50 dark:bg-gray-900/80">
                <Flame className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Extras
                </h2>
              </div>
              <div className="px-6 py-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Schafskäse, Cheddar-Mix, Jalapeños
                  </p>
                  <span className="shrink-0 font-bold text-red-600 dark:text-red-400 tabular-nums">
                    + €1,00
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Saucen: Cocktail-, Knoblauch- oder scharfe Sauce
                </p>
              </div>
            </section>
          </div>

          {/* Rechte Spalte: Spezialitäten & Bowls */}
          <div className="space-y-6">
            <MenuSection category={categories[1]} />
            <MenuSection category={categories[2]} />
          </div>
        </div>

        {/* Kalbfleisch-Hinweis */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-600 px-6 py-4 shadow-md">
            <Star className="w-6 h-6 text-amber-900 shrink-0" />
            <p className="text-base sm:text-lg font-bold text-amber-900">
              Jetzt auch Kalbfleisch gegen Aufpreis von 1€ erhältlich!
            </p>
            <Star className="w-6 h-6 text-amber-900 shrink-0 hidden sm:block" />
          </div>
        </div>

        {/* Allergene Hinweis */}
        <div className="px-4 pb-6">
          <p className="text-xs text-center text-gray-400 dark:text-gray-600">
            Allergene: A = Gluten, C = Eier, F = Soja, G = Milch, N = Schalenfrüchte.
            Alle Preise inkl. MwSt.
          </p>
        </div>
      </main>

      <footer>
        <MyFooter />
      </footer>
    </div>
  );
}
