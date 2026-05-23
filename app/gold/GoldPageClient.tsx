'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactECharts from 'echarts-for-react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type PricePoint = {
  date: string; open: number; high: number; low: number; close: number;
  sma20: number | null; sma50: number | null;
  bb_upper: number | null; bb_lower: number | null;
  macd: number; macd_sig: number;
};

type ChartData = {
  prices: PricePoint[];
  currentPrice: number; change1d: number; change1y: number; change1m: number; change3m: number;
  rsi: number | null; trend: string;
  sma20: number | null; sma50: number | null; sma100: number | null; sma200: number | null;
  bb_upper: number | null; bb_lower: number | null; macd: number | null; macd_signal: number | null;
};

type HorizontForecast = {
  richtung: string; ziel_low: number; ziel_high: number; ziel_mitte: number;
  konfidenz: number; change_pct_low: number; change_pct_high: number; signale: string[];
};

type Prognose = {
  sentiment: string; gesamt_score: number;
  zeithorizonte: Record<string, HorizontForecast>;
  technisch: {
    rsi: number; macd: number; macd_signal: number; macd_bullish: boolean;
    sma20: number | null; sma50: number | null; sma100: number | null; sma200: number | null;
    bb_upper: number; bb_lower: number; bb_position: number; atr: number;
  };
  faktoren: string[]; risiken: string[];
  kurzfristig: { richtung: string; begruendung: string; ziel: string };
  mittelfristig: { richtung: string; begruendung: string; ziel: string };
};

const RANGES = [
  { key: '1w', label: '1W' }, { key: '1m', label: '1M' },
  { key: '3m', label: '3M' }, { key: '1y', label: '1J' }, { key: '5y', label: '5J' },
];

const HORIZONTE = [
  { key: '10d', label: '10 Tage' }, { key: '30d', label: '30 Tage' },
  { key: '60d', label: '60 Tage' }, { key: '100d', label: '100 Tage' },
  { key: '6m', label: '6 Monate' }, { key: '12m', label: '12 Monate' }, { key: '24m', label: '24 Monate' },
];

function richtungIcon(r: string) {
  if (r === 'steigend')  return <TrendingUp  className="w-5 h-5 text-green-500" />;
  if (r === 'fallend')   return <TrendingDown className="w-5 h-5 text-red-500" />;
  return <Minus className="w-5 h-5 text-gray-400" />;
}
function richtungColor(r: string) {
  if (r === 'steigend') return 'text-green-600 dark:text-green-400';
  if (r === 'fallend')  return 'text-red-600 dark:text-red-400';
  return 'text-gray-500 dark:text-gray-400';
}
function sentimentStyle(s: string) {
  if (s === 'bullish') return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
  if (s === 'bearish') return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
  return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';
}
function konfidenzColor(k: number) {
  if (k >= 70) return 'bg-green-500';
  if (k >= 50) return 'bg-amber-500';
  return 'bg-gray-400';
}

