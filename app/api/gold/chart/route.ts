import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RANGE_MAP: Record<string, { range: string; interval: string }> = {
  '1w': { range: '5d',  interval: '1h'  },
  '1m': { range: '1mo', interval: '1d'  },
  '3m': { range: '3mo', interval: '1d'  },
  '1y': { range: '1y',  interval: '1d'  },
  '5y': { range: '5y',  interval: '1wk' },
};

export function calcSMA(closes: number[], period: number): (number | null)[] {
  return closes.map((_, i) =>
    i < period - 1 ? null : closes.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period
  );
}

export function calcEMA(closes: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) { ema.push(closes[0]); continue; }
    ema.push(closes[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

export function calcMACD(closes: number[]) {
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calcEMA(macdLine, 9);
  const histogram = macdLine.map((v, i) => v - signalLine[i]);
  return { macdLine, signalLine, histogram };
}

export function calcRSI(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  const recent = closes.slice(-period - 1);
  let gains = 0, losses = 0;
  for (let i = 1; i < recent.length; i++) {
    const diff = recent[i] - recent[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  return Math.round(100 - 100 / (1 + avgGain / avgLoss));
}

export function calcBollingerBands(closes: number[], period = 20, mult = 2) {
  return closes.map((_, i) => {
    if (i < period - 1) return { upper: null, middle: null, lower: null };
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const std = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period);
    return { upper: mean + mult * std, middle: mean, lower: mean - mult * std };
  });
}

export function calcATR(closes: number[], period = 14): number {
  if (closes.length < 2) return 0;
  const trs = closes.slice(1).map((c, i) => Math.abs(c - closes[i]));
  const recent = trs.slice(-period);
  return recent.reduce((a, b) => a + b, 0) / recent.length;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  const range = req.nextUrl.searchParams.get('range') ?? '1y';
  const { range: yRange, interval } = RANGE_MAP[range] ?? RANGE_MAP['1y'];

  try {
    // Für Indikatoren immer 2 Jahre holen, aber nur angeforderte Range zurückgeben
    const [displayRes, indicatorRes] = await Promise.all([
      fetch(`https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=${interval}&range=${yRange}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 },
      }),
      fetch(`https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=2y`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 },
      }),
    ]);

    if (!displayRes.ok) throw new Error(`Yahoo Finance: ${displayRes.status}`);
    const displayJson = await displayRes.json();
    const indicatorJson = indicatorRes.ok ? await indicatorRes.json() : displayJson;

    const displayResult = displayJson?.chart?.result?.[0];
    const indicatorResult = indicatorJson?.chart?.result?.[0];
    if (!displayResult) throw new Error('Keine Daten');

    // Display-Daten (für Chart)
    const dispTs: number[] = displayResult.timestamp ?? [];
    const dispCloses: number[] = displayResult.indicators?.quote?.[0]?.close ?? [];
    const displayPrices = dispTs
      .map((ts, i) => ({ date: new Date(ts * 1000).toISOString().split('T')[0], close: dispCloses[i] ?? null }))
      .filter(p => p.close != null) as { date: string; close: number }[];

    const dispValues = displayPrices.map(p => p.close);
    const dispSma20 = calcSMA(dispValues, 20);
    const dispSma50 = calcSMA(dispValues, 50);
    const dispBB = calcBollingerBands(dispValues);
    const dispMACD = calcMACD(dispValues);

    const pricesWithIndicators = displayPrices.map((p, i) => ({
      ...p,
      sma20:    dispSma20[i]         != null ? Math.round(dispSma20[i]!        * 100) / 100 : null,
      sma50:    dispSma50[i]         != null ? Math.round(dispSma50[i]!        * 100) / 100 : null,
      bb_upper: dispBB[i].upper      != null ? Math.round(dispBB[i].upper!     * 100) / 100 : null,
      bb_lower: dispBB[i].lower      != null ? Math.round(dispBB[i].lower!     * 100) / 100 : null,
      macd:     Math.round(dispMACD.macdLine[i]   * 100) / 100,
      macd_sig: Math.round(dispMACD.signalLine[i] * 100) / 100,
    }));

    // Indicator-Daten (2 Jahre für SMA100/200)
    const indTs: number[] = indicatorResult?.timestamp ?? dispTs;
    const indCloses: number[] = indicatorResult?.indicators?.quote?.[0]?.close ?? dispCloses;
    const indPrices = indTs
      .map((ts, i) => ({ date: new Date(ts * 1000).toISOString().split('T')[0], close: indCloses[i] ?? null }))
      .filter(p => p.close != null) as { date: string; close: number }[];
    const indValues = indPrices.map(p => p.close);

    const sma100arr = calcSMA(indValues, 100);
    const sma200arr = calcSMA(indValues, 200);
    const bbFull    = calcBollingerBands(indValues);
    const macdFull  = calcMACD(indValues);
    const rsi       = calcRSI(indValues);
    const atr       = calcATR(indValues);

    const currentPrice = indValues.at(-1) ?? 0;
    const prevClose    = indValues.at(-2)  ?? currentPrice;
    const firstPrice   = indValues[0]      ?? currentPrice;
    const price1mAgo   = indValues.at(-22) ?? currentPrice;
    const price3mAgo   = indValues.at(-63) ?? currentPrice;

    const change1d = prevClose  ? ((currentPrice - prevClose)  / prevClose)  * 100 : 0;
    const change1y = firstPrice ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0;
    const change1m = price1mAgo ? ((currentPrice - price1mAgo) / price1mAgo) * 100 : 0;
    const change3m = price3mAgo ? ((currentPrice - price3mAgo) / price3mAgo) * 100 : 0;

    const lastSma20  = calcSMA(indValues, 20).at(-1)  ?? null;
    const lastSma50  = calcSMA(indValues, 50).at(-1)  ?? null;
    const lastSma100 = sma100arr.at(-1) ?? null;
    const lastSma200 = sma200arr.at(-1) ?? null;
    const lastBB     = bbFull.at(-1)!;
    const lastMACD   = macdFull.macdLine.at(-1)!;
    const lastSignal = macdFull.signalLine.at(-1)!;
    const lastHist   = macdFull.histogram.at(-1)!;

    let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (lastSma20 != null && lastSma50 != null) {
      if (lastSma20 > lastSma50 * 1.005) trend = 'bullish';
      else if (lastSma20 < lastSma50 * 0.995) trend = 'bearish';
    }

    const r = (v: number | null) => v != null ? Math.round(v * 100) / 100 : null;

    return NextResponse.json({
      prices: pricesWithIndicators,
      currentPrice:  r(currentPrice),
      change1d:      r(change1d),
      change1y:      r(change1y),
      change1m:      r(change1m),
      change3m:      r(change3m),
      rsi,
      atr:           r(atr),
      trend,
      sma20:         r(lastSma20),
      sma50:         r(lastSma50),
      sma100:        r(lastSma100),
      sma200:        r(lastSma200),
      bb_upper:      r(lastBB.upper),
      bb_middle:     r(lastBB.middle),
      bb_lower:      r(lastBB.lower),
      macd:          r(lastMACD),
      macd_signal:   r(lastSignal),
      macd_hist:     r(lastHist),
    });
  } catch (err) {
    console.error('Gold chart error:', err);
    return NextResponse.json({ error: 'Kursdaten konnten nicht geladen werden' }, { status: 500 });
  }
}
