'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactECharts from 'echarts-for-react';
import {
  Zap, Upload, TrendingUp, TrendingDown, Calendar,
  ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, Database,
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
  { key: '15min',  label: '15 Min' },
  { key: 'hour',   label: 'Stunde' },
  { key: 'day',    label: 'Tag'    },
  { key: 'month',  label: 'Monat'  },
  { key: 'year',   label: 'Jahr'   },
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

function getDateRange(months: number): { from: string; to: string } {
  const today = new Date();
  const to = today.toISOString().split('T')[0];
  if (months === 0) return { from: '2020-01-01', to };
  if (months === -1) return { from: to, to };   // heute
  if (months === -7) {                           // letzte 7 Tage
    const d = new Date(today); d.setDate(d.getDate() - 6);
    return { from: d.toISOString().split('T')[0], to };
  }
  const d = new Date(today); d.setMonth(d.getMonth() - months);
  return { from: d.toISOString().split('T')[0], to };
}

function buildOption(data: DataPoint[], group: GroupMode, isDark: boolean) {
  const labels = data.map(d => d.label);
  const values = data.map(d => d.kwh);
  if (!values.length) return {};

  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const textColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const tooltipBg = isDark ? '#1f2937' : '#ffffff';
  const tooltipBd = isDark ? '#374151' : '#e5e7eb';

  const barColors = values.map(v =>
    v > avg * 1.5 ? '#ef4444'
    : v > avg * 1.15 ? '#f97316'
    : v < avg * 0.6 ? '#22c55e'
    : '#3b82f6'
  );

  const unit = group === '15min' || group === 'hour' ? 'kWh' : 'kWh';
  const labelFmt = (v: string) => {
    if (group === 'month') return v.slice(5) + '/' + v.slice(2, 4);
    if (group === 'year')  return v;
    if (group === 'day')   return v.slice(5);
    if (group === 'hour' || group === '15min') return v.slice(11);
    return v;
  };

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
        const diff = avg ? ((p.value - avg) / avg * 100).toFixed(1) : '0';
        const sign = parseFloat(diff) >= 0 ? '+' : '';
        const color = parseFloat(diff) >= 0 ? '#ef4444' : '#22c55e';
        return `<b>${p.name}</b><br/>${p.value.toFixed(4)} ${unit}<br/>
          <span style="color:${color}">${sign}${diff}% vs Ø (${avg.toFixed(4)})</span>`;
      },
    },
    grid: { top: 16, right: 16, bottom: 56, left: 70 },
    xAxis: {
      type: 'category', data: labels,
      axisLabel: {
        color: textColor, fontSize: 10,
        rotate: labels.length > 60 ? 45 : 0,
        formatter: labelFmt,
      },
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
        data: values.map((v, i) => ({
          value: v,
          itemStyle: { color: barColors[i], borderRadius: [2, 2, 0, 0] },
        })),
        barMaxWidth: 32,
      },
      {
        type: 'line', data: values.map(() => parseFloat(avg.toFixed(4))),
        symbol: 'none',
        lineStyle: { color: '#8b5cf6', type: 'dashed', width: 1.5 },
        silent: true,
      },
    ],
  };
}

