'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Phone, Mail, MapPin, ChevronDown, Menu, X, Home as HomeIcon,
  Warehouse, Flower2, Trash2, Box, TreePine, Shield, Award,
  Clock, Wrench, Truck, CheckCircle2, ArrowRight, ExternalLink
} from 'lucide-react';

// ============================================
// ELRO ELSBACHER - BIOHORT PARTNER KÄRNTEN
// Professionelle Landingpage im PREFA-Stil
// ============================================

interface Product {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
  image: string;
}

// ============================================
// BIOHORT PRODUKTKATALOG
// Basierend auf elsbacher.com und biohort.com
// ============================================

// Gerätehäuser - Hauptkategorie
interface GardenShed {
  id: string;
  name: string;
  description: string;
  features: string[];
  loadCapacity: string;
}

const gardenSheds: GardenShed[] = [
  {
    id: 'highline',
    name: 'HighLine®',
    description: 'Elegantes Industriedesign mit modernem Flachdach. Die rundum integrierte Oberlichte setzt markante Akzente.',
    features: ['Modernes Flachdach', 'Integrierte Oberlichte', 'Höchste Einbruchsicherheit', 'Elegantes Design'],
    loadCapacity: '150 kg/m²'
  },
  {
    id: 'avantgarde',
    name: 'AvantGarde®',
    description: 'Äußerst stabiles Metallgerätehaus, das den Ansprüchen moderner Architektur gerecht wird.',
    features: ['Moderne Architektur', 'Sehr stabil', 'Flexible Ausstattung', 'Einbruchsicher'],
    loadCapacity: '150 kg/m²'
  },
  {
    id: 'panorama',
    name: 'Panorama®',
    description: 'Die umlaufende Oberlichte aus Acrylglas verleiht dem Gerätehaus eine moderne Leichtigkeit.',
    features: ['Umlaufende Oberlichte', 'Acrylglas-Elemente', 'Individuelle Ausstattung', 'Premium-Qualität'],
    loadCapacity: '150 kg/m²'
  },
  {
    id: 'neo',
    name: 'Neo',
    description: 'Kompaktes Gerätehaus mit höchster Sicherheit gegen Einbruch und modernem Design.',
    features: ['Kompakte Bauweise', 'Einbruchsicher', 'Modernes Design', 'Platzsparend'],
    loadCapacity: '150 kg/m²'
  },
  {
    id: 'europa',
    name: 'Europa',
    description: 'Jahrzehntelang bewährt und über 150.000 mal verkauft – der Klassiker unter den Gerätehäusern.',
    features: ['Bewährte Qualität', 'Über 150.000 verkauft', 'Klassisches Design', 'Preis-Leistung'],
    loadCapacity: '150 kg/m²'
  },
  {
    id: 'casanova',
    name: 'CasaNova®',
    description: 'Isoliertes Design-Nebengebäude für Werkstatt, Gerätehaus oder Saunahaus mit einzigartiger Flexibilität.',
    features: ['Isoliert', 'Multifunktional', 'Design-Nebengebäude', 'Höchste Traglast'],
    loadCapacity: '215 kg/m²'
  }
];