function buildEChartsOption(
  prices: PricePoint[],
  showBB: boolean,
  sma200: number | null,
  isDark: boolean,
) {
  const dates  = prices.map(p => p.date);
  const ohlc   = prices.map(p => [p.open, p.close, p.low, p.high]);
  const closes = prices.map(p => p.close);
  const sma20  = prices.map(p => p.sma20);
  const sma50  = prices.map(p => p.sma50);
  const bbUp   = prices.map(p => p.bb_upper);
  const bbLo   = prices.map(p => p.bb_lower);

  const textColor  = isDark ? '#9ca3af' : '#6b7280';
  const gridColor  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const bgColor    = 'transparent';
  const tooltipBg  = isDark ? '#1f2937' : '#ffffff';
  const tooltipBdr = isDark ? '#374151' : '#e5e7eb';

  const series: object[] = [
    {
      name: 'Gold',
      type: 'candlestick',
      data: ohlc,
      itemStyle: {
        color: '#22c55e',        // bullish Kerze
        color0: '#ef4444',       // bearish Kerze
        borderColor: '#16a34a',
        borderColor0: '#dc2626',
      },
      z: 10,
    },
    {
      name: 'SMA 20',
      type: 'line',
      data: sma20,
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#3b82f6', width: 1.5, type: 'dashed' },
      z: 5,
    },
    {
      name: 'SMA 50',
      type: 'line',
      data: sma50,
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#ef4444', width: 1.5, type: 'dashed' },
      z: 5,
    },
  ];

  if (sma200 != null) {
    series.push({
      name: 'SMA 200',
      type: 'line',
      data: closes.map(() => sma200),
      symbol: 'none',
      lineStyle: { color: '#10b981', width: 1.5, type: 'dotted' },
      z: 4,
    });
  }

  if (showBB) {
    series.push(
      {
        name: 'BB Oben',
        type: 'line',
        data: bbUp,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#8b5cf6', width: 1, type: 'dashed', opacity: 0.6 },
        z: 3,
      },
      {
        name: 'BB Unten',
        type: 'line',
        data: bbLo,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#8b5cf6', width: 1, type: 'dashed', opacity: 0.6 },
        areaStyle: { color: 'rgba(139,92,246,0.04)' },
        z: 3,
      },
    );
  }

  return {
    backgroundColor: bgColor,
    animation: false,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross', crossStyle: { color: textColor } },
      backgroundColor: tooltipBg,
      borderColor: tooltipBdr,
      borderWidth: 1,
      textStyle: { color: isDark ? '#f3f4f6' : '#111827', fontSize: 12 },
      formatter: (params: { seriesName: string; value: number | number[] }[]) => {
        const candle = params.find(p => p.seriesName === 'Gold');
        if (!candle || !Array.isArray(candle.value)) return '';
        const [o, c, l, h] = candle.value as number[];
        const idx = (params[0] as unknown as { dataIndex: number })?.dataIndex ?? 0;
        const date = dates[idx] ?? '';
        const pct = o ? (((c - o) / o) * 100).toFixed(2) : '0.00';
        const color = c >= o ? '#22c55e' : '#ef4444';
        let html = `<div style="font-size:11px;color:${textColor};margin-bottom:4px">${date}</div>`;
        html += `<div style="margin-bottom:6px"><b style="color:${color}">${c >= o ? '▲' : '▼'} $${c.toLocaleString('de-AT', { minimumFractionDigits: 2 })} (${pct}%)</b></div>`;
        html += `<div style="font-size:11px;color:${textColor}">O: $${o.toLocaleString('de-AT', { minimumFractionDigits: 2 })} &nbsp; H: $${h.toLocaleString('de-AT', { minimumFractionDigits: 2 })}</div>`;
        html += `<div style="font-size:11px;color:${textColor}">L: $${l.toLocaleString('de-AT', { minimumFractionDigits: 2 })} &nbsp; C: $${c.toLocaleString('de-AT', { minimumFractionDigits: 2 })}</div>`;
        for (const p of params) {
          if (p.seriesName === 'Gold' || p.seriesName === 'BB Unten') continue;
          if (p.value == null) continue;
          const v = Array.isArray(p.value) ? null : p.value as number;
          if (v == null) continue;
          html += `<div style="font-size:11px;color:${textColor};margin-top:2px">${p.seriesName}: $${v.toLocaleString('de-AT', { minimumFractionDigits: 2 })}</div>`;
        }
        return html;
      },
    },
    legend: {
      data: showBB
        ? ['Gold', 'SMA 20', 'SMA 50', 'SMA 200', 'BB Oben', 'BB Unten']
        : ['Gold', 'SMA 20', 'SMA 50', 'SMA 200'],
      bottom: 0,
      textStyle: { color: textColor, fontSize: 11 },
      icon: 'roundRect',
      itemHeight: 3,
    },
    grid: { top: 12, right: 12, bottom: 60, left: 70 },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: textColor, fontSize: 11, margin: 8 },
      splitLine: { show: false },
    },
    yAxis: {
      scale: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: textColor, fontSize: 11,
        formatter: (v: number) => `$${v.toLocaleString('de-AT')}`,
      },
      splitLine: { lineStyle: { color: gridColor } },
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      {
        type: 'slider',
        bottom: 22,
        height: 20,
        borderColor: gridColor,
        backgroundColor: isDark ? '#1f2937' : '#f9fafb',
        fillerColor: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)',
        handleStyle: { color: '#f59e0b' },
        textStyle: { color: textColor, fontSize: 10 },
      },
    ],
    series,
  };
}

