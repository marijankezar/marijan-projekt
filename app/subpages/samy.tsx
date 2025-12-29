import React from 'react';

const menuItems = {
  doenerDurum: [
    {
      name: 'Döner Kebap ACFGN',
      description:
        'Kebapfleisch, Salat, Tomaten, Zwiebel, Rotkraut, Karotten, Gurken und Saucen nach Wahl',
      price: '€6.30',
    },
    {
      name: 'Döner Kebap mit Käse ACFGN',
      description:
        'Kebapfleisch, Käse, Salat, Tomaten, Zwiebel, Rotkraut, Karotten, Gurken und Saucen nach Wahl',
      price: '€7.70',
    },
    {
      name: 'Döner Vegetarisch ACFGN',
      description:
        'Salat, Tomaten, Zwiebel, Rotkraut, Karotten, Gurken und Saucen nach Wahl',
      price: '€5.50',
    },
    {
      name: 'Durum Kebap ACFGN',
      description:
        'Kebapfleisch, Salat, Tomaten, Zwiebel, Rotkraut, Karotten, Gurken und Saucen nach Wahl',
      price: '€7.30',
    },
    {
      name: 'Durum Kebap mit Käse ACFGN',
      description:
        'Kebapfleisch, Käse, Salat, Tomaten, Zwiebel, Rotkraut, Karotten, Gurken und Saucen nach Wahl',
      price: '€8.40',
    },
    {
      name: 'Jumbo Dürüm Kebap ACFGN',
      description:
        'Kebapfleisch, Käse, Salat, Tomaten, Zwiebel, Rotkraut, Karotten, Gurken und Saucen nach Wahl',
      price: '€6.70',
    },
    {
      name: 'Dürüm Vegetarisch ACFGN',
      description:
        'Salat, Tomaten, Zwiebel, Rotkraut, Karotten, Gurken und Saucen nach Wahl',
      price: '€6.70',
    },
  ],
  kebapSpezialitaeten: [
    {
      name: 'Kebap Box mit Salat ACFGN',
      description:
        'Kebapfleisch, Salat, Tomaten, Zwiebel, Rotkraut, Karotten, Gurken und Saucen nach Wahl + Brot',
      price: '€7.90',
    },
    {
      name: 'Kebap Box ACFGN',
      description:
        'Kebapfleisch, Pommes, Salat, Tomaten, Zwiebel, Rotkraut, Karotten, Gurken und Saucen nach Wahl',
      price: '€8.90',
    },
    {
      name: 'Kebap Box Menü ACFGN',
      description: 'Mit Pommes und 0,33l Getränk',
      price: '€14.90',
    },
    {
      name: 'Kebap Teller mit Salat ACFGN',
      description:
        'Kebapfleisch, Salat, Tomaten, Zwiebel, Rotkraut, Karotten, Gurken und Saucen nach Wahl + Brot',
      price: '€10.20',
    },
    {
      name: 'Kebap Teller ACFGN',
      description: 'Wahl aus Pommes, Reis oder Fladenbrot',
      price: '€11.50',
    },
    {
      name: 'Kebap Teller Menü ACFGN',
      description: 'Mit Pommes und 0,33l Getränk',
      price: '€15.90',
    },
  ],
  kebapBowls: [
    {
      name: 'Kebap Bowl ACFGN',
      description:
        'Cheddar-Mix, Salat, Reis, Kebapfleisch, Mais, Gurken, Tomaten, Zwiebel, Rotkraut, Rucola, Schafskäse',
      price: '€12.90',
    },
    {
      name: 'Kebap Bowl Menü ACFGN',
      description: 'Mit Pommes und 0,33l Getränk',
      price: '€15.90',
    },
  ],
};