export default function StromPageClient() {
  const router = useRouter();
  const [data,    setData]    = useState<DataPoint[]>([]);
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [group,   setGroup]   = useState<GroupMode>('day');
  const [preset,  setPreset]  = useState(12);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [isDark,  setIsDark]  = useState(false);

  const [uploading,    setUploading]    = useState(false);
  const [uploadResult, setUploadResult] = useState<{ inserted: number; skipped: number; total: number } | null>(null);
  const [uploadError,  setUploadError]  = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
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
      const { from, to } = getDateRange(months);
      const res = await fetch(`/api/strom?from=${from}&to=${to}&group=${g}`);
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
    setUploading(true); setUploadResult(null); setUploadError(''); setUploadProgress('');

    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    setUploadProgress(`Lese Datei (${sizeMB} MB)…`);

    try {
      const fd = new FormData();
      fd.append('file', file);
      setUploadProgress(`Importiere in Datenbank… (kann bei großen Dateien 10-30s dauern)`);
      const res  = await fetch('/api/strom', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Fehler');
      setUploadResult({ inserted: json.inserted, skipped: json.skipped, total: json.total });
      setUploadProgress('');
      load(preset, group);
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
  const maxItem = data.find(d => d.kwh === maxVal);
  const minItem = data.find(d => d.kwh === minVal);

  const hasData = stats && parseInt(stats.anzahl) > 0;

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
              {
                label: 'Gesamt',
                value: `${parseFloat(stats!.gesamt).toLocaleString('de-AT', { minimumFractionDigits: 1 })} kWh`,
                sub: `über ${stats!.tage} Tage`,
                icon: <Zap className="w-4 h-4" />, color: 'text-blue-600 dark:text-blue-400',
              },
              {
                label: 'Ø pro Tag',
                value: `${(parseFloat(stats!.gesamt) / Math.max(parseInt(stats!.tage), 1)).toFixed(2)} kWh`,
                sub: `Ø 15min: ${parseFloat(stats!.schnitt_15min).toFixed(4)} kWh`,
                icon: <Calendar className="w-4 h-4" />, color: 'text-indigo-600 dark:text-indigo-400',
              },
              {
                label: 'Max 15min',
                value: `${parseFloat(stats!.max_15min).toFixed(4)} kWh`,
                sub: 'Einzelmessung',
                icon: <TrendingUp className="w-4 h-4" />, color: 'text-red-500 dark:text-red-400',
              },
              {
                label: 'Datenpunkte',
                value: parseInt(stats!.anzahl).toLocaleString('de-AT'),
                sub: '15-Min Intervalle',
                icon: <Database className="w-4 h-4" />, color: 'text-emerald-600 dark:text-emerald-400',
              },
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

        {/* Chart */}
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
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
            <div className="flex flex-wrap gap-2 items-center">
              {/* Auflösung */}
              <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-700/50 p-0.5 rounded-lg">
                {GROUPS.map(g => (
                  <button key={g.key} onClick={() => setGroup(g.key)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      group === g.key
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                    {g.label}
                  </button>
                ))}
              </div>
              {/* Zeitraum */}
              <div className="flex gap-0.5 flex-wrap">
                {PRESETS.map(p => (
                  <button key={p.label} onClick={() => setPreset(p.months)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
              Keine Daten für diesen Zeitraum
            </div>
          ) : (
            <ReactECharts
              option={buildOption(data, group, isDark)}
              style={{ height: 380 }}
              notMerge
            />
          )}
        </div>

        {/* Zeitraum-Statistik + Top-5 */}
        {data.length > 0 && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Zeitraum-Statistik</h3>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Zeitraum',      value: `${data[0]?.label ?? '–'} – ${data.at(-1)?.label ?? '–'}` },
                  { label: 'Datenpunkte',   value: `${data.length.toLocaleString('de-AT')} ${GROUPS.find(g => g.key === group)?.label ?? ''}` },
                  { label: 'Gesamt',        value: `${total.toLocaleString('de-AT', { minimumFractionDigits: 3 })} kWh` },
                  { label: 'Durchschnitt',  value: `${avg.toFixed(4)} kWh` },
                  { label: 'Maximum',       value: maxItem ? `${maxVal.toFixed(4)} kWh (${maxItem.label})` : '–', color: 'text-red-500' },
                  { label: 'Minimum',       value: minItem ? `${minVal.toFixed(4)} kWh (${minItem.label})` : '–', color: 'text-green-500' },
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
                {[...data].sort((a, b) => b.kwh - a.kwh).slice(0, 5).map((d, i) => (
                  <div key={d.label} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-4 shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400 truncate">{d.label}</span>
                        <span className="font-bold text-red-500 ml-2 shrink-0">{d.kwh.toFixed(4)}</span>
                      </div>
                      <div className="mt-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                        <div className="h-1.5 bg-red-400 rounded-full transition-all"
                          style={{ width: `${(d.kwh / maxVal) * 100}%` }} />
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
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Daten importieren</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            CSV-Export vom STW Energieportal hochladen — Duplikate werden automatisch erkannt und übersprungen.
            Große Dateien (3 Jahre ≈ 100.000 Zeilen) werden unterstützt.
          </p>

          <label className={`flex flex-col items-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all
            ${uploading
              ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/10 cursor-wait'
              : 'border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'}`}>
            <input ref={fileRef} type="file" accept=".csv" className="hidden"
              onChange={handleUpload} disabled={uploading} />
            {uploading
              ? <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              : <Upload className="w-8 h-8 text-gray-400" />}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {uploading ? uploadProgress || 'Wird verarbeitet…' : 'CSV-Datei auswählen'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Format: &quot;DD.MM.YYYY HH:MM&quot;,&quot;0,000&quot; · STW Lastprofil Export
              </p>
            </div>
          </label>

          {uploadResult && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <div className="text-sm">
                  <span className="font-semibold text-green-700 dark:text-green-400">Import erfolgreich </span>
                  <span className="text-green-600 dark:text-green-400">
                    ({uploadResult.total.toLocaleString()} Zeilen gelesen)
                  </span>
                </div>
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
