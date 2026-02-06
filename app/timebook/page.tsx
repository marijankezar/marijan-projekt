'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Clock, Play, Square, Users, FileText, BarChart3, Plus,
  Calendar, Building2, RefreshCw, ChevronDown, ChevronUp,
  Timer, TrendingUp, AlertCircle, Check, X, Edit3, Trash2,
  StopCircle, PlayCircle, LogOut, User, Tag, Palette, Save, Search,
  Shield, Download, ChevronLeft, ChevronRight, CalendarDays
} from 'lucide-react';
import MyHeder from '../components/header';
import MyFooter from '../components/footer';

// Types
interface Kunde {
  id: string;
  kundennummer: string;
  firmenname: string | null;
  ansprechperson_vorname: string | null;
  ansprechperson_nachname: string | null;
  email: string | null;
  aktiv: boolean;
}

interface Kategorie {
  id: number;
  bezeichnung: string;
  farbe: string | null;
  standard_stundensatz: number | null;
}

interface Zeiterfassung {
  id: string;
  kunde_id: string;
  kunde_name: string;
  firmenname: string | null;
  kategorie_bezeichnung: string | null;
  kategorie_farbe: string | null;
  start_datum: string;
  start_zeit: string;
  ende_datum: string | null;
  ende_zeit: string | null;
  dauer_minuten: number | null;
  dauer_stunden: number | null;
  titel: string | null;
  beschreibung: string;
  abgeschlossen: boolean;
}

interface LaufendeErfassung extends Zeiterfassung {
  laufzeit_minuten: number;
  laufzeit_stunden: number;
}

interface Statistiken {
  stunden: {
    heute: number;
    woche: number;
    monat: number;
    jahr: number;
  };
  kunden: {
    total: number;
    aktiv: number;
  };
  laufende_erfassungen: number;
}

type ActiveTab = 'dashboard' | 'zeiterfassung' | 'kunden' | 'eintraege' | 'kategorien' | 'woche' | 'export';

interface CurrentUser {
  id: number;
  username: string;
  email: string;
  vorname: string | null;
  nachname: string | null;
  admin: number;
}

