// Gemeinsame TypeScript-Interfaces für Fitness-Berechnungskomponenten

export type Gender = 'male' | 'female';
export type UnitSystem = 'metric' | 'imperial';
export type Lang = 'en' | 'de' | 'la';

/** Gemeinsame persönliche Daten, die vom Hub an Komponenten weitergegeben werden */
export interface PersonalData {
  gender: Gender;
  age: number | null;
  weight: number | null; // kg
  height: number | null; // cm
}

// ─── BMI ────────────────────────────────────────────────────────────────────

export interface BmiResult {
  value: number;
  category: string;
  color: string;
  bg: string;
}

// ─── Body Fat ────────────────────────────────────────────────────────────────

export interface BodyFatResult {
  percentage: number;
  category: string;
  color: string;
  bg: string;
}

// ─── WHR ─────────────────────────────────────────────────────────────────────

export type WhrRisk = 'low' | 'moderate' | 'high';

export interface WhrResult {
  ratio: number;
  risk: WhrRisk;
  label: string;
  color: string;
  bg: string;
}

// ─── TDEE ────────────────────────────────────────────────────────────────────

export type ActivityLevel = {
  label: string;
  labelDe: string;
  factor: number;
};

export interface TdeeResult {
  bmr: number;
  tdee: number;
  lose: number;   // tdee - 500
  maintain: number;
  gain: number;   // tdee + 500
}

// ─── 1RM ─────────────────────────────────────────────────────────────────────

export interface OneRmResult {
  brzycki: number;
  epley: number;
  percentages: { pct: number; weight: number }[];
}

// ─── Ruhepuls ────────────────────────────────────────────────────────────────

export type HrCategory = 'athlete' | 'good' | 'normal' | 'elevated' | 'high';

export interface RestingHrResult {
  bpm: number;
  category: HrCategory;
  label: string;
  description: string;
  color: string;
  bg: string;
}

// ─── VO2max ──────────────────────────────────────────────────────────────────

export type Vo2Method = 'cooper' | 'heartrate';

export interface Vo2maxResult {
  value: number;
  category: string;
  color: string;
  bg: string;
}

// ─── HRV ─────────────────────────────────────────────────────────────────────

export interface HrvAgeRange {
  age: string;
  male: string;
  female: string;
  interpretation: string;
}