export default function GoldPageClient() {
  const router = useRouter();
  const [range, setRange]           = useState('1y');
  const [chartData, setChartData]   = useState<ChartData | null>(null);
  const [prognose, setPrognose]     = useState<Prognose | null>(null);
  const [chartLoading, setChartLoading]     = useState(true);
  const [prognoseLoading, setPrognoseLoading] = useState(true);
  const [chartError, setChartError]   = useState('');
  const [prognoseError, setPrognoseError] = useState('');
  const [showBB, setShowBB]           = useState(false);
  const [activeHorizont, setActiveHorizont] = useState('30d');
  const [isDark, setIsDark]           = useState(false);
  const chartRef = useRef<ReactECharts>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const loadChart = useCallback(async (r: string) => {
    setChartLoading(true); setChartError('');
    try {
      const res = await fetch(`/api/gold/chart?range=${r}`);
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error();
      setChartData(await res.json());
    } catch { setChartError('Kursdaten konnten nicht geladen werden.'); }
    finally { setChartLoading(false); }
  }, [router]);

  const loadPrognose = useCallback(async () => {
    setPrognoseLoading(true); setPrognoseError('');
    try {
      const res = await fetch('/api/gold/prognose');
      const text = await res.text();
      if (!text) throw new Error('Leere Serverantwort');
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setPrognose(data);
    } catch (e: unknown) { setPrognoseError(e instanceof Error ? e.message : 'Fehler'); }
    finally { setPrognoseLoading(false); }
  }, []);

  useEffect(() => { loadChart(range); }, [range, loadChart]);
  useEffect(() => { loadPrognose(); }, [loadPrognose]);

  const trendColor =
    chartData?.trend === 'bullish' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
    : chartData?.trend === 'bearish' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';

  const rsiColor =
    (chartData?.rsi ?? 50) >= 70 ? 'text-red-600 dark:text-red-400'
    : (chartData?.rsi ?? 50) <= 30 ? 'text-green-600 dark:text-green-400'
    : 'text-amber-600 dark:text-amber-400';

  const activeH = prognose?.zeithorizonte?.[activeHorizont];

  const echartsOption = chartData
    ? buildEChartsOption(chartData.prices, showBB, prognose?.technisch.sma200 ?? null, isDark)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <span className="text-white text-lg font-bold">Au</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Gold</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">XAU/USD · kezar.at</p>
              </div>
            </div>
            <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-sm">
              <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Preis-Hero */}
        {chartData && !chartLoading && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 p-6 shadow-xl shadow-amber-500/20">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium mb-1">Goldpreis (oz)</p>
                <p className="text-4xl font-bold text-white">${chartData.currentPrice.toLocaleString('de-AT', { minimumFractionDigits: 2 })}</p>
                <div className="flex gap-3 mt-1 flex-wrap">
                  <span className={`text-sm font-semibold ${chartData.change1d >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {chartData.change1d >= 0 ? '+' : ''}{chartData.change1d.toFixed(2)}% heute
                  </span>
                  <span className="text-amber-100 text-sm">|</span>
                  <span className={`text-sm font-semibold ${chartData.change1m >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {chartData.change1m >= 0 ? '+' : ''}{chartData.change1m.toFixed(1)}% 1M
                  </span>
                  <span className="text-amber-100 text-sm">|</span>
                  <span className={`text-sm font-semibold ${chartData.change1y >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {chartData.change1y >= 0 ? '+' : ''}{chartData.change1y.toFixed(1)}% 1J
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${trendColor}`}>
                  {chartData.trend === 'bullish' ? 'Bullish' : chartData.trend === 'bearish' ? 'Bearish' : 'Neutral'}
                </span>
                {chartData.rsi != null && (
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                    RSI <span className={rsiColor}>{chartData.rsi}</span>
                  </span>
                )}
                {prognose && (
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${sentimentStyle(prognose.sentiment)}`}>
                    {prognose.sentiment === 'bullish' ? 'Bullish' : prognose.sentiment === 'bearish' ? 'Bearish' : 'Neutral'} · Score {prognose.gesamt_score > 0 ? '+' : ''}{prognose.gesamt_score}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Kursverlauf</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Scrollen zum Zoomen · Ziehen zum Verschieben</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => setShowBB(!showBB)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${showBB ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                Bollinger
              </button>
              <div className="flex gap-1">
                {RANGES.map(({ key, label }) => (
                  <button key={key} onClick={() => setRange(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      range === key
                        ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-md shadow-amber-500/25'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {chartLoading ? (
            <div className="h-96 flex items-center justify-center"><RefreshCw className="w-8 h-8 text-amber-500 animate-spin" /></div>
          ) : chartError ? (
            <div className="h-96 flex items-center justify-center gap-2 text-red-500"><AlertTriangle className="w-5 h-5" /><span>{chartError}</span></div>
          ) : echartsOption ? (
            <ReactECharts
              ref={chartRef}
              option={echartsOption}
              style={{ height: 420 }}
              notMerge
              lazyUpdate={false}
            />
          ) : null}
        </div>

        {/* Technische Indikatoren */}
        {prognose && !prognoseLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'RSI (14)', value: prognose.technisch.rsi,
                sub: prognose.technisch.rsi >= 70 ? 'Überkauft' : prognose.technisch.rsi <= 30 ? 'Überverkauft' : 'Neutral',
                color: prognose.technisch.rsi >= 70 ? 'text-red-500' : prognose.technisch.rsi <= 30 ? 'text-green-500' : 'text-amber-500' },
              { label: 'MACD', value: prognose.technisch.macd.toFixed(1),
                sub: prognose.technisch.macd_bullish ? 'Bullish' : 'Bearish',
                color: prognose.technisch.macd_bullish ? 'text-green-500' : 'text-red-500' },
              { label: 'BB Position', value: `${prognose.technisch.bb_position}%`,
                sub: prognose.technisch.bb_position > 75 ? 'Nahe Oberkante' : prognose.technisch.bb_position < 25 ? 'Nahe Unterkante' : 'Mitte',
                color: prognose.technisch.bb_position > 75 ? 'text-red-500' : prognose.technisch.bb_position < 25 ? 'text-green-500' : 'text-amber-500' },
              { label: 'ATR (14)', value: `$${prognose.technisch.atr.toFixed(0)}`,
                sub: 'Ø Tagesrange',
                color: 'text-gray-500 dark:text-gray-400' },
            ].map(item => (
              <div key={item.label} className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.label}</p>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Multi-Horizont Prognose */}
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Prognose</h2>
            {prognose && <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${sentimentStyle(prognose.sentiment)}`}>
              {prognose.sentiment === 'bullish' ? 'Bullish' : prognose.sentiment === 'bearish' ? 'Bearish' : 'Neutral'}
            </span>}
          </div>

          {prognoseLoading ? (
            <div className="flex flex-col items-center py-12 gap-3 text-gray-500 dark:text-gray-400">
              <RefreshCw className="w-7 h-7 animate-spin text-amber-500" />
              <p className="text-sm">Berechne Prognose…</p>
            </div>
          ) : prognoseError ? (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
              <AlertTriangle className="w-5 h-5 shrink-0" /><span className="text-sm">{prognoseError}</span>
            </div>
          ) : prognose ? (
            <div className="space-y-5">
              {/* Horizont-Tabs */}
              <div className="flex flex-wrap gap-1.5">
                {HORIZONTE.map(({ key, label }) => {
                  const h = prognose.zeithorizonte[key];
                  return (
                    <button key={key} onClick={() => setActiveHorizont(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        activeHorizont === key
                          ? h?.richtung === 'steigend' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700'
                            : h?.richtung === 'fallend' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                          : 'text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}>
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Aktive Horizont-Details */}
              {activeH && (
                <div className="rounded-xl border border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-900/30 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {richtungIcon(activeH.richtung)}
                        <span className={`text-xl font-bold capitalize ${richtungColor(activeH.richtung)}`}>{activeH.richtung}</span>
                        <span className="text-sm text-gray-400">·</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{HORIZONTE.find(h => h.key === activeHorizont)?.label}</span>
                      </div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">${activeH.ziel_mitte.toLocaleString()}</span>
                        <span className="text-sm text-gray-400 dark:text-gray-500">
                          (${activeH.ziel_low.toLocaleString()} – ${activeH.ziel_high.toLocaleString()})
                        </span>
                      </div>
                      <p className={`text-sm font-medium mt-1 ${activeH.change_pct_high >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {activeH.change_pct_low > 0 ? '+' : ''}{activeH.change_pct_low}% bis {activeH.change_pct_high > 0 ? '+' : ''}{activeH.change_pct_high}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Konfidenz</p>
                      <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{activeH.konfidenz}%</p>
                      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 ml-auto">
                        <div className={`h-2 rounded-full ${konfidenzColor(activeH.konfidenz)}`} style={{ width: `${activeH.konfidenz}%` }} />
                      </div>
                    </div>
                  </div>
                  {activeH.signale.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {activeH.signale.map((s, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                          {s.length > 60 ? s.slice(0, 57) + '…' : s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Alle Horizonte Übersicht */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700/50">
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Horizont</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Richtung</th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Ziel (Mitte)</th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Range</th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Konfidenz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {HORIZONTE.map(({ key, label }) => {
                      const h = prognose.zeithorizonte[key];
                      if (!h) return null;
                      return (
                        <tr key={key}
                          onClick={() => setActiveHorizont(key)}
                          className={`border-b border-gray-50 dark:border-gray-800 cursor-pointer transition-colors ${activeHorizont === key ? 'bg-amber-50 dark:bg-amber-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'}`}>
                          <td className="py-2.5 px-3 font-medium text-gray-700 dark:text-gray-300">{label}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5">
                              {richtungIcon(h.richtung)}
                              <span className={`capitalize text-xs font-semibold ${richtungColor(h.richtung)}`}>{h.richtung}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-amber-600 dark:text-amber-400">${h.ziel_mitte.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right text-xs text-gray-500 dark:text-gray-400">
                            {h.change_pct_low > 0 ? '+' : ''}{h.change_pct_low}% / {h.change_pct_high > 0 ? '+' : ''}{h.change_pct_high}%
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                                <div className={`h-1.5 rounded-full ${konfidenzColor(h.konfidenz)}`} style={{ width: `${h.konfidenz}%` }} />
                              </div>
                              <span className="text-xs text-gray-500">{h.konfidenz}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Faktoren & Risiken */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" /> Positive Faktoren
                  </p>
                  <ul className="space-y-2">
                    {prognose.faktoren.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> Risiken
                  </p>
                  <ul className="space-y-2">
                    {prognose.risiken.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />{r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="text-xs text-gray-400 dark:text-gray-600 text-center pt-2 border-t border-gray-100 dark:border-gray-700/50">
                Technische Analyse · Keine Anlageberatung · Datenquelle: Yahoo Finance
              </p>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
