/**
 * TypeScript Interfaces für DB_TimeBook
 * Generiert aus db_timebook_schema.json
 */

// ============================================
// ENUM TYPES
// ============================================

export type Geschlecht = 'männlich' | 'weiblich' | 'divers' | 'm' | 'w' | 'd';
export type AuditAktion = 'INSERT' | 'UPDATE' | 'DELETE';

// ============================================
// PERSONLOGIN / MITARBEITER
// ============================================

export interface PersonLogin {
  id: number;
  username: string;
  hashed_passwort: string;
  email: string;
  vorname?: string | null;
  nachname?: string | null;
  adresse?: string | null;
  geburtsdatum?: string | null; // ISO Date string
  geschlecht?: Geschlecht | null;
  admin: number; // 0 = normal, 1 = admin
  login_versuche: number;
  letzte_login_sperre?: string | null; // ISO DateTime string
  aktiv: boolean;
  telefon?: string | null;
  position?: string | null;
  notizen?: string | null;
  erstellt_am: string;
  aktualisiert_am: string;
  reserve1?: string | null;
  reserve2?: string | null;
  reserve3?: string | null;
}

// Für Session (ohne sensible Daten)
export interface UserSession {
  id: number;
  username: string;
  email: string;
  vorname?: string | null;
  nachname?: string | null;
  admin: number;
}

// Für Login-Request
export interface LoginRequest {
  username: string;
  password: string;
}

// Für Registrierung
export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  vorname?: string;
  nachname?: string;
}

// ============================================
// LOGIN-VERSUCHE HISTORIE
// ============================================

export interface LoginVersuchHistorie {
  id: number;
  mitarbeiter_id: number;
  versuch_zeitpunkt: string;
  erfolgreich: boolean;
  ip_adresse?: string | null;
  user_agent?: string | null;
  fehlermeldung?: string | null;
}

// ============================================
// KUNDEN
// ============================================

export interface Kunde {
  id: string; // UUID
  mitarbeiter_id: number;
  kundennummer?: string | null;
  firmenname?: string | null;
  ansprechperson_vorname?: string | null;
  ansprechperson_nachname?: string | null;
  geschlecht?: Geschlecht | null;
  // Adresse
  strasse?: string | null;
  hausnummer?: string | null;
  plz?: string | null;
  ort?: string | null;
  land?: string | null;
  // Kontakt
  telefon?: string | null;
  mobil?: string | null;
  email?: string | null;
  website?: string | null;
  // Steuer/Finanzen
  uid_nummer?: string | null;
  steuernummer?: string | null;
  zahlungsziel_tage: number;
  // Meta
  aktiv: boolean;
  notizen?: string | null;
  interne_notizen?: string | null;
  erstellt_am: string;
  aktualisiert_am: string;
  reserve1?: string | null;
  reserve2?: string | null;
  reserve3?: string | null;
}

export interface KundeCreateRequest {
  firmenname?: string;
  ansprechperson_vorname?: string;
  ansprechperson_nachname?: string;
  geschlecht?: Geschlecht;
  strasse?: string;
  hausnummer?: string;
  plz?: string;
  ort?: string;
  land?: string;
  telefon?: string;
  mobil?: string;
  email?: string;
  website?: string;
  uid_nummer?: string;
  steuernummer?: string;
  zahlungsziel_tage?: number;
  notizen?: string;
}

// ============================================
// DIENSTLEISTUNGSKATEGORIEN
// ============================================

export interface Dienstleistungskategorie {
  id: number;
  mitarbeiter_id: number;
  bezeichnung: string;
  beschreibung?: string | null;
  standard_stundensatz?: number | null;
  farbe?: string | null; // Hex color
  aktiv: boolean;
  erstellt_am: string;
}

// ============================================
// DIENSTLEISTUNGEN / ZEITERFASSUNG
// ============================================

export interface Dienstleistung {
  id: string; // UUID
  mitarbeiter_id: number;
  kunde_id: string; // UUID
  kategorie_id?: number | null;
  // Zeit
  start_datum: string; // YYYY-MM-DD
  start_zeit: string; // HH:MM
  ende_datum?: string | null;
  ende_zeit?: string | null;
  // Berechnet (automatisch von DB)
  start_timestamp?: string | null;
  ende_timestamp?: string | null;
  dauer_minuten?: number | null;
  dauer_stunden?: number | null;
  // Beschreibung
  titel?: string | null;
  beschreibung: string;
  // Finanzen
  stundensatz?: number | null;
  pauschale?: number | null;
  gesamtbetrag?: number | null;
  // Status
  abgeschlossen: boolean;
  abgerechnet: boolean;
  abgerechnet_am?: string | null;
  fakturiert: boolean;
  // Meta
  interne_notizen?: string | null;
  notizen?: string | null;
  erstellt_am: string;
  aktualisiert_am: string;
  reserve1?: string | null;
  reserve2?: string | null;
  reserve3?: string | null;
}

