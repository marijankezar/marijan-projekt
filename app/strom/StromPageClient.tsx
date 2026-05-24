'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactECharts from 'echarts-for-react';
import { Zap, Upload, TrendingUp, TrendingDown, Calendar, ArrowLeft, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

type DataPoint  = { label: string; kwh: number; tage: number };
type GroupMode  = 'day' | 'month' | 'year';

type Stats = {
  anzahl: string; gesamt: string; schnitt: string;
  min: string; max: string; erster: string; letzter: string;
};

const PRESETS: { label: string; months: number }[] = [
  { label: '1M', months: 1 },
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '1J', months: 12 },
  { label: '2J', months: 24 },
  { label: 'Alles', months: 0 },
];

function addMonths(date: Date, n: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() - n);
  return d.toISOString().split('T')[0];
}

function buildOption(data: DataPoint[], group: GroupMode, isDark: boolean) {
  const labels = data.map(d => d.label);
  const values = data.map(d => d.kwh);
  const avg    = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

  const textColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const tooltipBg = isDark ? '#1f2937' : '#ffffff';
  const tooltipBd = isDark ? '#374151' : '#e5e7eb';

  // Farbe pro Bar: über Durchschnitt = orange/rot, darunter = blau/grün
  const barColors = values.map(v =>
    v > avg * 1.3 ? '#ef4444'
    : v > avg     ? '#f97316'
    : v < avg * 0.7 ? '#22c55e'
    : '#3b82f6'
  );

  return {
    backgroundColor: 'transparent',
    animation: true,
    tooltip: {
      trigger: 'axis',
      backgroundColor: tooltipBg,
      borderColor: tooltipBd,
      borderWidth: 1,
      textStyle: { color: isDark ? '#f3f4f6' : '#111827', fontSize: 12 },
      formatter: (params: { name: string; value: number }[]) => {
        const p = params[0];
        if (!p) return '';
        const diff = ((p.value - avg) / avg * 100).toFixed(1);
        const sign = parseFloat(diff) >= 0 ? '+' : '';
        return `<b>${p.name}</b><br/>
          ${p.value.toFixed(3)} kWh<br/>
          <span style="color:${parseFloat(diff)>=0?'#ef4444':'#22c55e'}">${sign}${diff}% vs Ø</span>`;
      },
    },
    grid: { top: 20, right: 16, bottom: 60, left: 64 },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: {
        color: textColor, fontSize: 11,
        rotate: group === 'day' && labels.length > 60 ? 45 : 0,
        formatter: (v: string) => {
          if (group === 'month') return v.slice(5) + '/' + v.slice(2, 4);
          if (group === 'year')  return v;
          return v.slice(5);
        },
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: 'kWh',
      nameTextStyle: { color: textColor, fontSize: 11 },
      axisLabel: { color: textColor, fontSize: 11, formatter: (v: number) => v.toFixed(1) },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: gridColor } },
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      {
        type: 'slider', bottom: 4, height: 18,
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
        data: values.map((v, i) => ({ value: v, itemStyle: { color: barColors[i], borderRadius: [3, 3, 0, 0] } })),
        barMaxWidth: 40,
      },
      {
        type: 'line',
        data: values.map(() => parseFloat(avg.toFixed(3))),
        symbol: 'none',
        lineStyle: { color: '#8b5cf6', type: 'dashed', width: 1.5 },
        tooltip: { show: false },
        silent: true,
      },
    ],
  };
}

