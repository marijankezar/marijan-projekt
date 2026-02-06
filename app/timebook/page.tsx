'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Clock, Play, Square, Users, FileText, BarChart3, Plus,
  Calendar, Building2, RefreshCw, ChevronDown, ChevronUp,
  Timer, TrendingUp, AlertCircle, Check, X, Edit3, Trash2,
  StopCircle, PlayCircle, LogOut, User, Tag, Palette, Save
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

type ActiveTab = 'dashboard' | 'zeiterfassung' | 'kunden' | 'eintraege' | 'kategorien';

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

          <div className="flex items-center gap-3">
            {/* User Info */}
            {currentUser && (
              <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
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
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Aktualisieren"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Aktualisieren</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
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
            { id: 'kunden', label: 'Kunden', icon: Users },
            { id: 'kategorien', label: 'Kategorien', icon: Tag },
            { id: 'eintraege', label: 'Einträge', icon: FileText }
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

        {/* Kategorien Multi-Select */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Kategorien {kategorien.length === 0 && <span className="text-gray-400 font-normal">(keine vorhanden - erstelle welche im Tab &quot;Kategorien&quot;)</span>}
          </label>
          {kategorien.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {kategorien.map(k => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => toggleKategorie(k.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    formData.kategorie_ids.includes(k.id)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {k.farbe && (
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: k.farbe }}
                    />
                  )}
                  {k.bezeichnung}
                  {formData.kategorie_ids.includes(k.id) && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Noch keine Kategorien vorhanden.
            </p>
          )}
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
                        {kat.standard_stundensatz.toFixed(2)} €/h
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
  const formatDauer = (minuten: number | null): string => {
    if (!minuten) return '-';
    const h = Math.floor(minuten / 60);
    const m = minuten % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
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
              <div key={eintrag.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
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
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatDauer(eintrag.dauer_minuten)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {eintrag.start_zeit} - {eintrag.ende_zeit || 'läuft'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