// Request für neue Zeiterfassung
export interface ZeiterfassungCreateRequest {
  kunde_id: string;
  kategorie_id?: number;
  start_datum: string; // YYYY-MM-DD
  start_zeit: string; // HH:MM
  ende_datum?: string;
  ende_zeit?: string;
  titel?: string;
  beschreibung: string;
  stundensatz?: number;
}

// Request für Zeiterfassung beenden
export interface ZeiterfassungBeendenRequest {
  ende_datum: string; // YYYY-MM-DD
  ende_zeit: string; // HH:MM
}

// ============================================
// HONORARNOTEN / RECHNUNGEN
// ============================================

export interface Honorarnote {
  id: string; // UUID
  mitarbeiter_id: number;
  kunde_id: string; // UUID
  rechnungsnummer: string;
  rechnungsdatum: string;
  leistungsdatum_von?: string | null;
  leistungsdatum_bis?: string | null;
  faelligkeitsdatum?: string | null;
  // Beträge
  nettobetrag: number;
  steuersatz: number;
  steuerbetrag: number; // automatisch berechnet
  bruttobetrag: number; // automatisch berechnet
  // Zahlungsstatus
  bezahlt: boolean;
  bezahlt_am?: string | null;
  zahlungsmethode?: string | null;
  // Status
  storniert: boolean;
  storniert_am?: string | null;
  storno_grund?: string | null;
  // Meta
  notizen?: string | null;
  interne_notizen?: string | null;
  erstellt_am: string;
  aktualisiert_am: string;
  reserve1?: string | null;
  reserve2?: string | null;
  reserve3?: string | null;
}

export interface HonorarnotePosition {
  id: string; // UUID
  honorarnote_id: string;
  dienstleistung_id?: string | null;
  position_nr: number;
  beschreibung: string;
  menge: number;
  einheit: string;
  einzelpreis: number;
  gesamtpreis: number; // automatisch berechnet
  erstellt_am: string;
  reserve1?: string | null;
  reserve2?: string | null;
}

// ============================================
// STUNDENZETTEL
// ============================================

export interface Stundenzettel {
  id: string; // UUID
  mitarbeiter_id: number;
  jahr: number;
  monat: number; // 1-12
  soll_stunden: number;
  ist_stunden: number;
  ueberstunden: number; // automatisch berechnet
  freigegeben: boolean;
  freigegeben_am?: string | null;
  freigegeben_von?: number | null;
  notizen?: string | null;
  erstellt_am: string;
  aktualisiert_am: string;
}

// ============================================
// AUDIT LOG
// ============================================

export interface AuditLog {
  id: number;
  tabelle: string;
  datensatz_id: string;
  aktion: AuditAktion;
  mitarbeiter_id?: number | null;
  alte_daten?: Record<string, unknown> | null;
  neue_daten?: Record<string, unknown> | null;
  zeitstempel: string;
  ip_adresse?: string | null;
}

// ============================================
// VIEW TYPES
// ============================================

export interface StundenMonatlich {
  mitarbeiter_id: number;
  username: string;
  vorname?: string | null;
  nachname?: string | null;
  jahr: number;
  monat: number;
  jahr_monat: string;
  anzahl_eintraege: number;
  stunden_gesamt: number;
  stunden_gerundet: number;
  umsatz_gesamt: number;
}

export interface StundenTaeglich {
  mitarbeiter_id: number;
  username: string;
  vorname?: string | null;
  nachname?: string | null;
  datum: string;
  wochentag: string;
  anzahl_eintraege: number;
  stunden_gesamt: number;
  stunden_gerundet: number;
}

export interface OffeneRechnung {
  id: string;
  rechnungsnummer: string;
  rechnungsdatum: string;
  faelligkeitsdatum: string;
  tage_ueberfaellig: number;
  bruttobetrag: number;
  mitarbeiter_id: number;
  mitarbeiter_name: string;
  firmenname?: string | null;
  kunde_name: string;
  kunde_email?: string | null;
}