export default function StromPageClient() {
  const router = useRouter();
  const [data,    setData]    = useState<DataPoint[]>([]);
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [group,   setGroup]   = useState<GroupMode>('month');
  const [preset,  setPreset]  = useState(12);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [isDark,  setIsDark]  = useState(false);

  // Upload state
  const [uploading,    setUploading]    = useState(false);
  const [uploadResult, setUploadResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const [uploadError,  setUploadError]  = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  const load = useCallback(async (months: number, g: GroupMode) => {
    setLoading(true); setError('');
    try {
      const today = new Date();
      const from  = months > 0 ? addMonths(today, months) : '2000-01-01';
      const to    = today.toISOString().split('T')[0];
      const res   = await fetch(`/api/strom?from=${from}&to=${to}&group=${g}`);
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json.data ?? []);
      setStats(json.stats ?? null);
    } catch { setError('Daten konnten nicht geladen werden.'); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { load(preset, group); }, [preset, group, load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setUploadResult(null); setUploadError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/strom', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Fehler');
      setUploadResult({ inserted: json.inserted, skipped: json.skipped });
      load(preset, group);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const avg   = data.length ? data.reduce((s, d) => s + d.kwh, 0) / data.length : 0;
  const total = data.reduce((s, d) => s + d.kwh, 0);
  const max   = data.length ? Math.max(...data.map(d => d.kwh)) : 0;
  const min   = data.length ? Math.min(...data.map(d => d.kwh)) : 0;
  const maxDay = data.find(d => d.kwh === max);
  const minDay = data.find(d => d.kwh === min);

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
                  {stats?.erster && stats?.letzter
                    ? `${stats.erster} – ${stats.letzter}`
                    : 'STW Energieportal · kezar.at'}
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

        {/* Stats-Karten */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Gesamt (DB)',   value: `${parseFloat(stats.gesamt).toLocaleString('de-AT', { minimumFractionDigits: 1 })} kWh`, icon: <Zap className="w-4 h-4" />, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Ø pro Tag',     value: `${parseFloat(stats.schnitt).toFixed(3)} kWh`, icon: <Calendar className="w-4 h-4" />, color: 'text-indigo-600 dark:text-indigo-400' },
              { label: 'Maximum',       value: `${parseFloat(stats.max).toFixed(3)} kWh`, icon: <TrendingUp className="w-4 h-4" />, color: 'text-red-500 dark:text-red-400' },
              { label: 'Minimum',       value: `${parseFloat(stats.min).toFixed(3)} kWh`, icon: <TrendingDown className="w-4 h-4" />, color: 'text-green-500 dark:text-green-400' },
            ].map(item => (
              <div key={item.label} className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={item.color}>{item.icon}</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                </div>
                <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Verbrauchsanalyse</h2>
              <p className="text-xs text-gray-400 mt-0.5">Scrollen zum Zoomen · Farbe: blau=normal, orange=hoch, rot=sehr hoch, grün=niedrig</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {/* Gruppierung */}
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-700/50 p-0.5 rounded-lg">
                {(['day', 'month', 'year'] as GroupMode[]).map(g => (
                  <button key={g} onClick={() => setGroup(g)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                      group === g
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'}`}>
                    {g === 'day' ? 'Tag' : g === 'month' ? 'Monat' : 'Jahr'}
                  </button>
                ))}
              </div>
              {/* Zeitraum-Presets */}
              <div className="flex gap-1">
                {PRESETS.map(p => (
                  <button key={p.label} onClick={() => setPreset(p.months)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      preset === p.months
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
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
          ) : data.length === 0 ? (
            <div className="h-80 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Zap className="w-12 h-12 opacity-30" />
              <p className="text-sm">Keine Daten vorhanden — CSV-Datei hochladen</p>
            </div>
          ) : (
            <>
              <ReactECharts
                option={buildOption(data, group, isDark)}
                style={{ height: 380 }}
                notMerge
              />
              {/* Legende */}
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400 justify-center">
                {[
                  { color: 'bg-green-500', label: 'Niedrig (< 70% Ø)' },
                  { color: 'bg-blue-500',  label: 'Normal' },
                  { color: 'bg-orange-500',label: 'Hoch (> Ø)' },
                  { color: 'bg-red-500',   label: 'Sehr hoch (> 130% Ø)' },
                  { color: 'bg-violet-500',label: '— Durchschnitt' },
                ].map(l => (
                  <span key={l.label} className="flex items-center gap-1.5">
                    <span className={`inline-block w-3 h-3 rounded-sm ${l.color}`} />
                    {l.label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Zeitraum-Übersicht */}
        {data.length > 0 && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Zeitraum-Statistik</h3>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Zeitraum',      value: `${data[0]?.label} – ${data.at(-1)?.label}` },
                  { label: 'Datenpunkte',   value: `${data.length} ${group === 'day' ? 'Tage' : group === 'month' ? 'Monate' : 'Jahre'}` },
                  { label: 'Gesamt',        value: `${total.toLocaleString('de-AT', { minimumFractionDigits: 3 })} kWh` },
                  { label: 'Durchschnitt',  value: `${avg.toFixed(3)} kWh / ${group === 'day' ? 'Tag' : group === 'month' ? 'Monat' : 'Jahr'}` },
                  { label: 'Hochverbrauch', value: maxDay ? `${maxDay.kwh.toFixed(3)} kWh am ${maxDay.label}` : '–', color: 'text-red-500' },
                  { label: 'Niedrigverbrauch', value: minDay ? `${minDay.kwh.toFixed(3)} kWh am ${minDay.label}` : '–', color: 'text-green-500' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                    <span className={`font-medium text-right ${item.color ?? 'text-gray-800 dark:text-gray-200'}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 5 Verbrauchstage */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                Top 5 Höchstverbrauch
              </h3>
              <div className="space-y-2">
                {[...data].sort((a, b) => b.kwh - a.kwh).slice(0, 5).map((d, i) => (
                  <div key={d.label} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-4">#{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">{d.label}</span>
                        <span className="font-bold text-red-500">{d.kwh.toFixed(3)} kWh</span>
                      </div>
                      <div className="mt-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                        <div className="h-1.5 bg-red-400 rounded-full" style={{ width: `${(d.kwh / max) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CSV Upload */}
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">CSV Daten importieren</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            STW Energieportal CSV-Export hochladen — Duplikate werden automatisch übersprungen.
          </p>

          <label className={`flex flex-col items-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all
            ${uploading
              ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/10 opacity-60'
              : 'border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'}`}>
            <input ref={fileRef} type="file" accept=".csv,.xlsx" className="hidden"
              onChange={handleUpload} disabled={uploading} />
            {uploading
              ? <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              : <Upload className="w-8 h-8 text-gray-400" />}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {uploading ? 'Wird importiert…' : 'CSV-Datei auswählen oder hierher ziehen'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Format: Datum, kWh (STW Export)</p>
            </div>
          </label>

          {uploadResult && (
            <div className="mt-4 flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <div className="text-sm">
                <span className="font-semibold text-green-700 dark:text-green-400">Import erfolgreich: </span>
                <span className="text-green-600 dark:text-green-400">{uploadResult.inserted} neue Einträge gespeichert</span>
                {uploadResult.skipped > 0 && (
                  <span className="text-gray-500 dark:text-gray-400"> · {uploadResult.skipped} Duplikate übersprungen</span>
                )}
              </div>
            </div>
          )}

          {uploadError && (
            <div className="mt-4 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <span className="text-sm text-red-600 dark:text-red-400">{uploadError}</span>
            </div>
          )}

          <p className="text-xs text-gray-400 dark:text-gray-600 mt-4 text-center">
            Täglich automatischer Download um 06:00 Uhr via Cron-Job · Datenquelle: STW Energieportal
          </p>
        </div>
      </main>
    </div>
  );
}
