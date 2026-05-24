'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactECharts from 'echarts-for-react';
import {
  Zap, Upload, TrendingUp, Calendar, ArrowLeft, RefreshCw,
  AlertTriangle, CheckCircle, Database, X, Search, ChevronRight,
  BarChart2, GitCompare, Activity,
} from 'lucide-react';
import Link from 'next/link';

type DataPoint  = { label: string; kwh: number; cnt: number };
type GroupMode  = '15min' | 'hour' | 'day' | 'month' | 'year';
type AnalysisTab = 'stats' | 'weekday' | 'compare';
type Stats = {
  tage: string; gesamt: string; schnitt_15min: string;
  min_15min: string; max_15min: string;
  erster: string | null; letzter: string | null; anzahl: string;
};

const GROUPS: { key: GroupMode; label: string }[] = [
  { key: '15min', label: '15 Min' }, { key: 'hour', label: 'Stunde' },
  { key: 'day',   label: 'Tag'    }, { key: 'month', label: 'Monat' },
  { key: 'year',  label: 'Jahr'   },
];
const PRESETS: { label: string; months: number }[] = [
  { label: '1T', months: -1 }, { label: '7T', months: -7 }, { label: '1M', months: 1 },
  { label: '3M', months: 3  }, { label: '6M', months: 6  }, { label: '1J', months: 12 },
  { label: '2J', months: 24 }, { label: 'Alles', months: 0 },
];
const WEEKDAY_NAMES = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function todayStr() { return new Date().toISOString().slice(0, 10); }
function daysAgoStr(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function getDateRange(months: number): { from: string; to: string } {
  const to = `${todayStr()}T23:45`;
  if (months === 0)  return { from: '2020-01-01T00:00', to };
  if (months === -1) return { from: `${todayStr()}T00:00`, to };
  if (months === -7) return { from: `${daysAgoStr(6)}T00:00`, to };
  const d = new Date(); d.setMonth(d.getMonth() - months);
  return { from: `${d.toISOString().slice(0, 10)}T00:00`, to };
}
function fmtDT(dt: string) {
  const [date, time] = dt.split('T');
  const [y, m, d] = date.split('-');
  return `${d}.${m}.${y}${time ? ' ' + time : ''}`;
}

// ── Chart builders ─────────────────────────────────────────────────────────

function baseChartTheme(isDark: boolean) {
  return {
    textColor: isDark ? '#9ca3af' : '#6b7280',
    gridColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    tooltipBg: isDark ? '#1f2937' : '#ffffff',
    tooltipBd: isDark ? '#374151' : '#e5e7eb',
    tooltipTx: isDark ? '#f3f4f6' : '#111827',
  };
}

function buildMainOption(data: DataPoint[], group: GroupMode, isDark: boolean) {
  const values = data.map(d => Number(d.kwh));
  if (!values.length) return {};
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const { textColor, gridColor, tooltipBg, tooltipBd, tooltipTx } = baseChartTheme(isDark);
  const barColors = values.map(v =>
    v > avg * 1.5 ? '#ef4444' : v > avg * 1.15 ? '#f97316' : v < avg * 0.6 ? '#22c55e' : '#3b82f6'
  );
  const labelFmt = (v: string) => {
    if (group === 'month') return v.slice(5) + '/' + v.slice(2, 4);
    if (group === 'year')  return v;
    if (group === 'day')   return v.slice(5);
    return v.slice(11);
  };
  return {
    backgroundColor: 'transparent', animation: true,
    tooltip: {
      trigger: 'axis', backgroundColor: tooltipBg, borderColor: tooltipBd, borderWidth: 1,
      textStyle: { color: tooltipTx, fontSize: 12 },
      formatter: (p: { name: string; value: number }[]) => {
        const pt = p[0]; if (!pt) return '';
        const diff = avg ? ((pt.value - avg) / avg * 100).toFixed(1) : '0';
        const sign = parseFloat(diff) >= 0 ? '+' : '';
        const col  = parseFloat(diff) >= 0 ? '#ef4444' : '#22c55e';
        return `<b>${pt.name}</b><br/>${pt.value.toFixed(4)} kWh<br/><span style="color:${col}">${sign}${diff}% vs Ø</span>`;
      },
    },
    grid: { top: 16, right: 16, bottom: 56, left: 70 },
    xAxis: {
      type: 'category', data: data.map(d => d.label),
      axisLabel: { color: textColor, fontSize: 10, rotate: data.length > 60 ? 45 : 0, formatter: labelFmt },
      axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false },
    },
    yAxis: {
      type: 'value', name: 'kWh', nameTextStyle: { color: textColor, fontSize: 11 },
      axisLabel: { color: textColor, fontSize: 11, formatter: (v: number) => v.toFixed(3) },
      axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: gridColor } },
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { type: 'slider', bottom: 2, height: 18, borderColor: gridColor,
        backgroundColor: isDark ? '#1f2937' : '#f9fafb',
        fillerColor: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)',
        handleStyle: { color: '#3b82f6' }, textStyle: { color: textColor, fontSize: 10 } },
    ],
    series: [
      { type: 'bar', data: values.map((v, i) => ({ value: v, itemStyle: { color: barColors[i], borderRadius: [2,2,0,0] } })), barMaxWidth: 32 },
      { type: 'line', data: values.map(() => +avg.toFixed(4)), symbol: 'none', lineStyle: { color: '#8b5cf6', type: 'dashed', width: 1.5 }, silent: true },
    ],
  };
}