// Weitere Produkte
const products: Product[] = [
  {
    id: 'geraetehaeuser',
    name: 'Gerätehäuser',
    description: 'Hochwertige Metallgerätehäuser (HighLine, AvantGarde, Panorama, Neo, Europa) aus feuerverzinktem Stahlblech. Schneelast bis 150 kg/m², sturmfest bis 150 km/h.',
    icon: Warehouse,
    features: ['Schneelast 150 kg/m²', 'Sturmfest 150 km/h', '20 Jahre Garantie', '6 Modellreihen'],
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'hochbeete',
    name: 'HochBeet',
    description: 'Ergonomisches Gärtnern mit intelligentem Design. Maximieren Sie Ihre Ernte mit dem perfekten Biohort Hochbeet.',
    icon: Flower2,
    features: ['Rückenschonend', 'Schneckenschutz', 'Langlebiger Stahl', 'Einfache Montage'],
    image: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'storemax',
    name: 'StoreMax®',
    description: 'Verstauen Sie Mülltonnen, Rasenmäher, Gartengeräte, Griller und Kinderwägen sicher und elegant.',
    icon: Trash2,
    features: ['Rollladenbox', 'Traglast 100 kg/m²', 'Modular erweiterbar', 'Elegantes Design'],
    image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'freizeitbox',
    name: 'FreizeitBox',
    description: 'Perfekte Aufbewahrung für Sitzkissen, Spielzeug, Sport- und Campingutensilien. Wasserdicht und abschließbar.',
    icon: Box,
    features: ['100% Wasserdicht', 'Abschließbar', 'UV-beständig', 'Große Kapazität'],
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'pergola',
    name: 'Pergola',
    description: 'Stilvoller Schattenspender für mehr Komfort und Lebensqualität im Freien. Erweiterbar mit LED-Beleuchtung und Sonnenschutz.',
    icon: TreePine,
    features: ['Verstellbare Lamellen', 'LED-Beleuchtung optional', '20 Jahre Garantie', 'Premium-Qualität'],
    image: 'https://images.unsplash.com/photo-1598977123118-4e30ba3c4f5b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'highboard',
    name: 'HighBoard',
    description: 'Geräteschrank für Terrasse und Balkon. Als Stauraum mit Regal oder als Mülltonnenbox/Fahrradgarage nutzbar.',
    icon: HomeIcon,
    features: ['Kompakter Schrank', 'Flexibel nutzbar', 'Mit BikeHolder', 'XPS-verstärkt'],
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80'
  }
];

const advantages = [
  { icon: Shield, title: '20 Jahre Garantie', description: 'Langfristige Sicherheit durch Biohort Herstellergarantie gegen Korrosion' },
  { icon: Award, title: '100% Made in Austria', description: 'Qualitätsprodukte aus österreichischer Fertigung in Oberösterreich' },
  { icon: Clock, title: 'Wartungsfrei', description: 'Feuerverzinkter, polyamid-einbrennlackierter Qualitätsstahl' },
  { icon: Wrench, title: 'Zertifizierte Montage', description: 'Spezielle Montageschulung garantiert professionellen Aufbau' },
  { icon: Truck, title: 'Lieferung & Montage', description: 'Zeitgleiche Anlieferung und Montage ohne Zwischenlagerung' },
  { icon: CheckCircle2, title: 'Fixpreisgarantie', description: 'Klare Festpreise ohne versteckte Kosten – Montage 10-20% vom Produktpreis' }
];

// Leistungen / Services
const services = [
  {
    title: 'Beratung vor Ort',
    description: 'Individuelle Beratung bei Ihnen zu Hause für die optimale Produktwahl'
  },
  {
    title: 'Fundament & Vorbereitung',
    description: 'Professionelle Fundamenterstellung für stabilen und dauerhaften Stand'
  },
  {
    title: 'Lieferung',
    description: 'Direkte Lieferung zum Aufstellort ohne Zwischenlagerung'
  },
  {
    title: 'Montage',
    description: 'Fachgerechter Aufbau durch zertifizierte Biohort-Monteure'
  },
  {
    title: 'Zubehör-Integration',
    description: 'Regale, Halter, Fahrradsets oder zusätzliche Fenster jederzeit nachrüstbar'
  },
  {
    title: 'Entsorgung',
    description: 'Komplette Entsorgung aller Verpackungsmaterialien'
  }
];

const serviceRegions = ['Kärnten', 'Steiermark', 'Osttirol', 'Burgenland'];

