import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Richtung = 'steigend' | 'fallend' | 'seitwärts';
type Sentiment = 'bullish' | 'bearish' | 'neutral';

interface HorizontForecast {
  richtung: Richtung;
  ziel_low: number;
  ziel_high: number;
  ziel_mitte: number;
  konfidenz: number;
  change_pct_low: number;
  change_pct_high: number;
  signale: string[];
}

// Maximale Kursveränderung pro Zeithorizont (historische Gold-Volatilität)
const VOLATILITY: Record<string, number> = {
  '10d': 0.035, '30d': 0.07, '60d': 0.12,
  '100d': 0.17, '6m': 0.22, '12m': 0.30, '24m': 0.45,
};

function richtungFromScore(score: number): Richtung {
  if (score > 1.5) return 'steigend';
  if (score < -1.5) return 'fallend';
  return 'seitwärts';
}

function sentimentFromScore(score: number): Sentiment {
  if (score > 2) return 'bullish';
  if (score < -2) return 'bearish';
  return 'neutral';
}

function forecastHorizont(
  price: number, score: number, maxVol: number, signals: string[]
): HorizontForecast {
  const normalized = Math.max(-1, Math.min(1, score / 8));
  const baseMove = normalized * maxVol;
  const spread = maxVol * 0.35;
  const changeLow  = Math.round((baseMove - spread) * 1000) / 1000;
  const changeHigh = Math.round((baseMove + spread) * 1000) / 1000;
  const ziel_low   = Math.round(price * (1 + changeLow));
  const ziel_high  = Math.round(price * (1 + changeHigh));
  const ziel_mitte = Math.round((ziel_low + ziel_high) / 2);
  const konfidenz  = Math.round(40 + Math.abs(normalized) * 40);
  return {
    richtung: richtungFromScore(score),
    ziel_low, ziel_high, ziel_mitte, konfidenz,
    change_pct_low:  Math.round(changeLow  * 1000) / 10,
    change_pct_high: Math.round(changeHigh * 1000) / 10,
    signale: signals,
  };
}

