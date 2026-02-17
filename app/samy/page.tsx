'use client';

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
      <div className="divide-y divide-gray-100 dark:divide-gray-800/50 p-2">
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

export default function SamyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col">
      <header>
        <MyHeder />
      </header>

      <main className="flex-1">
        {/* Hero */}
        <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm mb-6">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Samy Döner Kebap
            </h1>
            <p className="mt-3 text-red-100 text-lg sm:text-xl max-w-xl mx-auto">
              Frisch zubereitet, mit Liebe serviert
            </p>
          </div>
        </div>

        {/* Hinweis-Banner */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-5">
          <div className="flex items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 px-5 py-3 shadow-sm">
            <Star className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Jetzt auch Kalbfleisch gegen Aufpreis von 1€ erhältlich!
            </p>
          </div>
        </div>

        {/* Menü-Kategorien */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Linke Spalte: Döner & Dürüm */}
            <div className="space-y-6 lg:space-y-8">
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
            <div className="space-y-6 lg:space-y-8">
              <MenuSection category={categories[1]} />
              <MenuSection category={categories[2]} />
            </div>
          </div>
        </div>

        {/* Allergene Hinweis */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
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