export default function ElsbacherPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      {/* Navigation */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg md:text-xl">E</span>
              </div>
              <div>
                <h1 className={`font-bold text-lg md:text-xl transition-colors ${
                  isScrolled ? 'text-gray-900 dark:text-white' : 'text-white'
                }`}>ELRO</h1>
                <p className={`text-xs transition-colors ${
                  isScrolled ? 'text-gray-600 dark:text-gray-400' : 'text-white/80'
                }`}>Ing. Elsbacher Robert</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4 lg:gap-6">
              {/* Home Link */}
              <Link
                href="/"
                className={`text-sm font-medium transition-colors hover:text-green-600 flex items-center gap-1 ${
                  isScrolled ? 'text-gray-700 dark:text-gray-300' : 'text-white/90 hover:text-white'
                }`}
              >
                <HomeIcon className="w-4 h-4" />
                <span className="hidden lg:inline">Home</span>
              </Link>

              {/* Section Links */}
              {['Produkte', 'Gerätehäuser', 'Vorteile', 'Service', 'Kontakt'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  className={`text-sm font-medium transition-colors hover:text-green-600 ${
                    isScrolled ? 'text-gray-700 dark:text-gray-300' : 'text-white/90 hover:text-white'
                  }`}
                >
                  {item}
                </button>
              ))}

              {/* CTA Button */}
              <a
                href="tel:+436502346240"
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all hover:shadow-lg flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden lg:inline">Jetzt anrufen</span>
              </a>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors ${
                isScrolled ? 'text-gray-900 dark:text-white' : 'text-white'
              }`}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-xl">
            <nav className="max-w-7xl mx-auto px-4 py-4 space-y-2">
              {/* Home Link */}
              <Link
                href="/"
                className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <HomeIcon className="w-5 h-5" />
                <span>Zurück zur Hauptseite</span>
              </Link>

              {/* Divider */}
              <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

              {/* Section Links */}
              {['Produkte', 'Gerätehäuser', 'Vorteile', 'Service', 'Kontakt'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  className="block w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {item}
                </button>
              ))}

              {/* CTA Button */}
              <a
                href="tel:+436502346240"
                className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                <Phone className="w-5 h-5" />
                <span>Jetzt anrufen</span>
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            poster="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1920&q=80"
          >
            {/* Pexels Free Stock Video - Garden/Nature */}
            <source src="https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4" type="video/mp4" />
          </video>
          {/* Dark Overlay für bessere Lesbarkeit */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-green-900/50 to-black/70"></div>
        </div>

        {/* Animated Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white/90 text-sm mb-8">
            <Award className="w-4 h-4" />
            <span>Zertifizierter Biohort Partner</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Qualität für<br />
            <span className="text-green-400">Ihren Garten</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Ihr zertifizierter Biohort Montagepartner in Kärnten.
            Professionelle Lieferung und Montage von Gerätehäusern,
            Hochbeeten und mehr – alles aus einer Hand.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => scrollToSection('produkte')}
              className="w-full sm:w-auto bg-white text-green-800 hover:bg-green-50 px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-xl flex items-center justify-center gap-2"
            >
              Produkte entdecken
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollToSection('kontakt')}
              className="w-full sm:w-auto border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2"
            >
              Beratung anfragen
            </button>
          </div>

          {/* Trust Badges */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-white/70">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>20 Jahre Garantie</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span>Made in Austria</span>
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              <span>Zertifizierte Montage</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-white/50" />
        </div>
      </section>

      {/* Products Section */}
      <section id="produkte" className="py-20 md:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Unsere Produktpalette
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Hochwertige Biohort Produkte aus feuerverzinktem Stahlblech –
              wartungsfrei und langlebig für Generationen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {products.map((product) => {
              const Icon = product.icon;
              const isActive = activeProduct === product.id;

              return (
                <div
                  key={product.id}
                  className={`group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer ${
                    isActive ? 'ring-2 ring-green-500' : ''
                  }`}
                  onClick={() => setActiveProduct(isActive ? null : product.id)}
                >
                  {/* Product Header with Image */}
                  <div className="h-48 relative overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                      <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Product Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      {product.description}
                    </p>

                    {/* Features */}
                    <div className={`grid grid-cols-2 gap-2 overflow-hidden transition-all duration-300 ${
                      isActive ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      {product.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                        {isActive ? 'Weniger anzeigen' : 'Mehr erfahren'}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-green-600 dark:text-green-400 transition-transform ${
                        isActive ? 'rotate-180' : ''
                      }`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Biohort Partner Badge */}
          <div className="mt-16 text-center">
            <a
              href="https://www.biohort.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              <span>Offizieller Partner von</span>
              <span className="font-bold text-lg">BIOHORT</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Gerätehäuser Modelle Section */}
      <section id="geraetehaeuser" className="py-20 md:py-32 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Biohort Gerätehäuser
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Alle Biohort Modelle sind aus feuerverzinktem, polyamid-einbrennlackiertem Stahlblech gefertigt –
              für ganzjährige Nutzung, schneesicher und komplett wartungsfrei.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gardenSheds.map((shed) => (
              <div
                key={shed.id}
                className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-800"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {shed.name}
                  </h3>
                  <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                    {shed.loadCapacity}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {shed.description}
                </p>
                <div className="space-y-2">
                  {shed.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">Premium Stahlqualität</h3>
            <p className="text-white/80 max-w-2xl mx-auto">
              Biohort verwendet den gleichen hochwertigen Stahl wie Premium-Autohersteller (Mercedes-Benz, BMW, Audi).
              Die dicke Zinkschicht von 275 g/m² garantiert maximalen Korrosionsschutz.
            </p>
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section id="vorteile" className="py-20 md:py-32 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Ihre Vorteile mit ELRO
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Als zertifizierter Biohort Partner garantieren wir Ihnen
              erstklassige Qualität und professionellen Service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advantages.map((advantage, idx) => {
              const Icon = advantage.icon;
              return (
                <div
                  key={idx}
                  className="group p-8 bg-gray-50 dark:bg-gray-900 rounded-2xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-300"
                >
                  <div className="w-14 h-14 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                    <Icon className="w-7 h-7 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {advantage.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {advantage.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Unsere Leistungen */}
          <div className="mt-20">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
              Unser Rundum-Service
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {services.map((service, idx) => (
                <div key={idx} className="text-center p-4">
                  <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                    {idx + 1}
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                    {service.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {service.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Service Regions Section */}
      <section id="service" className="py-20 md:py-32 bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Unser Servicegebiet
              </h2>
              <p className="text-lg text-white/80 mb-8">
                Wir liefern und montieren Biohort Produkte in folgenden Bundesländern –
                schnell, zuverlässig und zu fairen Preisen.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {serviceRegions.map((region, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                    <MapPin className="w-5 h-5 text-green-400" />
                    <span className="font-medium">{region}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Beratung & Planung</h4>
                    <p className="text-white/70 text-sm">Individuelle Beratung für Ihr Projekt</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Lieferung & Montage</h4>
                    <p className="text-white/70 text-sm">Direkt ohne Zwischenlagerung</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Fertig zum Nutzen</h4>
                    <p className="text-white/70 text-sm">Sofort einsatzbereit mit voller Garantie</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 md:p-12">
                <h3 className="text-2xl font-bold mb-6">Kostenlose Beratung</h3>
                <p className="text-white/80 mb-8">
                  Wir beraten Sie gerne persönlich zu allen Biohort Produkten
                  und erstellen Ihnen ein unverbindliches Angebot.
                </p>

                <div className="space-y-4">
                  <a
                    href="tel:+436502346240"
                    className="flex items-center gap-4 bg-white/10 hover:bg-white/20 rounded-xl px-6 py-4 transition-colors"
                  >
                    <Phone className="w-6 h-6 text-green-400" />
                    <div>
                      <p className="text-sm text-white/70">Telefon</p>
                      <p className="font-semibold">0650 / 23 46 240</p>
                    </div>
                  </a>

                  <a
                    href="mailto:robert.elsbacher@gmail.com"
                    className="flex items-center gap-4 bg-white/10 hover:bg-white/20 rounded-xl px-6 py-4 transition-colors"
                  >
                    <Mail className="w-6 h-6 text-green-400" />
                    <div>
                      <p className="text-sm text-white/70">E-Mail</p>
                      <p className="font-semibold">robert.elsbacher@gmail.com</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="kontakt" className="py-20 md:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Kontakt aufnehmen
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Haben Sie Fragen oder möchten Sie ein Angebot?
              Wir freuen uns auf Ihre Nachricht!
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  ELRO - Ing. Elsbacher Robert
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Ihr Handwerker für Haus und Garten – Zertifizierter Biohort Montagepartner
                </p>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Adresse</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Klagenfurter Straße 40<br />
                        9100 Völkermarkt
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
                      <Phone className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Telefon</p>
                      <a href="tel:+436502346240" className="font-medium text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors">
                        0650 / 23 46 240
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
                      <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">E-Mail</p>
                      <a href="mailto:robert.elsbacher@gmail.com" className="font-medium text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors">
                        robert.elsbacher@gmail.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Opening Hours */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Erreichbarkeit
                </h3>
                <div className="space-y-2 text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Montag - Freitag</span>
                    <span className="font-medium text-gray-900 dark:text-white">08:00 - 17:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Samstag</span>
                    <span className="font-medium text-gray-900 dark:text-white">Nach Vereinbarung</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sonntag</span>
                    <span className="font-medium text-gray-900 dark:text-white">Geschlossen</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Map / CTA */}
            <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-8 md:p-12 text-white flex flex-col justify-center">
              <h3 className="text-2xl md:text-3xl font-bold mb-6">
                Bereit für Ihr Projekt?
              </h3>
              <p className="text-white/80 text-lg mb-8">
                Kontaktieren Sie uns für eine unverbindliche Beratung.
                Wir erstellen Ihnen gerne ein individuelles Angebot
                für Ihr Biohort Produkt inklusive Lieferung und Montage.
              </p>

              <div className="space-y-4">
                <a
                  href="tel:+436502346240"
                  className="flex items-center justify-center gap-3 bg-white text-green-800 hover:bg-green-50 px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-xl"
                >
                  <Phone className="w-5 h-5" />
                  Jetzt anrufen
                </a>
                <a
                  href="mailto:robert.elsbacher@gmail.com"
                  className="flex items-center justify-center gap-3 border-2 border-white/30 hover:bg-white/10 px-8 py-4 rounded-xl font-semibold text-lg transition-all"
                >
                  <Mail className="w-5 h-5" />
                  E-Mail schreiben
                </a>
              </div>

              <div className="mt-8 pt-8 border-t border-white/20">
                <p className="text-white/70 text-sm">
                  Seit 2018 lizenziert für Metalltechnik für Metall- und Maschinenbau
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Company */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <div>
                  <h4 className="font-bold">ELRO</h4>
                  <p className="text-xs text-gray-400">Ing. Elsbacher Robert</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Ihr zertifizierter Biohort Partner für professionelle
                Lieferung und Montage in Kärnten und Umgebung.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold mb-4">Schnellzugriff</h4>
              <div className="space-y-2">
                {['Produkte', 'Gerätehäuser', 'Vorteile', 'Service', 'Kontakt'].map((item) => (
                  <button
                    key={item}
                    onClick={() => scrollToSection(item.toLowerCase())}
                    className="block text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold mb-4">Kontakt</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <p>Klagenfurter Straße 40</p>
                <p>9100 Völkermarkt</p>
                <p className="pt-2">
                  <a href="tel:+436502346240" className="hover:text-white transition-colors">
                    0650 / 23 46 240
                  </a>
                </p>
                <p>
                  <a href="mailto:robert.elsbacher@gmail.com" className="hover:text-white transition-colors">
                    robert.elsbacher@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} ELRO Ing. Elsbacher Robert. Alle Rechte vorbehalten.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <Link href="/" className="hover:text-white transition-colors">
                Zurück zur Hauptseite
              </Link>
              <a
                href="https://www.biohort.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                biohort.com <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