export async function GET() {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=2y',
      { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error('Yahoo Finance nicht erreichbar');
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) throw new Error('Keine Daten');

    const closes: number[] = (result.indicators?.quote?.[0]?.close ?? []).filter((v: number | null) => v != null);
    if (closes.length < 50) throw new Error('Zu wenig Daten');

    const price = closes.at(-1)!;
    const prev  = closes.at(-2)  ?? price;
    const p1m   = closes.at(-22) ?? price;
    const p3m   = closes.at(-63) ?? price;
    const p1y   = closes.at(-252) ?? closes[0];

    const change1d = ((price - prev) / prev) * 100;
    const change1m = ((price - p1m)  / p1m)  * 100;
    const change3m = ((price - p3m)  / p3m)  * 100;
    const change1y = ((price - p1y)  / p1y)  * 100;

    // --- Indikatoren berechnen ---
    const sma = (n: number) => {
      const sl = closes.slice(-n);
      return sl.length < n ? null : sl.reduce((a, b) => a + b, 0) / n;
    };
    const ema = (arr: number[], period: number) => {
      const k = 2 / (period + 1);
      return arr.reduce((acc, v, i) => {
        acc.push(i === 0 ? v : v * k + acc[i - 1] * (1 - k));
        return acc;
      }, [] as number[]);
    };

    const sma20  = sma(20);
    const sma50  = sma(50);
    const sma100 = sma(100);
    const sma200 = closes.length >= 200 ? sma(200) : null;

    // RSI 14
    const rsiSlice = closes.slice(-15);
    let gains = 0, losses = 0;
    for (let i = 1; i < rsiSlice.length; i++) {
      const d = rsiSlice[i] - rsiSlice[i - 1];
      if (d > 0) gains += d; else losses -= d;
    }
    const rsi = losses === 0 ? 100 : Math.round(100 - 100 / (1 + gains / losses));

    // MACD 12/26/9
    const ema12 = ema(closes, 12);
    const ema26 = ema(closes, 26);
    const macdLine   = ema12.map((v, i) => v - ema26[i]);
    const signalLine = ema(macdLine, 9);
    const macd       = macdLine.at(-1)!;
    const macdSig    = signalLine.at(-1)!;
    const macdPrev   = macdLine.at(-2)!;
    const macdSigPrev = signalLine.at(-2)!;

    // Bollinger Bands 20
    const bbSlice = closes.slice(-20);
    const bbMean = bbSlice.reduce((a, b) => a + b, 0) / 20;
    const bbStd  = Math.sqrt(bbSlice.reduce((a, b) => a + (b - bbMean) ** 2, 0) / 20);
    const bbUpper = bbMean + 2 * bbStd;
    const bbLower = bbMean - 2 * bbStd;
    const bbWidth = bbUpper - bbLower;
    const bbPos   = bbWidth > 0 ? (price - bbLower) / bbWidth : 0.5; // 0=lower, 1=upper

    // ATR
    const atrSlice = closes.slice(-15);
    const atr = atrSlice.slice(1).reduce((a, c, i) => a + Math.abs(c - atrSlice[i]), 0) / 14;

    // --- Scoring Signale ---
    type Signal = { text: string; score: number; kategorie: string };
    const signals: Signal[] = [];

    // RSI
    if (rsi <= 25) signals.push({ text: 'RSI extrem überverkauft (<25) — starkes Kaufsignal', score: 3, kategorie: 'technisch' });
    else if (rsi <= 30) signals.push({ text: `RSI überverkauft (${rsi}) — Kaufsignal`, score: 2, kategorie: 'technisch' });
    else if (rsi <= 40) signals.push({ text: `RSI leicht überverkauft (${rsi})`, score: 1, kategorie: 'technisch' });
    else if (rsi >= 75) signals.push({ text: `RSI extrem überkauft (${rsi}) — Verkaufssignal`, score: -2.5, kategorie: 'technisch' });
    else if (rsi >= 70) signals.push({ text: `RSI überkauft (${rsi}) — Vorsicht`, score: -1.5, kategorie: 'technisch' });
    else if (rsi >= 60) signals.push({ text: `RSI erhöht (${rsi}) — leicht bearish`, score: -0.5, kategorie: 'technisch' });
    else signals.push({ text: `RSI neutral (${rsi})`, score: 0, kategorie: 'technisch' });

    // MACD
    const macdCrossUp   = macd > macdSig && macdPrev <= macdSigPrev;
    const macdCrossDown = macd < macdSig && macdPrev >= macdSigPrev;
    if (macdCrossUp && macd < 0)  signals.push({ text: 'MACD Bullish Crossover (unter Nulllinie) — Trendumkehr möglich', score: 2, kategorie: 'technisch' });
    else if (macdCrossUp)         signals.push({ text: 'MACD Bullish Crossover — Aufwärtsmomentum', score: 1.5, kategorie: 'technisch' });
    else if (macdCrossDown && macd > 0) signals.push({ text: 'MACD Bearish Crossover (über Nulllinie) — Schwächesignal', score: -2, kategorie: 'technisch' });
    else if (macdCrossDown)       signals.push({ text: 'MACD Bearish Crossover — Abwärtsmomentum', score: -1.5, kategorie: 'technisch' });
    else if (macd > macdSig && macd > 0) signals.push({ text: 'MACD bullish (über Signal & Nulllinie)', score: 1.5, kategorie: 'technisch' });
    else if (macd > macdSig)      signals.push({ text: 'MACD bullish (über Signal)', score: 0.8, kategorie: 'technisch' });
    else if (macd < macdSig && macd < 0) signals.push({ text: 'MACD bearish (unter Signal & Nulllinie)', score: -1.5, kategorie: 'technisch' });
    else                          signals.push({ text: 'MACD leicht bearish (unter Signal)', score: -0.8, kategorie: 'technisch' });

    // SMA Positionen
    if (sma20  != null && price > sma20)  signals.push({ text: `Kurs über SMA20 ($${Math.round(sma20)})`,  score: 0.5, kategorie: 'technisch' });
    if (sma20  != null && price < sma20)  signals.push({ text: `Kurs unter SMA20 ($${Math.round(sma20)})`, score: -0.5, kategorie: 'technisch' });
    if (sma50  != null && price > sma50)  signals.push({ text: `Kurs über SMA50 ($${Math.round(sma50)})`,  score: 1, kategorie: 'technisch' });
    if (sma50  != null && price < sma50)  signals.push({ text: `Kurs unter SMA50 ($${Math.round(sma50)})`, score: -1, kategorie: 'technisch' });
    if (sma100 != null && price > sma100) signals.push({ text: `Kurs über SMA100 ($${Math.round(sma100)})`, score: 1.5, kategorie: 'technisch' });
    if (sma100 != null && price < sma100) signals.push({ text: `Kurs unter SMA100 ($${Math.round(sma100)})`, score: -1.5, kategorie: 'technisch' });
    if (sma200 != null && price > sma200) signals.push({ text: `Kurs über SMA200 ($${Math.round(sma200)}) — langfristig bullish`, score: 2, kategorie: 'technisch' });
    if (sma200 != null && price < sma200) signals.push({ text: `Kurs unter SMA200 ($${Math.round(sma200)}) — langfristig bearish`, score: -2, kategorie: 'technisch' });

    // Golden/Death Cross
    if (sma50 != null && sma200 != null) {
      if (sma50 > sma200 * 1.01) signals.push({ text: 'Golden Cross SMA50/200 aktiv — starkes Bullsignal', score: 1.5, kategorie: 'technisch' });
      else if (sma50 < sma200 * 0.99) signals.push({ text: 'Death Cross SMA50/200 — langfristiger Abwärtstrend', score: -1.5, kategorie: 'technisch' });
    }

    // Bollinger Bands
    if (bbPos < 0.1)      signals.push({ text: `Kurs an unterem Bollinger Band — Überverkauft, Reversal möglich`, score: 1.5, kategorie: 'technisch' });
    else if (bbPos < 0.25) signals.push({ text: 'Kurs nahe unterem Bollinger Band', score: 0.8, kategorie: 'technisch' });
    else if (bbPos > 0.9)  signals.push({ text: 'Kurs an oberem Bollinger Band — Überkauft', score: -1, kategorie: 'technisch' });
    else if (bbPos > 0.75) signals.push({ text: 'Kurs nahe oberem Bollinger Band', score: -0.3, kategorie: 'technisch' });

    // Momentum / Trend
    if (change1d > 1.5)  signals.push({ text: `Starke Tagesbewegung +${change1d.toFixed(1)}%`, score: 0.5, kategorie: 'momentum' });
    if (change1d < -1.5) signals.push({ text: `Starke Tagesbewegung ${change1d.toFixed(1)}%`, score: -0.5, kategorie: 'momentum' });
    if (change1m > 8)    signals.push({ text: `Starkes 1M-Momentum +${change1m.toFixed(1)}%`, score: 1, kategorie: 'momentum' });
    if (change1m < -8)   signals.push({ text: `Schwaches 1M-Momentum ${change1m.toFixed(1)}%`, score: -1, kategorie: 'momentum' });
    if (change3m > 15)   signals.push({ text: `Sehr starker 3M-Aufwärtstrend +${change3m.toFixed(1)}%`, score: 1.5, kategorie: 'momentum' });
    if (change3m < -15)  signals.push({ text: `Starker 3M-Abwärtstrend ${change3m.toFixed(1)}%`, score: -1.5, kategorie: 'momentum' });
    if (change1y > 25)   signals.push({ text: `Jahresperformance +${change1y.toFixed(0)}% — starker Bullenmarkt`, score: 1.5, kategorie: 'momentum' });
    if (change1y > 10)   signals.push({ text: `Jahresperformance +${change1y.toFixed(0)}% — positiver Trend`, score: 0.8, kategorie: 'momentum' });
    if (change1y < -10)  signals.push({ text: `Jahresperformance ${change1y.toFixed(0)}% — negativer Trend`, score: -1, kategorie: 'momentum' });

    // Makro-Kontext (statische Faktoren basierend auf bekanntem Stand 2025/2026)
    signals.push({ text: 'Fed-Zinsunsicherheit stützt Goldbedarf als Safe Haven', score: 0.8, kategorie: 'makro' });
    signals.push({ text: 'Zentralbank-Goldkäufe (China, Indien, Russland) auf Rekordniveau', score: 1.2, kategorie: 'makro' });
    signals.push({ text: 'Globale Rezessionsrisiken erhöhen defensiven Goldbedarf', score: 0.6, kategorie: 'makro' });
    signals.push({ text: 'USD-Stärke (DXY) belastet Goldpreis moderat', score: -0.5, kategorie: 'makro' });
    signals.push({ text: 'Geopolitische Spannungen (Ukraine, Naher Osten) stützen Goldnachfrage', score: 0.7, kategorie: 'makro' });

    // Scores nach Zeithorizont gewichten (kurzfristig mehr technisch, langfristig mehr makro)
    const scoreForHorizont = (techW: number, macroW: number) =>
      signals.reduce((sum, s) => {
        const w = s.kategorie === 'makro' ? macroW : (s.kategorie === 'momentum' ? (techW + macroW) / 2 : techW);
        return sum + s.score * w;
      }, 0);

    const score10d  = scoreForHorizont(1.0, 0.2);
    const score30d  = scoreForHorizont(0.9, 0.4);
    const score60d  = scoreForHorizont(0.7, 0.6);
    const score100d = scoreForHorizont(0.5, 0.8);
    const scoreLong = scoreForHorizont(0.2, 1.0);

    const positiveSignals = signals.filter(s => s.score > 0).map(s => s.text);
    const negativeSignals = signals.filter(s => s.score < 0).map(s => s.text);

    const overallScore = scoreForHorizont(0.6, 0.7);

    const technischeSig = signals.filter(s => s.kategorie === 'technisch' || s.kategorie === 'momentum');
    const top5pos = technischeSig.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 5).map(s => s.text);
    const top5neg = technischeSig.filter(s => s.score < 0).sort((a, b) => a.score - b.score).slice(0, 5).map(s => s.text);

    return NextResponse.json({
      // Aktuell
      currentPrice: Math.round(price * 100) / 100,
      change1d: Math.round(change1d * 100) / 100,
      change1m: Math.round(change1m * 100) / 100,
      change3m: Math.round(change3m * 100) / 100,
      change1y: Math.round(change1y * 100) / 100,

      // Technische Indikatoren
      technisch: {
        rsi,
        macd:         Math.round(macd    * 100) / 100,
        macd_signal:  Math.round(macdSig * 100) / 100,
        macd_bullish: macd > macdSig,
        sma20:        sma20  != null ? Math.round(sma20  * 100) / 100 : null,
        sma50:        sma50  != null ? Math.round(sma50  * 100) / 100 : null,
        sma100:       sma100 != null ? Math.round(sma100 * 100) / 100 : null,
        sma200:       sma200 != null ? Math.round(sma200 * 100) / 100 : null,
        bb_upper:     Math.round(bbUpper * 100) / 100,
        bb_lower:     Math.round(bbLower * 100) / 100,
        bb_position:  Math.round(bbPos * 100),
        atr:          Math.round(atr * 100) / 100,
      },

      // Gesamtsentiment
      sentiment:      sentimentFromScore(overallScore),
      gesamt_score:   Math.round(overallScore * 10) / 10,

      // Prognosen je Zeithorizont
      zeithorizonte: {
        '10d':  forecastHorizont(price, score10d,  VOLATILITY['10d'],  top5pos.slice(0, 3)),
        '30d':  forecastHorizont(price, score30d,  VOLATILITY['30d'],  top5pos.slice(0, 3)),
        '60d':  forecastHorizont(price, score60d,  VOLATILITY['60d'],  top5pos.slice(0, 4)),
        '100d': forecastHorizont(price, score100d, VOLATILITY['100d'], top5pos.slice(0, 4)),
        '6m':   forecastHorizont(price, scoreLong, VOLATILITY['6m'],   top5pos),
        '12m':  forecastHorizont(price, scoreLong, VOLATILITY['12m'],  top5pos),
        '24m':  forecastHorizont(price, scoreLong, VOLATILITY['24m'],  top5pos),
      },

      // Für Kompatibilität mit alter Darstellung
      kurzfristig: {
        richtung:    richtungFromScore(score30d),
        begruendung: `RSI ${rsi}, MACD ${macd > macdSig ? 'bullish' : 'bearish'}, Kurs ${price > (sma50 ?? 0) ? 'über' : 'unter'} SMA50. ${change1m > 0 ? 'Positives' : 'Negatives'} 1-Monats-Momentum (${change1m.toFixed(1)}%).`,
        ziel: `$${Math.round(price * (1 - VOLATILITY['30d'] * 0.5))} – $${Math.round(price * (1 + VOLATILITY['30d'] * 0.5))}`,
      },
      mittelfristig: {
        richtung:    richtungFromScore(score100d),
        begruendung: `Jahrestrend ${change1y > 0 ? '+' : ''}${change1y.toFixed(1)}%. ${sma200 != null ? (price > sma200 ? 'Kurs über SMA200 — langfristig bullish.' : 'Kurs unter SMA200 — langfristig bearish.') : ''} Zentralbankankäufe und geopolitische Faktoren beeinflussen den Markt.`,
        ziel: `$${Math.round(price * (1 - VOLATILITY['100d'] * 0.5))} – $${Math.round(price * (1 + VOLATILITY['100d'] * 0.5))}`,
      },
      faktoren:  positiveSignals.slice(0, 5),
      risiken:   negativeSignals.map(s => s.replace(/^.*?— /, '')).slice(0, 4).concat([
        'Unerwartete Fed-Zinserhöhungen könnten Gold belasten',
        'USD-Stärkung durch bessere US-Wirtschaftsdaten',
        'Rückgang der Risikoaversion bei positiven geopolitischen Entwicklungen',
      ]).slice(0, 5),
    }, {
      headers: { 'Cache-Control': 'max-age=3600' },
    });

  } catch (err) {
    console.error('Prognose error:', err);
    return NextResponse.json({ error: 'Prognose konnte nicht erstellt werden' }, { status: 500 });
  }
}