function buildWeekdayOption(stats: { name: string; avg: number; count: number; isWeekend: boolean }[], isDark: boolean) {
  const { textColor, gridColor, tooltipBg, tooltipBd, tooltipTx } = baseChartTheme(isDark);
  const avg = stats.reduce((s, d) => s + d.avg, 0) / stats.length;
  return {
    backgroundColor: 'transparent', animation: true,
    tooltip: {
      trigger: 'axis', backgroundColor: tooltipBg, borderColor: tooltipBd, borderWidth: 1,
      textStyle: { color: tooltipTx, fontSize: 12 },
      formatter: (p: { name: string; value: number; dataIndex: number }[]) => {
        const pt = p[0]; if (!pt) return '';
        const s = stats[pt.dataIndex];
        return `<b>${pt.name}</b><br/>Ø ${pt.value.toFixed(3)} kWh/Tag<br/>${s.count} Datentage`;
      },
    },
    grid: { top: 20, right: 16, bottom: 30, left: 70 },
    xAxis: {
      type: 'category', data: stats.map(s => s.name),
      axisLabel: { color: textColor, fontSize: 12 },
      axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false },
    },
    yAxis: {
      type: 'value', name: 'kWh',
      nameTextStyle: { color: textColor, fontSize: 11 },
      axisLabel: { color: textColor, fontSize: 11, formatter: (v: number) => v.toFixed(2) },
      axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: gridColor } },
    },
    series: [
      {
        type: 'bar', barMaxWidth: 48,
        data: stats.map(s => ({
          value: +s.avg.toFixed(3),
          itemStyle: {
            color: s.isWeekend ? '#8b5cf6' : s.avg > avg * 1.15 ? '#f97316' : s.avg < avg * 0.85 ? '#22c55e' : '#3b82f6',
            borderRadius: [4, 4, 0, 0],
          },
        })),
      },
      { type: 'line', data: stats.map(() => +avg.toFixed(3)), symbol: 'none', lineStyle: { color: '#8b5cf6', type: 'dashed', width: 1.5 }, silent: true },
    ],
  };
}

