'use client';

import { useEffect, useState } from 'react';
import {
  Search, Calendar, Building2, Clock, RefreshCw, AlertCircle,
  Download, Trash2, Edit3, X, Check, ChevronDown, ChevronUp,
  TrendingUp, CalendarDays, Plus
} from 'lucide-react';
import ZeiterfassungForm, { ZeiterfassungData } from './ZeiterfassungForm';

export interface Stundenbuchung {
  id: number;
  id_person: number;
  id_baustelle: number;
  timestamp: string;
  datum: string;
  stunden: number | null;
  baustelle: string;
  platzhalter_text: string | null;
  platzhalter_int: number | null;
  platzhalter_double: number | null;
}

interface EditingEntry {
  id: number;
  datum: string;
  stunden: string;
  zeit_von: string;
  zeit_bis: string;
  baustelle: string;
  bemerkung: string;
}

export default function StundenbuchungenList() {
  const [buchungen, setBuchungen] = useState<Stundenbuchung[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editingEntry, setEditingEntry] = useState<EditingEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showStats, setShowStats] = useState(true);
  const [groupByWeek, setGroupByWeek] = useState(false);
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);

  const fetchBuchungen = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stundenbuchungen');
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      const data = await res.json();

      if (Array.isArray(data)) {
        setBuchungen(data);
      } else if (data.error) {
        let errorText = data.error;
        if (data.details) {
          errorText += `: ${data.details}`;
        }
        setError(errorText);
        setBuchungen([]);
      } else {
        setError('Unerwartetes Datenformat');
        setBuchungen([]);
      }
    } catch (err) {
      console.error('Fehler beim Laden:', err);
      setError('Fehler beim Laden der Daten');
      setBuchungen([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuchungen();
  }, []);

  // Gefilterte Buchungen
  const filteredBuchungen = buchungen.filter(b => {
    // Text-Suche
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        b.baustelle?.toLowerCase().includes(search) ||
        b.platzhalter_text?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }

    // Datum Von-Filter
    if (dateFrom) {
      const buchungsDatum = new Date(b.datum);
      const vonDatum = new Date(dateFrom);
      if (buchungsDatum < vonDatum) return false;
    }

    // Datum Bis-Filter
    if (dateTo) {
      const buchungsDatum = new Date(b.datum);
      const bisDatum = new Date(dateTo);
      bisDatum.setHours(23, 59, 59, 999);
      if (buchungsDatum > bisDatum) return false;
    }

    return true;
  });

  // Sortiert nach Datum (neueste zuerst)
  const sortedBuchungen = [...filteredBuchungen].sort((a, b) => {
    return new Date(b.datum).getTime() - new Date(a.datum).getTime();
  });

  const totalStunden = sortedBuchungen.reduce((sum, b) => sum + (b.stunden || 0), 0);

  // Statistiken berechnen
  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const now = new Date();
  const currentWeek = getWeekNumber(now);
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const stundenDieseWoche = buchungen.filter(b => {
    const d = new Date(b.datum);
    return getWeekNumber(d) === currentWeek && d.getFullYear() === currentYear;
  }).reduce((sum, b) => sum + (b.stunden || 0), 0);

  const stundenDiesenMonat = buchungen.filter(b => {
    const d = new Date(b.datum);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((sum, b) => sum + (b.stunden || 0), 0);

  // Nach Wochen gruppieren
  const groupedByWeek = sortedBuchungen.reduce((acc, b) => {
    const d = new Date(b.datum);
    const week = getWeekNumber(d);
    const year = d.getFullYear();
    const key = `${year}-KW${week.toString().padStart(2, '0')}`;
    if (!acc[key]) {
      acc[key] = { entries: [], total: 0 };
    }
    acc[key].entries.push(b);
    acc[key].total += b.stunden || 0;
    return acc;
  }, {} as Record<string, { entries: Stundenbuchung[], total: number }>);

  // CSV Export
  const exportToCSV = () => {
    const headers = ['Datum', 'Baustelle', 'Stunden', 'Bemerkung'];
    const rows = sortedBuchungen.map(b => [
      new Date(b.datum).toLocaleDateString('de-DE'),
      b.baustelle || '',
      b.stunden?.toString() || '',
      b.platzhalter_text || ''
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stundenbuchungen_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Hilfsfunktion: Stunden aus Zeitbereich berechnen
  const calculateHoursFromTime = (zeitVon: string, zeitBis: string): string => {
    if (!zeitVon || !zeitBis) return '';
    const [vonH, vonM] = zeitVon.split(':').map(Number);
    const [bisH, bisM] = zeitBis.split(':').map(Number);
    const vonMinutes = vonH * 60 + vonM;
    const bisMinutes = bisH * 60 + bisM;
    const diffMinutes = bisMinutes - vonMinutes;
    if (diffMinutes <= 0) return '';
    const hours = diffMinutes / 60;
    return hours.toFixed(2);
  };

  // Eintrag bearbeiten
  const startEdit = (b: Stundenbuchung) => {
    setEditingEntry({
      id: b.id,
      datum: b.datum.split('T')[0],
      stunden: b.stunden?.toString() || '',
      zeit_von: '',
      zeit_bis: '',
      baustelle: b.baustelle || '',
      bemerkung: b.platzhalter_text || ''
    });
    setDeleteConfirm(null);
  };

  const saveEdit = async () => {
    if (!editingEntry) return;

    try {
      const res = await fetch('/api/stundenbuchungen', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingEntry)
      });

      if (!res.ok) {
        const data = await res.json();
        let errorText = data.error || 'Fehler beim Speichern';
        if (data.details) {
          errorText += `: ${data.details}`;
        }
        throw new Error(errorText);
      }

      setEditingEntry(null);
      fetchBuchungen();
    } catch (err) {
      console.error('Fehler:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    }
  };

  // Neuen Eintrag speichern (über ZeiterfassungForm)
  const saveNewEntry = async (data: ZeiterfassungData) => {
    const res = await fetch('/api/stundenbuchungen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Fehler beim Speichern');
    }

    setShowNewEntryForm(false);
    fetchBuchungen();
  };

  // Eintrag löschen
  const deleteEntry = async (id: number) => {
    try {
      const res = await fetch(`/api/stundenbuchungen?id=${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const data = await res.json();
        let errorText = data.error || 'Fehler beim Löschen';
        if (data.details) {
          errorText += `: ${data.details}`;
        }
        throw new Error(errorText);
      }

      setDeleteConfirm(null);
      fetchBuchungen();
    } catch (err) {
      console.error('Fehler:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen');
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700/50">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400">Lade Daten...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-8 shadow-sm border border-red-200 dark:border-red-700/50">
        <div className="flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          <button
            onClick={fetchBuchungen}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Neue Zeiterfassung Button & Formular */}
      {showNewEntryForm ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50">
          <ZeiterfassungForm
            onSave={saveNewEntry}
            onCancel={() => setShowNewEntryForm(false)}
            maxDauerStunden={16}
            erlaubeZukunft={false}
          />
        </div>
      ) : (
        <button
          onClick={() => setShowNewEntryForm(true)}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl shadow-lg shadow-indigo-500/25 transition-all font-medium"
        >
          <Plus className="w-5 h-5" />
          Neue Zeiterfassung
        </button>
      )}

      {/* Statistik-Karten */}
      {showStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <CalendarDays className="w-4 h-4" />
              Diese Woche
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stundenDieseWoche.toFixed(1)} h</p>
          </div>
          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              Dieser Monat
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stundenDiesenMonat.toFixed(1)} h</p>
          </div>
          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <Clock className="w-4 h-4" />
              Ø pro Tag
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {buchungen.length > 0 ? (buchungen.reduce((s, b) => s + (b.stunden || 0), 0) / new Set(buchungen.map(b => b.datum.split('T')[0])).size).toFixed(1) : '0'} h
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <Building2 className="w-4 h-4" />
              Baustellen
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {new Set(buchungen.map(b => b.baustelle)).size}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700/50">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Baustelle suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setGroupByWeek(!groupByWeek)}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                  groupByWeek
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span className="hidden sm:inline">Wochen</span>
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={fetchBuchungen}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">Von:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">Bis:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {sortedBuchungen.length} {sortedBuchungen.length !== buchungen.length ? `von ${buchungen.length} ` : ''}Einträge
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-green-600 dark:text-green-400 font-medium">{totalStunden.toFixed(1)} Stunden{(searchTerm || dateFrom || dateTo) ? ' (gefiltert)' : ' gesamt'}</span>
            </div>
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center gap-1 px-3 py-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              {showStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>Statistiken {showStats ? 'ausblenden' : 'anzeigen'}</span>
            </button>
          </div>
        </div>

        {/* Einträge Liste */}
        {sortedBuchungen.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Keine Einträge gefunden</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {(searchTerm || dateFrom || dateTo) ? 'Keine Einträge für die gewählten Filter gefunden.' : 'Es wurden noch keine Stunden erfasst.'}
            </p>
          </div>
        ) : groupByWeek ? (
          // Gruppierte Ansicht nach Wochen
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {Object.entries(groupedByWeek).map(([weekKey, { entries, total }]) => (
              <div key={weekKey}>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/30 flex justify-between items-center">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{weekKey}</span>
                  <span className="px-3 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold">
                    {total.toFixed(1)} h
                  </span>
                </div>
                {entries.map((b) => renderEntry(b))}
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {sortedBuchungen.map((b) => renderEntry(b))}
          </div>
        )}
      </div>
    </div>
  );

  function renderEntry(b: Stundenbuchung) {
    const isEditing = editingEntry?.id === b.id;
    const isDeleting = deleteConfirm === b.id;

    return (
      <div
        key={b.id}
        className={`p-4 transition-colors ${isEditing ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-900/30'}`}
      >
        {isEditing ? (
          // Edit Mode
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <input
                type="date"
                value={editingEntry.datum}
                onChange={(e) => setEditingEntry({ ...editingEntry, datum: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                value={editingEntry.baustelle}
                onChange={(e) => setEditingEntry({ ...editingEntry, baustelle: e.target.value })}
                placeholder="Baustelle"
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:col-span-3"
              />
            </div>
            {/* Zeit von/bis Zeile */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Zeit von:</label>
                <input
                  type="time"
                  value={editingEntry.zeit_von}
                  onChange={(e) => {
                    const newZeitVon = e.target.value;
                    const calculatedHours = calculateHoursFromTime(newZeitVon, editingEntry.zeit_bis);
                    setEditingEntry({
                      ...editingEntry,
                      zeit_von: newZeitVon,
                      stunden: calculatedHours || editingEntry.stunden
                    });
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Zeit bis:</label>
                <input
                  type="time"
                  value={editingEntry.zeit_bis}
                  onChange={(e) => {
                    const newZeitBis = e.target.value;
                    const calculatedHours = calculateHoursFromTime(editingEntry.zeit_von, newZeitBis);
                    setEditingEntry({
                      ...editingEntry,
                      zeit_bis: newZeitBis,
                      stunden: calculatedHours || editingEntry.stunden
                    });
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <label className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Stunden:</label>
                <input
                  type="number"
                  value={editingEntry.stunden}
                  onChange={(e) => setEditingEntry({ ...editingEntry, stunden: e.target.value })}
                  step="0.25"
                  min="0"
                  max="24"
                  placeholder="Stunden"
                  className="w-24 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <span className="text-sm text-gray-400 dark:text-gray-500">
                  {editingEntry.zeit_von && editingEntry.zeit_bis ? '(berechnet)' : '(manuell)'}
                </span>
              </div>
            </div>
            <input
              type="text"
              value={editingEntry.bemerkung}
              onChange={(e) => setEditingEntry({ ...editingEntry, bemerkung: e.target.value })}
              placeholder="Bemerkung"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
              >
                <Check className="w-4 h-4" />
                Speichern
              </button>
              <button
                onClick={() => setEditingEntry(null)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          // View Mode
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">
                  {b.baustelle || 'Unbekannte Baustelle'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(b.datum).toLocaleDateString('de-DE', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </p>
                {b.platzhalter_text && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 truncate">
                    {b.platzhalter_text}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-4 py-2 rounded-xl text-lg font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                {typeof b.stunden === 'number' ? `${b.stunden.toFixed(1)} h` : '-'}
              </span>

              {isDeleting ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => deleteEntry(b.id)}
                    className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    title="Löschen bestätigen"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Abbrechen"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(b)}
                    className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Bearbeiten"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setDeleteConfirm(b.id); setEditingEntry(null); }}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}