export interface LaufendeDienstleistung {
  id: string;
  start_datum: string;
  start_zeit: string;
  titel?: string | null;
  beschreibung: string;
  mitarbeiter_id: number;
  mitarbeiter_name: string;
  kunde: string;
  stunden_seit_start: number;
}

// ============================================
// VALIDATION TYPES
// ============================================

export interface ZeiterfassungValidation {
  datum: string;
  startzeit: string;
  endzeit: string;
  dauer_minuten?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  dauer_minuten?: number;
  dauer_anzeige?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string | string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Berechnet die Dauer in Minuten aus Start- und Endzeit
 */
export function berechneDauerMinuten(startzeit: string, endzeit: string): number | null {
  const startMatch = startzeit.match(/^(\d{1,2}):(\d{2})$/);
  const endeMatch = endzeit.match(/^(\d{1,2}):(\d{2})$/);

  if (!startMatch || !endeMatch) return null;

  const startMinuten = parseInt(startMatch[1]) * 60 + parseInt(startMatch[2]);
  const endeMinuten = parseInt(endeMatch[1]) * 60 + parseInt(endeMatch[2]);

  return endeMinuten - startMinuten;
}

/**
 * Formatiert Minuten als H:MM Anzeige
 */
export function formatiereMinutenAlsZeit(minuten: number): string {
  if (minuten < 0) return '-' + formatiereMinutenAlsZeit(Math.abs(minuten));
  const h = Math.floor(minuten / 60);
  const m = minuten % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

/**
 * Formatiert Minuten als "X Std Y Min" Anzeige
 */
export function formatiereMinutenLang(minuten: number): string {
  if (minuten < 0) return '-' + formatiereMinutenLang(Math.abs(minuten));
  const h = Math.floor(minuten / 60);
  const m = minuten % 60;
  if (h === 0) return `${m} Min`;
  if (m === 0) return `${h} Std`;
  return `${h} Std ${m} Min`;
}

/**
 * Validiert eine Zeiterfassung
 */
export function validiereZeiterfassung(
  data: ZeiterfassungValidation,
  maxDauerStunden: number = 16
): ValidationResult {
  const errors: ValidationError[] = [];
  const MAX_MINUTEN = maxDauerStunden * 60;

  // Datum validieren
  if (!data.datum) {
    errors.push({ field: 'datum', message: 'Bitte Datum angeben.' });
  } else {
    const datum = new Date(data.datum);
    const heute = new Date();
    heute.setHours(23, 59, 59, 999);
    if (datum > heute) {
      errors.push({ field: 'datum', message: 'Das Datum darf nicht in der Zukunft liegen.' });
    }
  }

  // Zeitformat validieren
  const zeitRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;

  if (!data.startzeit) {
    errors.push({ field: 'startzeit', message: 'Bitte Startzeit im Format HH:MM eingeben (z. B. 08:00).' });
  } else if (!zeitRegex.test(data.startzeit)) {
    errors.push({ field: 'startzeit', message: 'Ungültiges Zeitformat. Bitte HH:MM verwenden.' });
  }

  if (!data.endzeit) {
    errors.push({ field: 'endzeit', message: 'Bitte Endzeit im Format HH:MM eingeben (z. B. 17:30).' });
  } else if (!zeitRegex.test(data.endzeit)) {
    errors.push({ field: 'endzeit', message: 'Ungültiges Zeitformat. Bitte HH:MM verwenden.' });
  }

  // Dauer berechnen und validieren
  let dauer_minuten: number | undefined;
  let dauer_anzeige: string | undefined;

  if (zeitRegex.test(data.startzeit) && zeitRegex.test(data.endzeit)) {
    const berechnet = berechneDauerMinuten(data.startzeit, data.endzeit);

    if (berechnet !== null) {
      if (berechnet < 0) {
        errors.push({ field: 'dauer', message: 'Die Startzeit darf nicht nach der Endzeit liegen.' });
      } else if (berechnet === 0) {
        errors.push({ field: 'dauer', message: 'Die Dauer darf nicht 0 sein.' });
      } else if (berechnet > MAX_MINUTEN) {
        errors.push({ field: 'dauer', message: `Die erfasste Dauer überschreitet den erlaubten Maximalwert (${maxDauerStunden} Stunden).` });
      } else {
        dauer_minuten = berechnet;
        dauer_anzeige = formatiereMinutenAlsZeit(berechnet);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    dauer_minuten,
    dauer_anzeige
  };
}