const DönerMenu: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-gray-100 font-inter flex flex-col">
      <header className="bg-gradient-to-r from-red-700 to-red-800 text-white py-6 text-center shadow-lg animate-fadeInUp animate-pulseGlow">
        <h1 className="text-2xl md:text-3xl font-bold animate-pulse-slow">
          Döner Kebap Menü
        </h1>
      </header>

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl flex-1">
        <div className="highlight bg-gradient-to-r from-amber-400 to-amber-500 text-black font-semibold text-center py-3 mb-6 rounded-lg shadow-md animate-shimmer animate-fadeInUp">
          Jetzt auch Kalbfleisch gegen Aufpreis von 1€ erhältlich!
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 h-full">
          {/* Spalte 1: Döner & Dürüm + Extras */}
          <div className="space-y-6">
            <section className="menu-section">
              <h2 className="text-xl md:text-2xl font-bold text-red-500 mb-4 animate-pulse-slow animate-fadeInUp">
                Döner & Dürüm
              </h2>
              <div className="space-y-4">
                {menuItems.doenerDurum.map((item) => (
                  <div
                    key={item.name}
                    className="menu-item border-b border-gray-700 pb-3 group relative shimmer-bg animate-wave animate-fadeInUp"
                  >
                    <h3 className="text-lg font-semibold text-red-400">{item.name}</h3>
                    <p className="text-gray-300 text-sm">{item.description}</p>
                    <p className="price text-teal-400 font-bold text-sm">{item.price}</p>
                    <div className="animated-line-wrapper mt-2">
                      <div className="animated-line"></div>
                    </div>
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                      <div className="scan-light animate-scanEffect"></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="menu-section">
              <h2 className="text-xl md:text-2xl font-bold text-red-500 mb-4 animate-pulse-slow animate-fadeInUp">
                Extras
              </h2>
              <p className="text-gray-300 text-sm animate-fadeInUp">
                Schafskäse, Cheddar-Mix, Jalapeños{' '}
                <span className="font-bold text-teal-400">+ €1.00</span>
              </p>
              <p className="text-gray-300 text-sm animate-fadeInUp">
                Saucen zur Auswahl: Cocktail-, Knoblauch- oder scharfe Sauce
              </p>
              <div className="animated-line-wrapper mt-3">
                <div className="animated-line"></div>
              </div>
            </section>
          </div>

          {/* Spalte 2: Kebap Spezialitäten + Kebap Bowls */}
          <div className="space-y-6">
            <section className="menu-section">
              <h2 className="text-xl md:text-2xl font-bold text-red-500 mb-4 animate-pulse-slow animate-fadeInUp">
                Kebap Spezialitäten
              </h2>
              <div className="space-y-4">
                {menuItems.kebapSpezialitaeten.map((item) => (
                  <div
                    key={item.name}
                    className="menu-item border-b border-gray-700 pb-3 group relative shimmer-bg animate-wave animate-fadeInUp"
                  >
                    <h3 className="text-lg font-semibold text-red-400">{item.name}</h3>
                    <p className="text-gray-300 text-sm">{item.description}</p>
                    <p className="price text-teal-400 font-bold text-sm">{item.price}</p>
                    <div className="animated-line-wrapper mt-2">
                      <div className="animated-line"></div>
                    </div>
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                      <div className="scan-light animate-scanEffect"></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="menu-section">
              <h2 className="text-xl md:text-2xl font-bold text-red-500 mb-4 animate-pulse-slow animate-fadeInUp">
                Kebap Bowls
              </h2>
              <div className="space-y-4">
                {menuItems.kebapBowls.map((item) => (
                  <div
                    key={item.name}
                    className="menu-item border-b border-gray-700 pb-3 group relative shimmer-bg animate-wave animate-fadeInUp"
                  >
                    <h3 className="text-lg font-semibold text-red-400">{item.name}</h3>
                    <p className="text-gray-300 text-sm">{item.description}</p>
                    <p className="price text-teal-400 font-bold text-sm">{item.price}</p>
                    <div className="animated-line-wrapper mt-2">
                      <div className="animated-line"></div>
                    </div>
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                      <div className="scan-light animate-scanEffect"></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <footer className="text-center mt-6 text-gray-400 text-xs animate-fadeInUp">
          &copy; 2025 Döner Kebap – Alle Preise inkl. MwSt.
          <div className="animated-line-wrapper mt-3">
            <div className="animated-line"></div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DönerMenu;