function buildCompareOption(d1: DataPoint[], d2: DataPoint[], lbl1: string, lbl2: string, isDark: boolean) {
  const { textColor, gridColor, tooltipBg, tooltipBd, tooltipTx } = baseChartTheme(isDark);
  const len = Math.max(d1.length, d2.length);
  const xLabels = Array.from({ length: len }, (_, i) => `#${i + 1}`);
  return {
    backgroundColor: 'transparent', animation: true,
    legend: { data: [lbl1, lbl2], textStyle: { color: textColor, fontSize: 11 }, top: 4 },
    tooltip: {
      trigger: 'axis', backgroundColor: tooltipBg, borderColor: tooltipBd, borderWidth: 1,
      textStyle: { color: tooltipTx, fontSize: 12 },
      formatter: (params: { seriesName: string; value: number; dataIndex: number }[]) => {
        const idx = params[0]?.dataIndex ?? 0;
        const la = d1[idx]?.label ?? '–'; const va = d1[idx] ? Number(d1[idx].kwh).toFixed(3) : '–';
        const lb = d2[idx]?.label ?? '–'; const vb = d2[idx] ? Number(d2[idx].kwh).toFixed(3) : '–';
        const diff = d1[idx] && d2[idx] ? ((Number(d1[idx].kwh) - Number(d2[idx].kwh)) / Number(d2[idx].kwh) * 100).toFixed(1) : null;
        const diffStr = diff ? `<br/><span style="color:${parseFloat(diff)>0?'#ef4444':'#22c55e'}">${parseFloat(diff)>0?'+':''}${diff}% Differenz</span>` : '';
        return `<b>${lbl1}:</b> ${la} → ${va} kWh<br/><b>${lbl2}:</b> ${lb} → ${vb} kWh${diffStr}`;
      },
    },
    grid: { top: 40, right: 16, bottom: 56, left: 70 },
    xAxis: {
      type: 'category', data: xLabels,
      axisLabel: { color: textColor, fontSize: 10 },
      axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false },
    },
    yAxis: {
      type: 'value', name: 'kWh', nameTextStyle: { color: textColor, fontSize: 11 },
      axisLabel: { color: textColor, fontSize: 11, formatter: (v: number) => v.toFixed(3) },
      axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: gridColor } },
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { type: 'slider', bottom: 2, height: 18, borderColor: gridColor,
        backgroundColor: isDark ? '#1f2937' : '#f9fafb',
        fillerColor: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)',
        handleStyle: { color: '#3b82f6' }, textStyle: { color: textColor, fontSize: 10 } },
    ],
    series: [
      { name: lbl1, type: 'bar', data: d1.map(d => +Number(d.kwh).toFixed(4)), itemStyle: { color: '#3b82f6', borderRadius: [2,2,0,0] }, barGap: '10%', barMaxWidth: 24 },
      { name: lbl2, type: 'bar', data: d2.map(d => +Number(d.kwh).toFixed(4)), itemStyle: { color: '#f97316', borderRadius: [2,2,0,0] }, barMaxWidth: 24 },
    ],
  };
}

// ── Compact DateTimePicker ─────────────────────────────────────────────────