export default function TimeBookPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // Data States
  const [statistiken, setStatistiken] = useState<Statistiken | null>(null);
  const [kunden, setKunden] = useState<Kunde[]>([]);
  const [kategorien, setKategorien] = useState<Kategorie[]>([]);
  const [eintraege, setEintraege] = useState<Zeiterfassung[]>([]);
  const [laufend, setLaufend] = useState<LaufendeErfassung | null>(null);
  const [laufzeitDisplay, setLaufzeitDisplay] = useState<string>('0:00');

  // Form States
  const [showNeueErfassung, setShowNeueErfassung] = useState(false);
  const [showNeuerKunde, setShowNeuerKunde] = useState(false);

  // Session Timer
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [sessionRemaining, setSessionRemaining] = useState<string>('');
  const [sessionWarning, setSessionWarning] = useState(false);
  const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 Stunden in ms

  // Timer für laufende Erfassung
  useEffect(() => {
    if (!laufend) return;

    const interval = setInterval(() => {
      const start = new Date(`${laufend.start_datum}T${laufend.start_zeit}`);
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      setLaufzeitDisplay(`${hours}:${minutes.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [laufend]);

  // Session Timer
  useEffect(() => {
    if (!isAuthenticated) return;

    // Session-Start aus localStorage laden oder neu setzen
    const storedStart = localStorage.getItem('timebook_session_start');
    const initialStart = storedStart ? parseInt(storedStart) : Date.now();
    if (!storedStart) {
      localStorage.setItem('timebook_session_start', initialStart.toString());
    }
    setSessionStart(initialStart);

    const updateTimer = () => {
      // Immer aktuellen Wert aus localStorage lesen
      const currentStart = parseInt(localStorage.getItem('timebook_session_start') || initialStart.toString());
      const elapsed = Date.now() - currentStart;
      const remaining = SESSION_DURATION - elapsed;

      if (remaining <= 0) {
        setSessionRemaining('Abgelaufen');
        setSessionWarning(true);
        return;
      }

      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

      if (remaining < 30 * 60 * 1000) { // Warnung unter 30 Minuten
        setSessionWarning(true);
      } else {
        setSessionWarning(false);
      }

      setSessionRemaining(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    // Sofort einmal ausführen
    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, SESSION_DURATION]);

  // Session bei Login zurücksetzen
  const resetSessionTimer = () => {
    const now = Date.now();
    localStorage.setItem('timebook_session_start', now.toString());
    setSessionStart(now);
    setSessionWarning(false);
  };

  // Auth prüfen
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/timebook/auth/me');
      if (res.status === 401) {
        setIsAuthenticated(false);
        setLoading(false);
        return false;
      }
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        setIsAuthenticated(true);
        return true;
      }
      setIsAuthenticated(false);
      setLoading(false);
      return false;
    } catch {
      setIsAuthenticated(false);
      setLoading(false);
      return false;
    }
  }, []);

  // Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/timebook/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setCurrentUser(null);
      localStorage.removeItem('timebook_session_start'); // Session-Timer löschen
      router.push('/timebook/login');
    } catch (err) {
      console.error('Logout Fehler:', err);
    }
  };

  // Daten laden
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Erst Auth prüfen
      const isAuth = await checkAuth();
      if (!isAuth) return;

      const [statsRes, kundenRes, katRes, eintraegeRes, laufendRes] = await Promise.all([
        fetch('/api/timebook/statistiken?type=uebersicht'),
        fetch('/api/timebook/kunden?aktiv=true'),
        fetch('/api/timebook/kategorien'),
        fetch('/api/timebook/zeiterfassung?limit=20'),
        fetch('/api/timebook/zeiterfassung/laufend')
      ]);

      if (statsRes.status === 401) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      const [statsData, kundenData, katData, eintraegeData, laufendData] = await Promise.all([
        statsRes.json(),
        kundenRes.json(),
        katRes.json(),
        eintraegeRes.json(),
        laufendRes.json()
      ]);

      if (statsData.success) setStatistiken(statsData.data);
      if (kundenData.success) setKunden(kundenData.data);
      if (katData.success) setKategorien(katData.data);
      if (eintraegeData.success) setEintraege(eintraegeData.data);
      if (laufendData.success && laufendData.laeuft) {
        setLaufend(laufendData.data);
        setLaufzeitDisplay(laufendData.laufzeit.anzeige);
      } else {
        setLaufend(null);
      }

    } catch (err) {
      console.error('Fehler beim Laden:', err);
      setError('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  }, [checkAuth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Zeiterfassung stoppen
  const stopTimer = async () => {
    try {
      const res = await fetch('/api/timebook/zeiterfassung/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (res.ok) {
        setLaufend(null);
        loadData();
      }
    } catch (err) {
      console.error('Fehler beim Stoppen:', err);
    }
  };

  // Formatierung
  const formatDauer = (minuten: number | null): string => {
    if (!minuten) return '-';
    const h = Math.floor(minuten / 60);
    const m = minuten % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <MyHeder />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Lade TimeBook...</p>
          </div>
        </div>
        <MyFooter />
      </div>
    );
  }

  // Nicht eingeloggt - Login-Aufforderung
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        </div>

        <div className="relative text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-sm rounded-3xl mb-6">
            <Clock className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">TimeBook</h1>
          <p className="text-purple-200 mb-8">Zeiterfassung & Projektverwaltung</p>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md mx-auto border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Anmeldung erforderlich</h2>
            <p className="text-purple-200 mb-6">
              Bitte melde dich an, um TimeBook zu nutzen.
            </p>

            <div className="space-y-3">
              <Link
                href="/timebook/login"
                className="block w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all text-center"
              >
                Anmelden
              </Link>
              <Link
                href="/timebook/register"
                className="block w-full py-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all text-center border border-white/20"
              >
                Neues Konto erstellen
              </Link>
            </div>
          </div>

          <Link
            href="/"
            className="inline-block mt-8 text-purple-300 hover:text-white transition-colors"
          >
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MyHeder />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Clock className="w-8 h-8 text-indigo-600" />
              TimeBook
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Zeiterfassung & Projektverwaltung</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            {/* Session Timer */}
            {sessionRemaining && (
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium ${
                  sessionWarning
                    ? 'bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-400'
                    : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                }`}
                title="Verbleibende Session-Zeit"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Session:</span>
                <span className="font-mono">{sessionRemaining}</span>
              </div>
            )}

            {/* User Info */}
            {currentUser && (
              <div className="flex items-center gap-3 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {currentUser.vorname || currentUser.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentUser.email}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={loadData}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Aktualisieren"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Aktualisieren</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              title="Abmelden"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Abmelden</span>
            </button>
          </div>
        </div>

        {/* Laufende Erfassung Banner */}
        {laufend && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl text-white shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Timer className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm opacity-90">Laufende Zeiterfassung</p>
                  <p className="text-xl font-bold">{laufend.titel || laufend.beschreibung}</p>
                  <p className="text-sm opacity-90">{laufend.kunde_name || laufend.firmenname}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-3xl font-mono font-bold">{laufzeitDisplay}</p>
                  <p className="text-sm opacity-90">seit {laufend.start_zeit} Uhr</p>
                </div>
                <button
                  onClick={stopTimer}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors"
                >
                  <StopCircle className="w-5 h-5" />
                  Stoppen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'zeiterfassung', label: 'Zeiterfassung', icon: Clock },
            { id: 'woche', label: 'Wochenansicht', icon: CalendarDays },
            { id: 'kunden', label: 'Kunden', icon: Users },
            { id: 'kategorien', label: 'Kategorien', icon: Tag },
            { id: 'eintraege', label: 'Einträge', icon: FileText },
            { id: 'export', label: 'Export', icon: Download }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <DashboardTab
            statistiken={statistiken}
            laufend={!!laufend}
            onStartClick={() => setActiveTab('zeiterfassung')}
          />
        )}

        {activeTab === 'zeiterfassung' && (
          <ZeiterfassungTab
            kunden={kunden}
            kategorien={kategorien}
            laufend={laufend}
            onStop={stopTimer}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'kunden' && (
          <KundenTab
            kunden={kunden}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'kategorien' && (
          <KategorienTab
            kategorien={kategorien}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'eintraege' && (
          <EintraegeTab
            eintraege={eintraege}
            kunden={kunden}
            kategorien={kategorien}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'woche' && (
          <WochenansichtTab
            eintraege={eintraege}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'export' && (
          <ExportTab
            eintraege={eintraege}
            kunden={kunden}
            kategorien={kategorien}
          />
        )}
      </div>

      <MyFooter />
    </div>
  );
}

// Dashboard Tab
function DashboardTab({
  statistiken,
  laufend,
  onStartClick
}: {
  statistiken: Statistiken | null;
  laufend: boolean;
  onStartClick: () => void;
}) {
  if (!statistiken) return null;

  return (
    <div className="space-y-6">
      {/* Statistik Karten */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Heute"
          value={`${statistiken.stunden.heute.toFixed(1)} h`}
          icon={Clock}
          color="indigo"
        />
        <StatCard
          title="Diese Woche"
          value={`${statistiken.stunden.woche.toFixed(1)} h`}
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Dieser Monat"
          value={`${statistiken.stunden.monat.toFixed(1)} h`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Dieses Jahr"
          value={`${statistiken.stunden.jahr.toFixed(1)} h`}
          icon={BarChart3}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          onClick={onStartClick}
          disabled={laufend}
          className={`p-6 rounded-2xl border-2 border-dashed transition-all text-left ${
            laufend
              ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed'
              : 'border-indigo-300 dark:border-indigo-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
          }`}
        >
          <PlayCircle className={`w-10 h-10 mb-3 ${laufend ? 'text-gray-400' : 'text-indigo-600'}`} />
          <h3 className={`font-semibold ${laufend ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
            {laufend ? 'Timer läuft bereits' : 'Neue Zeiterfassung'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {laufend ? 'Stoppe den laufenden Timer zuerst' : 'Starte eine neue Zeiterfassung'}
          </p>
        </button>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <Users className="w-10 h-10 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Kunden</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {statistiken.kunden.aktiv} <span className="text-sm font-normal text-gray-500">aktiv</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">{statistiken.kunden.total} gesamt</p>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <Timer className="w-10 h-10 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Laufende Erfassungen</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {statistiken.laufende_erfassungen}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {statistiken.laufende_erfassungen === 0 ? 'Keine aktiven Timer' : 'Timer aktiv'}
          </p>
        </div>
      </div>
    </div>
  );
}

// Searchable Kategorie Select Component
function SearchableKategorieSelect({
  kategorien,
  selectedIds,
  onToggle
}: {
  kategorien: Kategorie[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter kategorien based on search
  const filtered = kategorien.filter(k =>
    k.bezeichnung.toLowerCase().includes(search.toLowerCase())
  );

  // Get selected kategorien for display
  const selectedKategorien = kategorien.filter(k => selectedIds.includes(k.id));

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Tags */}
      {selectedKategorien.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedKategorien.map(k => (
            <span
              key={k.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium"
            >
              {k.farbe && (
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: k.farbe }}
                />
              )}
              {k.bezeichnung}
              <button
                type="button"
                onClick={() => onToggle(k.id)}
                className="ml-1 hover:text-indigo-900 dark:hover:text-indigo-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedIds.length > 0 ? "Weitere Kategorie suchen..." : "Kategorie suchen..."}
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              {kategorien.length === 0 ? (
                <span>Keine Kategorien vorhanden</span>
              ) : (
                <span>Keine Treffer für &quot;{search}&quot;</span>
              )}
            </div>
          ) : (
            <div className="py-1">
              {filtered.map(k => {
                const isSelected = selectedIds.includes(k.id);
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => {
                      onToggle(k.id);
                      setSearch('');
                      inputRef.current?.focus();
                    }}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full flex-shrink-0 border-2"
                      style={{
                        backgroundColor: isSelected ? (k.farbe || '#6366f1') : 'transparent',
                        borderColor: k.farbe || '#6366f1'
                      }}
                    />
                    <span className="flex-1">{k.bezeichnung}</span>
                    {k.standard_stundensatz && (
                      <span className="text-xs text-gray-400">
                        {Number(k.standard_stundensatz).toFixed(0)} €/h
                      </span>
                    )}
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  color
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'indigo' | 'blue' | 'green' | 'purple';
}) {
  const colors = {
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">{title}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

// Zeiterfassung Tab
function ZeiterfassungTab({
  kunden,
  kategorien,
  laufend,
  onStop,
  onRefresh
}: {
  kunden: Kunde[];
  kategorien: Kategorie[];
  laufend: LaufendeErfassung | null;
  onStop: () => void;
  onRefresh: () => void;
}) {
  const [mode, setMode] = useState<'timer' | 'manual'>('timer');
  const [formData, setFormData] = useState({
    kunde_id: '',
    kategorie_ids: [] as number[],
    titel: '',
    beschreibung: '',
    // Für manuelle Eingabe
    datum: new Date().toISOString().split('T')[0],
    start_zeit: '',
    ende_zeit: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Berechne Dauer aus Zeiten
  const berechneDauer = (): string => {
    if (!formData.start_zeit || !formData.ende_zeit) return '';
    const [sh, sm] = formData.start_zeit.split(':').map(Number);
    const [eh, em] = formData.ende_zeit.split(':').map(Number);
    let diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
    if (diffMinutes < 0) diffMinutes += 24 * 60; // Über Mitternacht
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')} Stunden`;
  };

  const toggleKategorie = (id: number) => {
    setFormData(prev => ({
      ...prev,
      kategorie_ids: prev.kategorie_ids.includes(id)
        ? prev.kategorie_ids.filter(k => k !== id)
        : [...prev.kategorie_ids, id]
    }));
  };

  const startTimer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.kunde_id) {
      setFormError('Bitte einen Kunden auswählen');
      return;
    }
    if (!formData.beschreibung.trim()) {
      setFormError('Bitte eine Beschreibung eingeben');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/timebook/zeiterfassung/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kunde_id: formData.kunde_id,
          kategorie_ids: formData.kategorie_ids.length > 0 ? formData.kategorie_ids : null,
          titel: formData.titel || null,
          beschreibung: formData.beschreibung
        })
      });

      const data = await res.json();

      if (res.ok) {
        setFormData({ kunde_id: '', kategorie_ids: [], titel: '', beschreibung: '', datum: new Date().toISOString().split('T')[0], start_zeit: '', ende_zeit: '' });
        onRefresh();
      } else {
        setFormError(data.error || 'Fehler beim Starten');
      }
    } catch {
      setFormError('Netzwerkfehler');
    } finally {
      setSubmitting(false);
    }
  };

  const saveManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.kunde_id) {
      setFormError('Bitte einen Kunden auswählen');
      return;
    }
    if (!formData.beschreibung.trim()) {
      setFormError('Bitte eine Beschreibung eingeben');
      return;
    }
    if (!formData.datum) {
      setFormError('Bitte ein Datum eingeben');
      return;
    }
    if (!formData.start_zeit || !formData.ende_zeit) {
      setFormError('Bitte Start- und Endzeit eingeben');
      return;
    }

    // Validierung: Endzeit nach Startzeit
    const [sh, sm] = formData.start_zeit.split(':').map(Number);
    const [eh, em] = formData.ende_zeit.split(':').map(Number);
    if (eh * 60 + em <= sh * 60 + sm) {
      setFormError('Endzeit muss nach Startzeit liegen');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/timebook/zeiterfassung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kunde_id: formData.kunde_id,
          kategorie_ids: formData.kategorie_ids.length > 0 ? formData.kategorie_ids : null,
          titel: formData.titel || null,
          beschreibung: formData.beschreibung,
          start_datum: formData.datum,
          start_zeit: formData.start_zeit,
          ende_datum: formData.datum,
          ende_zeit: formData.ende_zeit
        })
      });

      const data = await res.json();

      if (res.ok) {
        setFormData({ kunde_id: '', kategorie_ids: [], titel: '', beschreibung: '', datum: new Date().toISOString().split('T')[0], start_zeit: '', ende_zeit: '' });
        onRefresh();
      } else {
        setFormError(data.error || 'Fehler beim Speichern');
      }
    } catch {
      setFormError('Netzwerkfehler');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {laufend && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Timer className="w-5 h-5 text-green-500 animate-pulse" />
            Laufende Erfassung
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Es läuft bereits eine Zeiterfassung. Du kannst manuelle Einträge trotzdem hinzufügen.
          </p>
        </div>
      )}

      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        <button
          onClick={() => setMode('timer')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            mode === 'timer'
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4" />
            Timer starten
          </span>
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            mode === 'manual'
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            Manuell eintragen
          </span>
        </button>
      </div>

      <form onSubmit={mode === 'timer' ? startTimer : saveManualEntry} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          {mode === 'timer' ? (
            <>
              <PlayCircle className="w-5 h-5 text-indigo-600" />
              Neue Zeiterfassung starten
            </>
          ) : (
            <>
              <Edit3 className="w-5 h-5 text-indigo-600" />
              Zeit manuell eintragen
            </>
          )}
        </h2>

        {formError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
            {formError}
          </div>
        )}

        {/* Manuelle Zeiteingabe */}
        {mode === 'manual' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Datum <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.datum}
                onChange={e => setFormData({ ...formData, datum: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Startzeit <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.start_zeit}
                onChange={e => setFormData({ ...formData, start_zeit: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Endzeit <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.ende_zeit}
                onChange={e => setFormData({ ...formData, ende_zeit: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
            {berechneDauer() && (
              <div className="sm:col-span-3">
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Dauer: {berechneDauer()}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Kunde <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.kunde_id}
              onChange={e => setFormData({ ...formData, kunde_id: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              required
            >
              <option value="">Kunde auswählen...</option>
              {kunden.map(k => (
                <option key={k.id} value={k.id}>
                  {k.firmenname || `${k.ansprechperson_vorname} ${k.ansprechperson_nachname}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Titel (optional)
            </label>
            <input
              type="text"
              value={formData.titel}
              onChange={e => setFormData({ ...formData, titel: e.target.value })}
              placeholder="z.B. Meeting, Entwicklung, Support..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Kategorien Multi-Select mit Suche */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Kategorien {kategorien.length === 0 && <span className="text-gray-400 font-normal">(keine vorhanden - erstelle welche im Tab &quot;Kategorien&quot;)</span>}
          </label>
          <SearchableKategorieSelect
            kategorien={kategorien}
            selectedIds={formData.kategorie_ids}
            onToggle={toggleKategorie}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Beschreibung <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.beschreibung}
            onChange={e => setFormData({ ...formData, beschreibung: e.target.value })}
            placeholder={mode === 'timer' ? "Was wirst du tun?" : "Was hast du gemacht?"}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting || (mode === 'timer' && !!laufend)}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all disabled:opacity-50"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : mode === 'timer' ? (
            <Play className="w-5 h-5" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {mode === 'timer' ? 'Timer starten' : 'Eintrag speichern'}
        </button>
      </form>
    </div>
  );
}

// Kunden Tab
function KundenTab({
  kunden,
  onRefresh
}: {
  kunden: Kunde[];
  onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    firmenname: '',
    ansprechperson_vorname: '',
    ansprechperson_nachname: '',
    email: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const createKunde = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/timebook/kunden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setFormData({ firmenname: '', ansprechperson_vorname: '', ansprechperson_nachname: '', email: '' });
        setShowForm(false);
        onRefresh();
      }
    } catch (err) {
      console.error('Fehler:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Kunden ({kunden.length})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Neuer Kunde
        </button>
      </div>

      {showForm && (
        <form onSubmit={createKunde} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              value={formData.firmenname}
              onChange={e => setFormData({ ...formData, firmenname: e.target.value })}
              placeholder="Firmenname"
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="E-Mail"
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
            <input
              type="text"
              value={formData.ansprechperson_vorname}
              onChange={e => setFormData({ ...formData, ansprechperson_vorname: e.target.value })}
              placeholder="Vorname"
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
            <input
              type="text"
              value={formData.ansprechperson_nachname}
              onChange={e => setFormData({ ...formData, ansprechperson_nachname: e.target.value })}
              placeholder="Nachname"
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500"
            >
              <Check className="w-4 h-4" />
              Speichern
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
            >
              <X className="w-4 h-4" />
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {kunden.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Noch keine Kunden angelegt
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {kunden.map(kunde => (
              <div key={kunde.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {kunde.firmenname || `${kunde.ansprechperson_vorname} ${kunde.ansprechperson_nachname}`}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {kunde.kundennummer} {kunde.email && `• ${kunde.email}`}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  kunde.aktiv
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {kunde.aktiv ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Kategorien Tab
function KategorienTab({
  kategorien,
  onRefresh
}: {
  kategorien: Kategorie[];
  onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    bezeichnung: '',
    beschreibung: '',
    standard_stundensatz: '',
    farbe: '#6366f1'
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({ bezeichnung: '', beschreibung: '', standard_stundensatz: '', farbe: '#6366f1' });
    setEditingId(null);
    setShowForm(false);
    setFormError(null);
  };

  const startEdit = (kat: Kategorie) => {
    setFormData({
      bezeichnung: kat.bezeichnung,
      beschreibung: '',
      standard_stundensatz: kat.standard_stundensatz?.toString() || '',
      farbe: kat.farbe || '#6366f1'
    });
    setEditingId(kat.id);
    setShowForm(true);
  };

  const saveKategorie = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.bezeichnung.trim()) {
      setFormError('Bitte eine Bezeichnung eingeben');
      return;
    }

    setSubmitting(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId
        ? { id: editingId, ...formData, standard_stundensatz: formData.standard_stundensatz ? parseFloat(formData.standard_stundensatz) : null }
        : { ...formData, standard_stundensatz: formData.standard_stundensatz ? parseFloat(formData.standard_stundensatz) : null };

      const res = await fetch('/api/timebook/kategorien', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok) {
        resetForm();
        onRefresh();
      } else {
        setFormError(data.error || 'Fehler beim Speichern');
      }
    } catch {
      setFormError('Netzwerkfehler');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteKategorie = async (id: number) => {
    if (!confirm('Kategorie wirklich löschen?')) return;

    try {
      const res = await fetch(`/api/timebook/kategorien?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Fehler:', err);
    }
  };

  const predefinedColors = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#64748b'];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Kategorien ({kategorien.length})
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Neue Kategorie
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={saveKategorie} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">
            {editingId ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
          </h3>

          {formError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bezeichnung <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bezeichnung}
                onChange={e => setFormData({ ...formData, bezeichnung: e.target.value })}
                placeholder="z.B. Entwicklung, Beratung..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Standard-Stundensatz (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.standard_stundensatz}
                onChange={e => setFormData({ ...formData, standard_stundensatz: e.target.value })}
                placeholder="z.B. 85.00"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Farbe
            </label>
            <div className="flex items-center gap-3">
              <div className="flex gap-2 flex-wrap">
                {predefinedColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, farbe: color })}
                    className={`w-8 h-8 rounded-lg transition-all ${
                      formData.farbe === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={formData.farbe}
                onChange={e => setFormData({ ...formData, farbe: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border-0"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Speichern
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <X className="w-4 h-4" />
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {kategorien.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Noch keine Kategorien angelegt</p>
            <p className="text-sm mt-1">Kategorien helfen dir, deine Zeiterfassungen zu organisieren.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {kategorien.map(kat => (
              <div key={kat.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: kat.farbe || '#6366f1' }}
                  >
                    <Tag className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{kat.bezeichnung}</p>
                    {kat.standard_stundensatz && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {Number(kat.standard_stundensatz).toFixed(2)} €/h
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(kat)}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteKategorie(kat.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Einträge Tab
function EintraegeTab({
  eintraege,
  kunden,
  kategorien,
  onRefresh
}: {
  eintraege: Zeiterfassung[];
  kunden: Kunde[];
  kategorien: Kategorie[];
  onRefresh: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    kunde_id: '',
    titel: '',
    beschreibung: '',
    start_datum: '',
    start_zeit: '',
    ende_datum: '',
    ende_zeit: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDauer = (minuten: number | null): string => {
    if (!minuten) return '-';
    const h = Math.floor(minuten / 60);
    const m = minuten % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  const startEdit = (eintrag: Zeiterfassung) => {
    setEditForm({
      kunde_id: eintrag.kunde_id,
      titel: eintrag.titel || '',
      beschreibung: eintrag.beschreibung,
      start_datum: eintrag.start_datum,
      start_zeit: eintrag.start_zeit?.slice(0, 5) || '',
      ende_datum: eintrag.ende_datum || eintrag.start_datum,
      ende_zeit: eintrag.ende_zeit?.slice(0, 5) || ''
    });
    setEditingId(eintrag.id);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setError(null);

    if (!editForm.beschreibung.trim()) {
      setError('Beschreibung ist erforderlich');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/timebook/zeiterfassung/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kunde_id: editForm.kunde_id,
          titel: editForm.titel || null,
          beschreibung: editForm.beschreibung,
          start_datum: editForm.start_datum,
          start_zeit: editForm.start_zeit,
          ende_datum: editForm.ende_zeit ? editForm.ende_datum : null,
          ende_zeit: editForm.ende_zeit || null
        })
      });

      const data = await res.json();

      if (res.ok) {
        setEditingId(null);
        onRefresh();
      } else {
        setError(data.error || 'Fehler beim Speichern');
      }
    } catch {
      setError('Netzwerkfehler');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteEintrag = async (id: string) => {
    if (!confirm('Diesen Zeiteintrag wirklich löschen?')) return;

    try {
      const res = await fetch(`/api/timebook/zeiterfassung/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Fehler beim Löschen');
      }
    } catch {
      alert('Netzwerkfehler');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Letzte Einträge ({eintraege.length})
      </h2>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {eintraege.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Noch keine Zeiterfassungen
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {eintraege.map(eintrag => (
              <div key={eintrag.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                {editingId === eintrag.id ? (
                  /* Edit Form */
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Edit3 className="w-4 h-4" />
                      Eintrag bearbeiten
                    </h3>

                    {error && (
                      <div className="mb-3 p-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Kunde</label>
                        <select
                          value={editForm.kunde_id}
                          onChange={e => setEditForm({ ...editForm, kunde_id: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                        >
                          {kunden.map(k => (
                            <option key={k.id} value={k.id}>
                              {k.firmenname || `${k.ansprechperson_vorname} ${k.ansprechperson_nachname}`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Datum</label>
                        <input
                          type="date"
                          value={editForm.start_datum}
                          onChange={e => setEditForm({ ...editForm, start_datum: e.target.value, ende_datum: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Startzeit</label>
                        <input
                          type="time"
                          value={editForm.start_zeit}
                          onChange={e => setEditForm({ ...editForm, start_zeit: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Endzeit</label>
                        <input
                          type="time"
                          value={editForm.ende_zeit}
                          onChange={e => setEditForm({ ...editForm, ende_zeit: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Titel (optional)</label>
                        <input
                          type="text"
                          value={editForm.titel}
                          onChange={e => setEditForm({ ...editForm, titel: e.target.value })}
                          placeholder="z.B. Meeting, Support..."
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Beschreibung *</label>
                        <input
                          type="text"
                          value={editForm.beschreibung}
                          onChange={e => setEditForm({ ...editForm, beschreibung: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        disabled={submitting}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 text-sm disabled:opacity-50"
                      >
                        {submitting ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Speichern
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                      >
                        <X className="w-4 h-4" />
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Normal View */
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                        onClick={() => setExpandedId(expandedId === eintrag.id ? null : eintrag.id)}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          eintrag.abgeschlossen
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-yellow-100 dark:bg-yellow-900/30'
                        }`}>
                          {eintrag.abgeschlossen ? (
                            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <Timer className="w-5 h-5 text-yellow-600 dark:text-yellow-400 animate-pulse" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {eintrag.titel || eintrag.beschreibung}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {eintrag.kunde_name || eintrag.firmenname} • {new Date(eintrag.start_datum).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatDauer(eintrag.dauer_minuten)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {eintrag.start_zeit?.slice(0, 5)} - {eintrag.ende_zeit?.slice(0, 5) || 'läuft'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(eintrag)}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                            title="Bearbeiten"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteEintrag(eintrag.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedId === eintrag.id && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Beschreibung</p>
                            <p className="text-gray-900 dark:text-white">{eintrag.beschreibung}</p>
                          </div>
                          {eintrag.titel && (
                            <div>
                              <p className="text-gray-500 dark:text-gray-400">Titel</p>
                              <p className="text-gray-900 dark:text-white">{eintrag.titel}</p>
                            </div>
                          )}
                          {eintrag.kategorie_bezeichnung && (
                            <div>
                              <p className="text-gray-500 dark:text-gray-400">Kategorie</p>
                              <p className="text-gray-900 dark:text-white flex items-center gap-2">
                                {eintrag.kategorie_farbe && (
                                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: eintrag.kategorie_farbe }} />
                                )}
                                {eintrag.kategorie_bezeichnung}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Status</p>
                            <p className={eintrag.abgeschlossen ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}>
                              {eintrag.abgeschlossen ? 'Abgeschlossen' : 'Läuft'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Wochenansicht Tab
function WochenansichtTab({
  eintraege,
  onRefresh
}: {
  eintraege: Zeiterfassung[];
  onRefresh: () => void;
}) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Montag als Wochenstart
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();

  const previousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const nextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToToday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  const getEintraegeForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return eintraege.filter(e => e.start_datum === dateStr);
  };

  const getDayTotal = (date: Date): number => {
    const dayEntries = getEintraegeForDay(date);
    return dayEntries.reduce((sum, e) => sum + (e.dauer_minuten || 0), 0);
  };

  const getWeekTotal = (): number => {
    return weekDays.reduce((sum, day) => sum + getDayTotal(day), 0);
  };

  const formatMinutes = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  return (
    <div className="space-y-4">
      {/* Header mit Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <CalendarDays className="w-5 h-5" />
          Wochenansicht
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={previousWeek}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
          >
            Heute
          </button>
          <button
            onClick={nextWeek}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Wochendatum */}
      <div className="text-center text-gray-600 dark:text-gray-400">
        {currentWeekStart.toLocaleDateString('de-DE', { day: '2-digit', month: 'long' })} - {weekDays[6].toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
      </div>

      {/* Wochenübersicht Karten */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, index) => {
          const dayEntries = getEintraegeForDay(day);
          const dayTotal = getDayTotal(day);
          const today = isToday(day);

          return (
            <div
              key={index}
              className={`bg-white dark:bg-gray-800 rounded-xl border p-3 min-h-[120px] ${
                today
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {/* Tag Header */}
              <div className="text-center mb-2">
                <p className={`text-xs font-medium ${today ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {dayNames[index]}
                </p>
                <p className={`text-lg font-bold ${today ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                  {day.getDate()}
                </p>
              </div>

              {/* Einträge */}
              <div className="space-y-1">
                {dayEntries.slice(0, 3).map(entry => (
                  <div
                    key={entry.id}
                    className="text-xs p-1.5 rounded bg-gray-50 dark:bg-gray-700/50 truncate"
                    title={entry.beschreibung}
                  >
                    <span className="font-medium">{formatMinutes(entry.dauer_minuten || 0)}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1 hidden sm:inline">
                      {entry.titel || entry.beschreibung.slice(0, 15)}
                    </span>
                  </div>
                ))}
                {dayEntries.length > 3 && (
                  <p className="text-xs text-gray-400 text-center">+{dayEntries.length - 3} mehr</p>
                )}
              </div>

              {/* Tagessumme */}
              {dayTotal > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-center">
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {formatMinutes(dayTotal)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Wochensumme */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Wochensumme</p>
            <p className="text-3xl font-bold">{formatMinutes(getWeekTotal())}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-80">Stunden</p>
            <p className="text-xl font-semibold">{(getWeekTotal() / 60).toFixed(1)} h</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export Tab
function ExportTab({
  eintraege,
  kunden,
  kategorien
}: {
  eintraege: Zeiterfassung[];
  kunden: Kunde[];
  kategorien: Kategorie[];
}) {
  const [exportRange, setExportRange] = useState<'week' | 'month' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // Erster des Monats
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedKunde, setSelectedKunde] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

  const updateDateRange = (range: 'week' | 'month' | 'year' | 'custom') => {
    setExportRange(range);
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    let start: Date;

    switch (range) {
      case 'week':
        start = new Date(today);
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        return;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end);
  };

  const getFilteredEintraege = () => {
    return eintraege.filter(e => {
      const entryDate = e.start_datum;
      const inRange = entryDate >= startDate && entryDate <= endDate;
      const matchesKunde = !selectedKunde || e.kunde_id === selectedKunde;
      return inRange && matchesKunde && e.abgeschlossen;
    });
  };

  const filteredEintraege = getFilteredEintraege();

  const getTotalMinutes = () => {
    return filteredEintraege.reduce((sum, e) => sum + (e.dauer_minuten || 0), 0);
  };

  const formatMinutes = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  const exportCSV = () => {
    const headers = ['Datum', 'Startzeit', 'Endzeit', 'Dauer (h)', 'Kunde', 'Kategorie', 'Titel', 'Beschreibung'];
    const rows = filteredEintraege.map(e => [
      new Date(e.start_datum).toLocaleDateString('de-DE'),
      e.start_zeit?.slice(0, 5) || '',
      e.ende_zeit?.slice(0, 5) || '',
      e.dauer_stunden?.toFixed(2) || '0',
      e.kunde_name || e.firmenname || '',
      e.kategorie_bezeichnung || '',
      e.titel || '',
      e.beschreibung.replace(/"/g, '""') // Escape quotes
    ]);

    // BOM für Excel UTF-8
    const BOM = '\uFEFF';
    const csvContent = BOM + [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zeiterfassung_${startDate}_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const data = {
      exportiert_am: new Date().toISOString(),
      zeitraum: { von: startDate, bis: endDate },
      gesamt_stunden: (getTotalMinutes() / 60).toFixed(2),
      eintraege: filteredEintraege.map(e => ({
        datum: e.start_datum,
        startzeit: e.start_zeit,
        endzeit: e.ende_zeit,
        dauer_stunden: e.dauer_stunden,
        kunde: e.kunde_name || e.firmenname,
        kategorie: e.kategorie_bezeichnung,
        titel: e.titel,
        beschreibung: e.beschreibung
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zeiterfassung_${startDate}_${endDate}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    if (exportFormat === 'csv') {
      exportCSV();
    } else {
      exportJSON();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Download className="w-5 h-5" />
        Zeiterfassung exportieren
      </h2>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        {/* Zeitraum Schnellauswahl */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Zeitraum
          </label>
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'week', label: 'Letzte 7 Tage' },
              { id: 'month', label: 'Dieser Monat' },
              { id: 'year', label: 'Dieses Jahr' },
              { id: 'custom', label: 'Benutzerdefiniert' }
            ].map(option => (
              <button
                key={option.id}
                onClick={() => updateDateRange(option.id as typeof exportRange)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  exportRange === option.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Datumsfelder */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Von
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setExportRange('custom'); }}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bis
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setExportRange('custom'); }}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Kunde Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Kunde (optional)
          </label>
          <select
            value={selectedKunde}
            onChange={e => setSelectedKunde(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            <option value="">Alle Kunden</option>
            {kunden.map(k => (
              <option key={k.id} value={k.id}>
                {k.firmenname || `${k.ansprechperson_vorname} ${k.ansprechperson_nachname}`}
              </option>
            ))}
          </select>
        </div>

        {/* Export Format */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Format
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setExportFormat('csv')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                exportFormat === 'csv'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              CSV (Excel)
            </button>
            <button
              onClick={() => setExportFormat('json')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                exportFormat === 'json'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              JSON
            </button>
          </div>
        </div>

        {/* Vorschau */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">Vorschau</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{filteredEintraege.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Einträge</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatMinutes(getTotalMinutes())}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Stunden</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{(getTotalMinutes() / 60).toFixed(1)} h</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Dezimal</p>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={filteredEintraege.length === 0}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          {exportFormat === 'csv' ? 'Als CSV exportieren' : 'Als JSON exportieren'}
        </button>

        {filteredEintraege.length === 0 && (
          <p className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
            Keine abgeschlossenen Einträge im ausgewählten Zeitraum
          </p>
        )}
      </div>
    </div>
  );
}
