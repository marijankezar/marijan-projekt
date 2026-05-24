'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactECharts from 'echarts-for-react';
import {
  Zap, Upload, TrendingUp, Calendar,
  ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, Database, X, Search,
} from 'lucide-react';
import Link from 'next/link';

type DataPoint = { label: string; kwh: number; cnt: number };
type GroupMode = '15min' | 'hour' | 'day' | 'month' | 'year';
type Stats = {
  tage: string; gesamt: string; schnitt_15min: string;
  min_15min: string; max_15min: string;
  erster: string | null; letzter: string | null; anzahl: string;
};

const GROUPS: { key: GroupMode; label: string }[] = [
  { key: '15min', label: '15 Min' },
  { key: 'hour',  label: 'Stunde' },
  { key: 'day',   label: 'Tag'    },
  { key: 'month', label: 'Monat'  },
  { key: 'year',  label: 'Jahr'   },
];

const PRESETS: { label: string; months: number }[] = [
  { label: '1T',    months: -1  },
  { label: '7T',    months: -7  },
  { label: '1M',    months: 1   },
  { label: '3M',    months: 3   },
  { label: '6M',    months: 6   },
  { label: '1J',    months: 12  },
  { label: '2J',    months: 24  },
  { label: 'Alles', months: 0   },
];

function todayStr() { return new Date().toISOString().slice(0, 10); }

function getDateRange(months: number): { from: string; to: string } {
  const today = todayStr();
  const to = `${today}T23:45`;
  if (months === 0)  return { from: '2020-01-01T00:00', to };
  if (months === -1) return { from: `${today}T00:00`, to };
  if (months === -7) {
    const d = new Date(); d.setDate(d.getDate() - 6);
    return { from: `${d.toISOString().slice(0, 10)}T00:00`, to };
  }
  const d = new Date(); d.setMonth(d.getMonth() - months);
  return { from: `${d.toISOString().slice(0, 10)}T00:00`, to };
}

function fmtDT(dt: string) {
  // "2023-01-15T10:00" → "15.01.2023 10:00"
  const [date, time] = dt.split('T');
  const [y, m, d] = date.split('-');
  return `${d}.${m}.${y}${time ? ' ' + time : ''}`;
}

function buildOption(data: DataPoint[], group: GroupMode, isDark: boolean) {
  const labels = data.map(d => d.label);
  const values = data.map(d => Number(d.kwh));
  if (!values.length) return {};

  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const textColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const tooltipBg = isDark ? '#1f2937' : '#ffffff';
  const tooltipBd = isDark ? '#374151' : '#e5e7eb';

  const barColors = values.map(v =>
    v > avg * 1.5 ? '#ef4444' : v > avg * 1.15 ? '#f97316' : v < avg * 0.6 ? '#22c55e' : '#3b82f6'
  );

  const labelFmt = (v: string) => {
    if (group === 'month') return v.slice(5) + '/' + v.slice(2, 4);
    if (group === 'year')  return v;
    if (group === 'day')   return v.slice(5);
    return v.slice(11); // hour / 15min → HH:MM
  };

  return {
    backgroundColor: 'transparent',
    animation: true,
    tooltip: {
      trigger: 'axis',
      backgroundColor: tooltipBg, borderColor: tooltipBd, borderWidth: 1,
      textStyle: { color: isDark ? '#f3f4f6' : '#111827', fontSize: 12 },
      formatter: (params: { name: string; value: number }[]) => {
        const p = params[0]; if (!p) return '';
        const diff = avg ? ((p.value - avg) / avg * 100).toFixed(1) : '0';
        const sign  = parseFloat(diff) >= 0 ? '+' : '';
        const color = parseFloat(diff) >= 0 ? '#ef4444' : '#22c55e';
        return `<b>${p.name}</b><br/>${p.value.toFixed(4)} kWh<br/>
          <span style="color:${color}">${sign}${diff}% vs Ø (${avg.toFixed(4)})</span>`;
      },
    },
    grid: { top: 16, right: 16, bottom: 56, left: 70 },
    xAxis: {
      type: 'category', data: labels,
      axisLabel: { color: textColor, fontSize: 10, rotate: labels.length > 60 ? 45 : 0, formatter: labelFmt },
      axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false },
    },
    yAxis: {
      type: 'value', name: 'kWh',
      nameTextStyle: { color: textColor, fontSize: 11 },
      axisLabel: { color: textColor, fontSize: 11, formatter: (v: number) => v.toFixed(3) },
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: gridColor } },
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      {
        type: 'slider', bottom: 2, height: 18,
        borderColor: gridColor,
        backgroundColor: isDark ? '#1f2937' : '#f9fafb',
        fillerColor: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)',
        handleStyle: { color: '#3b82f6' },
        textStyle: { color: textColor, fontSize: 10 },
      },
    ],
    series: [
      {
        type: 'bar',
        data: values.map((v, i) => ({ value: v, itemStyle: { color: barColors[i], borderRadius: [2, 2, 0, 0] } })),
        barMaxWidth: 32,
      },
      {
        type: 'line', data: values.map(() => parseFloat(avg.toFixed(4))),
        symbol: 'none', lineStyle: { color: '#8b5cf6', type: 'dashed', width: 1.5 }, silent: true,
      },
    ],
  };
}