function DateRangePicker({ from, to, onFromChange, onToChange, onApply, onReset, isActive, maxDT }: {
  from: string; to: string;
  onFromChange: (v: string) => void; onToChange: (v: string) => void;
  onApply: () => void; onReset: () => void;
  isActive: boolean; maxDT: string;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <div className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs transition-all ${
        isActive
          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600'
          : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/60'}`}>
        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <input
          type="datetime-local" value={from} max={maxDT}
          onChange={e => onFromChange(e.target.value)}
          className="bg-transparent text-xs text-gray-700 dark:text-gray-300 border-none outline-none w-[138px]"
        />
        <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
        <input
          type="datetime-local" value={to} min={from || undefined} max={maxDT}
          onChange={e => onToChange(e.target.value)}
          className="bg-transparent text-xs text-gray-700 dark:text-gray-300 border-none outline-none w-[138px]"
        />
      </div>
      <button onClick={onApply} disabled={!from || !to}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
        <Search className="w-3.5 h-3.5" /> Anwenden
      </button>
      {isActive && (
        <button onClick={onReset}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
          <X className="w-3 h-3" /> Reset
        </button>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function StromPageClient() {
  const router = useRouter();
  const [data,    setData]    = useState<DataPoint[]>([]);
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [group,   setGroup]   = useState<GroupMode>('day');
  const [preset,  setPreset]  = useState(12);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [isDark,  setIsDark]  = useState(false);
  const [tab,     setTab]     = useState<AnalysisTab>('stats');

  // Main datetime range
  const [inputFrom,   setInputFrom]   = useState(() => `${todayStr()}T00:00`);
  const [inputTo,     setInputTo]     = useState(() => `${todayStr()}T23:45`);
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo,   setAppliedTo]   = useState('');
  const isCustom = !!(appliedFrom && appliedTo);
  const isOneDay = isCustom && appliedFrom.slice(0,10) === appliedTo.slice(0,10);

  // Comparison
  const [cmpGroup,   setCmpGroup]   = useState<GroupMode>('day');
  const [cmpFrom1,   setCmpFrom1]   = useState(() => `${daysAgoStr(6)}T00:00`);
  const [cmpTo1,     setCmpTo1]     = useState(() => `${todayStr()}T23:45`);
  const [cmpFrom2,   setCmpFrom2]   = useState(() => `${daysAgoStr(13)}T00:00`);
  const [cmpTo2,     setCmpTo2]     = useState(() => `${daysAgoStr(7)}T23:45`);
  const [cmpData1,   setCmpData1]   = useState<DataPoint[]>([]);
  const [cmpData2,   setCmpData2]   = useState<DataPoint[]>([]);
  const [cmpLoading, setCmpLoading] = useState(false);
  const [cmpError,   setCmpError]   = useState('');

  // Upload
  const [uploading,      setUploading]      = useState(false);
  const [uploadResult,   setUploadResult]   = useState<{ inserted: number; skipped: number; total: number } | null>(null);
  const [uploadError,    setUploadError]    = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener('change', h); return () => mq.removeEventListener('change', h);
  }, []);

  const load = useCallback(async (from: string, to: string, g: GroupMode) => {
    setLoading(true); setError('');
    try {
      const r = await fetch(`/api/strom?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&group=${g}`);
      if (r.status === 401) { router.push('/login'); return; }
      if (!r.ok) throw new Error();
      const j = await r.json();
      setData(j.data ?? []); setStats(j.stats ?? null);
    } catch { setError('Daten konnten nicht geladen werden.'); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    if (isCustom) load(appliedFrom, appliedTo, group);
    else { const { from, to } = getDateRange(preset); load(from, to, group); }
  }, [preset, group, appliedFrom, appliedTo, isCustom, load]);

  const handleApply = () => {
    if (!inputFrom || !inputTo) return;
    if (inputFrom > inputTo) { setError('Von-Zeitpunkt muss vor Bis liegen.'); return; }
    setError(''); setAppliedFrom(inputFrom); setAppliedTo(inputTo);
  };
  const handleReset = () => {
    setInputFrom(`${todayStr()}T00:00`); setInputTo(`${todayStr()}T23:45`);
    setAppliedFrom(''); setAppliedTo(''); setError('');
  };
  const handlePreset = (m: number) => { setPreset(m); handleReset(); };

  const openDayDetail = (dateStr: string) => {
    const from = `${dateStr}T00:00`, to = `${dateStr}T23:45`;
    setInputFrom(from); setInputTo(to);
    setAppliedFrom(from); setAppliedTo(to);
    setGroup('15min');
  };

  const loadComparison = async () => {
    if (!cmpFrom1 || !cmpTo1 || !cmpFrom2 || !cmpTo2) return;
    setCmpLoading(true); setCmpError('');
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/strom?from=${encodeURIComponent(cmpFrom1)}&to=${encodeURIComponent(cmpTo1)}&group=${cmpGroup}`),
        fetch(`/api/strom?from=${encodeURIComponent(cmpFrom2)}&to=${encodeURIComponent(cmpTo2)}&group=${cmpGroup}`),
      ]);
      if (!r1.ok || !r2.ok) throw new Error();
      const [j1, j2] = await Promise.all([r1.json(), r2.json()]);
      setCmpData1(j1.data ?? []); setCmpData2(j2.data ?? []);
    } catch { setCmpError('Vergleich konnte nicht geladen werden.'); }
    finally { setCmpLoading(false); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); setUploadResult(null); setUploadError(''); setUploadProgress('');
    setUploadProgress(`Lese Datei (${(file.size / 1024 / 1024).toFixed(1)} MB)…`);
    try {
      const fd = new FormData(); fd.append('file', file);
      setUploadProgress('Importiere… (kann 10-30s dauern)');
      const r = await fetch('/api/strom', { method: 'POST', body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Fehler');
      setUploadResult({ inserted: j.inserted, skipped: j.skipped, total: j.total });
      setUploadProgress('');
      if (isCustom) load(appliedFrom, appliedTo, group);
      else { const { from, to } = getDateRange(preset); load(from, to, group); }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
      setUploadProgress('');
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  // Derived values
  const total   = data.reduce((s, d) => s + Number(d.kwh), 0);
  const avg     = data.length ? total / data.length : 0;
  const maxVal  = data.length ? Math.max(...data.map(d => Number(d.kwh))) : 0;
  const minVal  = data.length ? Math.min(...data.map(d => Number(d.kwh))) : 0;
  const maxItem = data.find(d => Number(d.kwh) === maxVal);
  const minItem = data.find(d => Number(d.kwh) === minVal);

  // Hourly (single day)
  const hourlyTotals = isOneDay && data.length > 0
    ? Array.from({ length: 24 }, (_, h) => {
        const hStr = h.toString().padStart(2,'0');
        const pts  = data.filter(d => d.label.slice(11,13) === hStr);
        return { hour: `${hStr}:00`, kwh: pts.reduce((s,d) => s + Number(d.kwh), 0), count: pts.length };
      }).filter(h => h.count > 0)
    : [];
  const dayMaxHour = hourlyTotals.length ? hourlyTotals.reduce((a,b) => a.kwh > b.kwh ? a : b) : null;
  const hourMax    = hourlyTotals.length ? Math.max(...hourlyTotals.map(h => h.kwh)) : 0;

  // Weekday analysis
  const weekdayStats = (() => {
    if (!data.length || group === 'month' || group === 'year') return [];
    const dailyMap = new Map<string, number>();
    if (group === 'day') {
      data.forEach(d => dailyMap.set(d.label.slice(0,10), Number(d.kwh)));
    } else {
      data.forEach(d => {
        const dk = d.label.slice(0,10);
        dailyMap.set(dk, (dailyMap.get(dk) ?? 0) + Number(d.kwh));
      });
    }
    const groups: number[][] = Array.from({ length: 7 }, () => []);
    dailyMap.forEach((kwh, ds) => {
      const [y, m, dd] = ds.split('-').map(Number);
      const wd = new Date(y, m-1, dd).getDay();
      const idx = wd === 0 ? 6 : wd - 1;
      groups[idx].push(kwh);
    });
    return WEEKDAY_NAMES.map((name, idx) => ({
      name, count: groups[idx].length,
      avg: groups[idx].length ? groups[idx].reduce((a,b) => a+b, 0) / groups[idx].length : 0,
      isWeekend: idx >= 5,
    }));
  })();

  // Comparison totals
  const cmpTotal1 = cmpData1.reduce((s,d) => s + Number(d.kwh), 0);
  const cmpTotal2 = cmpData2.reduce((s,d) => s + Number(d.kwh), 0);

  const hasData    = stats && parseInt(stats.anzahl) > 0;
  const activeGroup = isCustom && isOneDay && group !== '15min' ? '15min' : group;
  const maxDT      = `${todayStr()}T23:45`;

  // Tab config
  const tabs: { key: AnalysisTab; label: string; icon: React.ReactNode }[] = [
    { key: 'stats',   label: 'Statistik',       icon: <Activity className="w-3.5 h-3.5" /> },
    { key: 'weekday', label: 'Wochentag',        icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { key: 'compare', label: 'Zeitraumvergleich', icon: <GitCompare className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Stromverbrauch</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {hasData ? `${stats!.erster} – ${stats!.letzter} · ${parseInt(stats!.anzahl).toLocaleString()} Messungen` : 'STW Energieportal · 15-Min Lastprofil'}
              </p>
            </div>
          </div>
          <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-sm">
            <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Dashboard</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Gesamt-Stats */}
        {hasData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Gesamt',      value: `${parseFloat(stats!.gesamt).toLocaleString('de-AT', { minimumFractionDigits: 1 })} kWh`, sub: `über ${stats!.tage} Tage`, icon: <Zap className="w-4 h-4" />, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Ø pro Tag',   value: `${(parseFloat(stats!.gesamt) / Math.max(parseInt(stats!.tage), 1)).toFixed(2)} kWh`, sub: `Ø 15min: ${parseFloat(stats!.schnitt_15min).toFixed(4)} kWh`, icon: <Calendar className="w-4 h-4" />, color: 'text-indigo-600 dark:text-indigo-400' },
              { label: 'Max 15min',   value: `${parseFloat(stats!.max_15min).toFixed(4)} kWh`, sub: 'Einzelmessung gesamt', icon: <TrendingUp className="w-4 h-4" />, color: 'text-red-500 dark:text-red-400' },
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

        {/* Active-Range Banner */}
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
            <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-all">
              <X className="w-3.5 h-3.5" /> Zurücksetzen
            </button>
          </div>
        )}

        {/* Chart Card */}
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-6">
          <div className="flex flex-col gap-3 mb-4">
            {/* Titel + Gruppe */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Verbrauchsanalyse</h2>
                <p className="text-xs text-gray-400">
                  Zoom: Mausrad · Pan: Ziehen ·
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
                      activeGroup === g.key ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Presets + Datetime Picker */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-0.5 flex-wrap">
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
              <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
              <DateRangePicker
                from={inputFrom} to={inputTo}
                onFromChange={setInputFrom} onToChange={setInputTo}
                onApply={handleApply} onReset={handleReset}
                isActive={isCustom} maxDT={maxDT}
              />
            </div>
          </div>

          {loading ? (
            <div className="h-80 flex items-center justify-center"><RefreshCw className="w-8 h-8 text-blue-500 animate-spin" /></div>
          ) : error ? (
            <div className="h-80 flex items-center justify-center gap-2 text-red-500"><AlertTriangle className="w-5 h-5" /><span>{error}</span></div>
          ) : !hasData ? (
            <div className="h-80 flex flex-col items-center justify-center gap-4 text-gray-400">
              <Zap className="w-16 h-16 opacity-20" />
              <p className="font-medium text-gray-600 dark:text-gray-300">Noch keine Daten — CSV hochladen</p>
            </div>
          ) : data.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-gray-400 text-sm">Keine Daten für diesen Zeitraum</div>
          ) : (
            <ReactECharts option={buildMainOption(data, activeGroup, isDark)} style={{ height: 380 }} notMerge />
          )}
        </div>

        {/* Tagesdetail (Einzeltag) */}
        {isOneDay && data.length > 0 && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Tagesstatistik — {fmtDT(appliedFrom).slice(0,10)}</h3>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Tagesverbrauch',  value: `${total.toFixed(3)} kWh`, color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Messpunkte',       value: `${data.length} × 15 Min` },
                  { label: 'Ø pro 15 Min',     value: `${avg.toFixed(4)} kWh` },
                  { label: 'Stärkste Stunde',  value: dayMaxHour ? `${dayMaxHour.hour} (${dayMaxHour.kwh.toFixed(3)} kWh)` : '–', color: 'text-orange-500' },
                  { label: 'Peak 15min',        value: maxItem ? `${maxVal.toFixed(4)} kWh (${maxItem.label.slice(11)})` : '–', color: 'text-red-500' },
                  { label: 'Minimum 15min',     value: minItem ? `${minVal.toFixed(4)} kWh (${minItem.label.slice(11)})` : '–', color: 'text-green-500' },
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
                  const pct = hourMax > 0 ? (h.kwh / hourMax) * 100 : 0;
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

        {/* Analyse-Tabs */}
        {data.length > 0 && !loading && (
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden">
            {/* Tab-Bar */}
            <div className="flex border-b border-gray-100 dark:border-gray-700/50">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all border-b-2 ${
                    tab === t.key
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            <div className="p-5">

              {/* ── Statistik ── */}
              {tab === 'stats' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 text-sm">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Zeitraum-Statistik</h3>
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
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Top 5 Höchstverbrauch</h3>
                    <div className="space-y-2.5">
                      {[...data].sort((a,b) => Number(b.kwh)-Number(a.kwh)).slice(0,5).map((d,i) => (
                        <div key={d.label} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-gray-400 w-4 shrink-0">#{i+1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-xs">
                              <button onClick={() => activeGroup === 'day' ? openDayDetail(d.label) : undefined}
                                className={`text-gray-600 dark:text-gray-400 truncate text-left ${activeGroup === 'day' ? 'hover:text-blue-500 cursor-pointer' : 'cursor-default'}`}>
                                {d.label}
                              </button>
                              <span className="font-bold text-red-500 ml-2 shrink-0">{Number(d.kwh).toFixed(activeGroup === 'day' ? 3 : 4)}</span>
                            </div>
                            <div className="mt-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                              <div className="h-1.5 bg-red-400 rounded-full" style={{ width: `${(Number(d.kwh)/maxVal)*100}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                      {activeGroup === 'day' && <p className="text-[10px] text-gray-400 pt-1">Auf einen Tag klicken → Tagesdetails</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Wochentag ── */}
              {tab === 'weekday' && (
                weekdayStats.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-sm text-gray-400">
                    Wochentag-Analyse benötigt Tages-, Stunden- oder 15Min-Ansicht
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Durchschnitt pro Wochentag</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Basierend auf Tagessummen im gewählten Zeitraum ·
                          <span className="text-purple-500"> lila</span> = Wochenende
                        </p>
                      </div>
                    </div>
                    <ReactECharts option={buildWeekdayOption(weekdayStats, isDark)} style={{ height: 240 }} notMerge />
                    <div className="grid grid-cols-7 gap-1.5">
                      {weekdayStats.map(s => (
                        <div key={s.name} className={`rounded-xl p-2.5 text-center border ${
                          s.isWeekend
                            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/50'
                            : 'bg-gray-50 dark:bg-gray-700/30 border-gray-100 dark:border-gray-700/50'}`}>
                          <p className={`text-xs font-bold ${s.isWeekend ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-300'}`}>{s.name}</p>
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-1">{s.avg.toFixed(2)}</p>
                          <p className="text-[10px] text-gray-400">{s.count}×</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}

              {/* ── Vergleich ── */}
              {tab === 'compare' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Zwei Zeiträume vergleichen</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Zeitraum A
                        </p>
                        <DateRangePicker
                          from={cmpFrom1} to={cmpTo1}
                          onFromChange={setCmpFrom1} onToChange={setCmpTo1}
                          onApply={() => {}} onReset={() => {}}
                          isActive={false} maxDT={maxDT}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-orange-500 flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-sm bg-orange-500 inline-block" /> Zeitraum B
                        </p>
                        <DateRangePicker
                          from={cmpFrom2} to={cmpTo2}
                          onFromChange={setCmpFrom2} onToChange={setCmpTo2}
                          onApply={() => {}} onReset={() => {}}
                          isActive={false} maxDT={maxDT}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-700/50 p-0.5 rounded-lg">
                        {GROUPS.map(g => (
                          <button key={g.key} onClick={() => setCmpGroup(g.key)}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                              cmpGroup === g.key ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                            {g.label}
                          </button>
                        ))}
                      </div>
                      <button onClick={loadComparison} disabled={cmpLoading}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                        {cmpLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GitCompare className="w-4 h-4" />}
                        Vergleich laden
                      </button>
                    </div>
                  </div>

                  {cmpError && <div className="flex items-center gap-2 text-red-500 text-sm"><AlertTriangle className="w-4 h-4" />{cmpError}</div>}

                  {(cmpData1.length > 0 || cmpData2.length > 0) && (
                    <>
                      <ReactECharts
                        option={buildCompareOption(cmpData1, cmpData2,
                          `A: ${fmtDT(cmpFrom1).slice(0,10)}–${fmtDT(cmpTo1).slice(0,10)}`,
                          `B: ${fmtDT(cmpFrom2).slice(0,10)}–${fmtDT(cmpTo2).slice(0,10)}`,
                          isDark)}
                        style={{ height: 300 }} notMerge
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { label: 'Zeitraum A', data: cmpData1, total: cmpTotal1, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
                          { label: 'Zeitraum B', data: cmpData2, total: cmpTotal2, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' },
                        ].map(s => (
                          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
                            <p className={`text-sm font-bold ${s.color} mb-2`}>{s.label}</p>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between"><span className="text-gray-500">Datenpunkte</span><span className="font-medium">{s.data.length}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Gesamt</span><span className="font-medium">{s.total.toFixed(3)} kWh</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Durchschnitt</span><span className="font-medium">{s.data.length ? (s.total / s.data.length).toFixed(4) : '–'} kWh</span></div>
                              {s.data.length > 0 && <div className="flex justify-between"><span className="text-gray-500">Maximum</span><span className="font-medium">{Math.max(...s.data.map(d => Number(d.kwh))).toFixed(4)} kWh</span></div>}
                            </div>
                          </div>
                        ))}
                      </div>
                      {cmpData1.length > 0 && cmpData2.length > 0 && (
                        <div className={`rounded-xl border p-4 text-center text-sm ${
                          cmpTotal1 < cmpTotal2 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                          <span className="text-gray-600 dark:text-gray-300">Zeitraum A vs B: </span>
                          <span className={`font-bold ${cmpTotal1 < cmpTotal2 ? 'text-green-600' : 'text-red-500'}`}>
                            {cmpTotal1 < cmpTotal2 ? '▼' : '▲'}{' '}
                            {Math.abs(((cmpTotal1 - cmpTotal2) / cmpTotal2) * 100).toFixed(1)}%
                            {' '}({cmpTotal1 < cmpTotal2 ? '-' : '+'}{Math.abs(cmpTotal1 - cmpTotal2).toFixed(3)} kWh)
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CSV Upload */}
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Daten importieren</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">CSV-Export vom STW Energieportal — Duplikate werden übersprungen.</p>
          <label className={`flex flex-col items-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all
            ${uploading ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/10 cursor-wait' : 'border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'}`}>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleUpload} disabled={uploading} />
            {uploading ? <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" /> : <Upload className="w-8 h-8 text-gray-400" />}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{uploading ? uploadProgress || 'Wird verarbeitet…' : 'CSV-Datei auswählen'}</p>
              <p className="text-xs text-gray-400 mt-1">Format: &quot;DD.MM.YYYY HH:MM&quot;,&quot;0,000&quot;</p>
            </div>
          </label>
          {uploadResult && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">Import erfolgreich ({uploadResult.total.toLocaleString()} Zeilen)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-2 text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{uploadResult.inserted.toLocaleString()}</p>
                  <p className="text-xs text-green-600 dark:text-green-500">Neu gespeichert</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                  <p className="text-2xl font-bold text-gray-500 dark:text-gray-400">{uploadResult.skipped.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Übersprungen</p>
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
            <p className="font-medium text-gray-600 dark:text-gray-300">Export vom STW Energieportal:</p>
            <p>1. <a href="https://energieportal.stw.at/customerportal/index.php?page=loadprofile" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Energieportal → Grafische Darstellung</a></p>
            <p>2. Format CSV → DATEN DOWNLOADEN → Datei hier hochladen</p>
          </div>
        </div>

      </main>
    </div>
  );
}