export default function StromPageClient() {
  const router = useRouter();
  const [data,   setData]   = useState<DataPoint[]>([]);
  const [stats,  setStats]  = useState<Stats | null>(null);
  const [group,  setGroup]  = useState<GroupMode>('day');
  const [preset, setPreset] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [isDark,  setIsDark]  = useState(false);

  // Datetime-Range-Picker state
  const [inputFrom,   setInputFrom]   = useState('');
  const [inputTo,     setInputTo]     = useState('');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo,   setAppliedTo]   = useState('');
  const isCustom = !!(appliedFrom && appliedTo);
  // Single-day analysis: both from/to on same calendar day
  const isOneDay = isCustom && appliedFrom.slice(0, 10) === appliedTo.slice(0, 10);

  // Upload state
  const [uploading,      setUploading]      = useState(false);
  const [uploadResult,   setUploadResult]   = useState<{ inserted: number; skipped: number; total: number } | null>(null);
  const [uploadError,    setUploadError]    = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  const load = useCallback(async (from: string, to: string, g: GroupMode) => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/strom?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&group=${g}`);
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json.data ?? []);
      setStats(json.stats ?? null);
    } catch { setError('Daten konnten nicht geladen werden.'); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    if (isCustom) {
      load(appliedFrom, appliedTo, group);
    } else {
      const { from, to } = getDateRange(preset);
      load(from, to, group);
    }
  }, [preset, group, appliedFrom, appliedTo, isCustom, load]);

  const handleApply = () => {
    if (!inputFrom || !inputTo) return;
    if (inputFrom > inputTo) { setError('Von-Zeitpunkt muss vor Bis-Zeitpunkt liegen.'); return; }
    setError('');
    setAppliedFrom(inputFrom);
    setAppliedTo(inputTo);
  };

  const handleReset = () => {
    setInputFrom(''); setInputTo('');
    setAppliedFrom(''); setAppliedTo('');
    setError('');
  };

  const handlePreset = (months: number) => {
    setPreset(months);
    handleReset();
  };

  const openDayDetail = (dateStr: string) => {
    // dateStr ist "YYYY-MM-DD" (aus Top-5 im Tages-Modus)
    const from = `${dateStr}T00:00`;
    const to   = `${dateStr}T23:45`;
    setInputFrom(from); setInputTo(to);
    setAppliedFrom(from); setAppliedTo(to);
    setGroup('15min');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); setUploadResult(null); setUploadError(''); setUploadProgress('');
    setUploadProgress(`Lese Datei (${(file.size / 1024 / 1024).toFixed(1)} MB)…`);
    try {
      const fd = new FormData(); fd.append('file', file);
      setUploadProgress('Importiere in Datenbank… (kann bei großen Dateien 10-30s dauern)');
      const res  = await fetch('/api/strom', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Fehler');
      setUploadResult({ inserted: json.inserted, skipped: json.skipped, total: json.total });
      setUploadProgress('');
      if (isCustom) load(appliedFrom, appliedTo, group);
      else { const { from, to } = getDateRange(preset); load(from, to, group); }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
      setUploadProgress('');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const total   = data.reduce((s, d) => s + Number(d.kwh), 0);
  const avg     = data.length ? total / data.length : 0;
  const maxVal  = data.length ? Math.max(...data.map(d => Number(d.kwh))) : 0;
  const minVal  = data.length ? Math.min(...data.map(d => Number(d.kwh))) : 0;
  const maxItem = data.find(d => Number(d.kwh) === maxVal);
  const minItem = data.find(d => Number(d.kwh) === minVal);

  // Stundensummen (nur bei Einzeltag sinnvoll)
  const hourlyTotals = isOneDay && data.length > 0
    ? Array.from({ length: 24 }, (_, h) => {
        const hStr = h.toString().padStart(2, '0');
        const pts  = data.filter(d => d.label.slice(11, 13) === hStr);
        return { hour: `${hStr}:00`, kwh: pts.reduce((s, d) => s + Number(d.kwh), 0), count: pts.length };
      }).filter(h => h.count > 0)
    : [];
  const dayMaxHour = hourlyTotals.length ? hourlyTotals.reduce((a, b) => a.kwh > b.kwh ? a : b) : null;
  const hourMax    = hourlyTotals.length ? Math.max(...hourlyTotals.map(h => h.kwh)) : 0;

  const hasData    = stats && parseInt(stats.anzahl) > 0;
  const activeGroup = isCustom && group === 'day' && isOneDay ? '15min' : group;
  const maxDT      = `${todayStr()}T23:45`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Stromverbrauch</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {hasData
                    ? `${stats!.erster} – ${stats!.letzter} · ${parseInt(stats!.anzahl).toLocaleString()} Messungen`
                    : 'STW Energieportal · 15-Min Lastprofil'}
                </p>
              </div>
            </div>
            <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-sm">
              <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Gesamt-Stats */}
        {hasData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Gesamt',       value: `${parseFloat(stats!.gesamt).toLocaleString('de-AT', { minimumFractionDigits: 1 })} kWh`, sub: `über ${stats!.tage} Tage`, icon: <Zap className="w-4 h-4" />, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Ø pro Tag',    value: `${(parseFloat(stats!.gesamt) / Math.max(parseInt(stats!.tage), 1)).toFixed(2)} kWh`, sub: `Ø 15min: ${parseFloat(stats!.schnitt_15min).toFixed(4)} kWh`, icon: <Calendar className="w-4 h-4" />, color: 'text-indigo-600 dark:text-indigo-400' },
              { label: 'Max 15min',    value: `${parseFloat(stats!.max_15min).toFixed(4)} kWh`, sub: 'Einzelmessung (gesamt)', icon: <TrendingUp className="w-4 h-4" />, color: 'text-red-500 dark:text-red-400' },
              { label: 'Datenpunkte', value: parseInt(stats!.anzahl).toLocaleString('de-AT'), sub: '15-Min Intervalle', icon: <Database className="w-4 h-4" />, color: 'text-emerald-600 dark:text-emerald-400' },
            ].map(item => (
              <div key={item.label} className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={item.color}>{item.icon}</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                </div>
                <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Aktiver-Zeitraum-Banner (custom range) */}
        {isCustom && (
          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl px-5 py-3 gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  {isOneDay ? `Tagesansicht: ${fmtDT(appliedFrom).slice(0,10)}` : 'Benutzerdefinierter Zeitraum'}
                </p>
                <p className="text-xs text-blue-500 dark:text-blue-400">
                  {fmtDT(appliedFrom)} – {fmtDT(appliedTo)}
                  {data.length > 0 && ` · ${data.length} Datenpunkte`}
                  {total > 0 && ` · ${total.toFixed(3)} kWh`}
                </p>
              </div>
            </div>
            <button onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-all shrink-0">
              <X className="w-3.5 h-3.5" /> Zurücksetzen
            </button>
          </div>
        )}

        {/* Chart-Karte */}
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-6">
          <div className="flex flex-col gap-4 mb-4">

            {/* Obere Zeile: Titel + Auflösung */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Verbrauchsanalyse</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Mausrad = Zoom · Ziehen = Pan ·
                  <span className="text-green-500"> grün</span>=niedrig ·
                  <span className="text-blue-500"> blau</span>=normal ·
                  <span className="text-orange-500"> orange</span>=hoch ·
                  <span className="text-red-500"> rot</span>=sehr hoch
                </p>
              </div>
              <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-700/50 p-0.5 rounded-lg self-start sm:self-auto">
                {GROUPS.map(g => (
                  <button key={g.key} onClick={() => setGroup(g.key)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      activeGroup === g.key
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Presets */}
            <div className="flex gap-1 flex-wrap">
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => handlePreset(p.months)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    !isCustom && preset === p.months
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                  {p.label}
                </button>
              ))}
            </div>

            {/* Datetime-Range-Picker */}
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Von</label>
                <input
                  type="datetime-local"
                  value={inputFrom}
                  max={maxDT}
                  onChange={e => setInputFrom(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/60 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Bis</label>
                <input
                  type="datetime-local"
                  value={inputTo}
                  min={inputFrom || undefined}
                  max={maxDT}
                  onChange={e => setInputTo(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/60 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
              </div>
              <button
                onClick={handleApply}
                disabled={!inputFrom || !inputTo}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed whitespace-nowrap">
                <Search className="w-4 h-4" /> Anwenden
              </button>
              {(inputFrom || inputTo) && (
                <button onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-all whitespace-nowrap">
                  <X className="w-4 h-4" /> Reset
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="h-80 flex items-center justify-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5" /><span>{error}</span>
            </div>
          ) : !hasData ? (
            <div className="h-80 flex flex-col items-center justify-center gap-4 text-gray-400">
              <Zap className="w-16 h-16 opacity-20" />
              <div className="text-center">
                <p className="font-medium text-gray-600 dark:text-gray-300">Noch keine Daten vorhanden</p>
                <p className="text-sm mt-1">CSV-Datei vom STW Energieportal unten hochladen</p>
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-gray-400 text-sm">
              Keine Daten für diesen Zeitraum vorhanden
            </div>
          ) : (
            <ReactECharts option={buildOption(data, activeGroup, isDark)} style={{ height: 380 }} notMerge />
          )}
        </div>

        {/* Tagesanalyse (Einzeltag) */}
        {isOneDay && data.length > 0 && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                Tagesstatistik — {fmtDT(appliedFrom).slice(0, 10)}
              </h3>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Tagesverbrauch',   value: `${total.toFixed(3)} kWh`, color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Messpunkte',        value: `${data.length} × 15 Min` },
                  { label: 'Ø pro 15 Min',      value: `${avg.toFixed(4)} kWh` },
                  { label: 'Stärkste Stunde',   value: dayMaxHour ? `${dayMaxHour.hour} (${dayMaxHour.kwh.toFixed(3)} kWh)` : '–', color: 'text-orange-500' },
                  { label: 'Peak 15min',         value: maxItem ? `${maxVal.toFixed(4)} kWh (${maxItem.label.slice(11)})` : '–', color: 'text-red-500' },
                  { label: 'Minimum 15min',      value: minItem ? `${minVal.toFixed(4)} kWh (${minItem.label.slice(11)})` : '–', color: 'text-green-500' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-start gap-2">
                    <span className="text-gray-500 dark:text-gray-400 shrink-0">{item.label}</span>
                    <span className={`font-medium text-right text-xs ${item.color ?? 'text-gray-800 dark:text-gray-200'}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Stündlicher Verbrauch</h3>
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {hourlyTotals.map(h => {
                  const pct   = hourMax > 0 ? (h.kwh / hourMax) * 100 : 0;
                  const color = h.kwh > hourMax * 0.8 ? '#ef4444' : h.kwh > hourMax * 0.6 ? '#f97316' : h.kwh < hourMax * 0.3 ? '#22c55e' : '#3b82f6';
                  return (
                    <div key={h.hour} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400 w-10 shrink-0 font-mono">{h.hour}</span>
                      <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-4 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                      <span className="font-medium text-gray-700 dark:text-gray-300 w-16 text-right shrink-0">{h.kwh.toFixed(3)} kWh</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Zeitraum-Statistik + Top-5 */}
        {data.length > 0 && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Zeitraum-Statistik</h3>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Zeitraum',     value: `${data[0]?.label ?? '–'} – ${data.at(-1)?.label ?? '–'}` },
                  { label: 'Datenpunkte',  value: `${data.length.toLocaleString('de-AT')} ${GROUPS.find(g => g.key === activeGroup)?.label ?? ''}` },
                  { label: 'Gesamt',       value: `${total.toLocaleString('de-AT', { minimumFractionDigits: 3 })} kWh` },
                  { label: 'Durchschnitt', value: `${avg.toFixed(4)} kWh` },
                  { label: 'Maximum',      value: maxItem ? `${maxVal.toFixed(4)} kWh (${maxItem.label})` : '–', color: 'text-red-500' },
                  { label: 'Minimum',      value: minItem ? `${minVal.toFixed(4)} kWh (${minItem.label})` : '–', color: 'text-green-500' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-start gap-2">
                    <span className="text-gray-500 dark:text-gray-400 shrink-0">{item.label}</span>
                    <span className={`font-medium text-right text-xs ${item.color ?? 'text-gray-800 dark:text-gray-200'}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Top 5 Höchstverbrauch</h3>
              <div className="space-y-2.5">
                {[...data].sort((a, b) => Number(b.kwh) - Number(a.kwh)).slice(0, 5).map((d, i) => (
                  <div key={d.label} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-4 shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs">
                        <button
                          onClick={() => activeGroup === 'day' ? openDayDetail(d.label) : undefined}
                          className={`text-gray-600 dark:text-gray-400 truncate text-left ${activeGroup === 'day' ? 'hover:text-blue-500 cursor-pointer' : 'cursor-default'}`}
                          title={activeGroup === 'day' ? 'Tagesdetails anzeigen' : undefined}>
                          {d.label}
                        </button>
                        <span className="font-bold text-red-500 ml-2 shrink-0">{Number(d.kwh).toFixed(activeGroup === 'day' ? 3 : 4)}</span>
                      </div>
                      <div className="mt-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                        <div className="h-1.5 bg-red-400 rounded-full transition-all" style={{ width: `${(Number(d.kwh) / maxVal) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
                {activeGroup === 'day' && (
                  <p className="text-[10px] text-gray-400 pt-1">Auf einen Tag klicken → Tagesdetails</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CSV Upload */}
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Daten importieren</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            CSV-Export vom STW Energieportal hochladen — Duplikate werden automatisch erkannt und übersprungen.
          </p>
          <label className={`flex flex-col items-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all
            ${uploading ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/10 cursor-wait'
              : 'border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'}`}>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleUpload} disabled={uploading} />
            {uploading ? <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" /> : <Upload className="w-8 h-8 text-gray-400" />}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {uploading ? uploadProgress || 'Wird verarbeitet…' : 'CSV-Datei auswählen'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Format: &quot;DD.MM.YYYY HH:MM&quot;,&quot;0,000&quot; · STW Lastprofil Export</p>
            </div>
          </label>

          {uploadResult && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  Import erfolgreich ({uploadResult.total.toLocaleString()} Zeilen)
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-2 text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{uploadResult.inserted.toLocaleString()}</p>
                  <p className="text-xs text-green-600 dark:text-green-500">Neu gespeichert</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                  <p className="text-2xl font-bold text-gray-500 dark:text-gray-400">{uploadResult.skipped.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Duplikate übersprungen</p>
                </div>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="mt-4 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <span className="text-sm text-red-600 dark:text-red-400">{uploadError}</span>
            </div>
          )}

          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-xl text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p className="font-medium text-gray-600 dark:text-gray-300">So exportierst du die Datei:</p>
            <p>1. <a href="https://energieportal.stw.at/customerportal/index.php?page=loadprofile" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">STW Energieportal → Grafische Darstellung</a></p>
            <p>2. Format <strong>CSV</strong> wählen → <strong>DATEN DOWNLOADEN</strong></p>
            <p>3. Datei hier hochladen</p>
          </div>
        </div>

      </main>
    </div>
  );
}
