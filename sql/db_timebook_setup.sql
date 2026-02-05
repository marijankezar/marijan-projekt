-- ============================================
-- DB_TIMEBOOK - MITARBEITER-ZEITERFASSUNGS-DATENBANK
-- Vollständiges Setup Script
-- Version: 1.0.0
-- ============================================

-- Verbindung zur Datenbank herstellen
-- \c db_timebook

-- Extension für UUID Support aktivieren
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. MITARBEITER / PERSONLOGIN TABELLE
-- ============================================

CREATE SEQUENCE IF NOT EXISTS personlogin_id_seq;

CREATE TABLE IF NOT EXISTS public.personlogin
(
    id INTEGER NOT NULL DEFAULT nextval('personlogin_id_seq'::regclass),
    username VARCHAR(100) NOT NULL,
    hashed_passwort TEXT NOT NULL,
    email VARCHAR(255) NOT NULL,
    vorname VARCHAR(50),
    nachname VARCHAR(50),
    adresse TEXT,
    geburtsdatum DATE,
    geschlecht VARCHAR(10) CHECK (geschlecht IN ('männlich', 'weiblich', 'divers', 'm', 'w', 'd')),
    admin INTEGER DEFAULT 0,
    login_versuche INTEGER DEFAULT 0,
    letzte_login_sperre TIMESTAMP WITHOUT TIME ZONE,
    aktiv BOOLEAN DEFAULT true,
    telefon VARCHAR(50),
    position VARCHAR(100),
    notizen TEXT,
    erstellt_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    aktualisiert_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reserve1 VARCHAR(255),
    reserve2 VARCHAR(255),
    reserve3 TEXT,
    CONSTRAINT personlogin_pkey PRIMARY KEY (id),
    CONSTRAINT personlogin_email_key UNIQUE (email),
    CONSTRAINT personlogin_username_key UNIQUE (username)
);

CREATE INDEX IF NOT EXISTS idx_personlogin_username ON public.personlogin USING btree (username);
CREATE INDEX IF NOT EXISTS idx_personlogin_email ON public.personlogin USING btree (email);
CREATE INDEX IF NOT EXISTS idx_personlogin_aktiv ON public.personlogin USING btree (aktiv);

COMMENT ON TABLE personlogin IS 'Haupttabelle für Mitarbeiter/Benutzer mit Login-Daten und Sperrmechanismus';
COMMENT ON COLUMN personlogin.login_versuche IS 'Anzahl fehlgeschlagener Login-Versuche';
COMMENT ON COLUMN personlogin.letzte_login_sperre IS 'Zeitpunkt der letzten Sperre nach 3 Fehlversuchen';

-- ============================================
-- 2. LOGIN-VERSUCHE HISTORIE
-- ============================================

CREATE TABLE IF NOT EXISTS public.login_versuche_historie
(
    id SERIAL PRIMARY KEY,
    mitarbeiter_id INTEGER NOT NULL,
    versuch_zeitpunkt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    erfolgreich BOOLEAN DEFAULT false,
    ip_adresse INET,
    user_agent TEXT,
    fehlermeldung VARCHAR(255),
    CONSTRAINT fk_login_versuche_mitarbeiter FOREIGN KEY (mitarbeiter_id)
        REFERENCES personlogin(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_login_versuche_mitarbeiter ON login_versuche_historie(mitarbeiter_id);
CREATE INDEX IF NOT EXISTS idx_login_versuche_zeitpunkt ON login_versuche_historie(versuch_zeitpunkt DESC);

COMMENT ON TABLE login_versuche_historie IS 'Protokolliert alle Login-Versuche für Sicherheit und Audit';

-- ============================================
-- 3. KUNDEN TABELLE
-- ============================================

CREATE SEQUENCE IF NOT EXISTS kunden_nummer_seq START 10000;

CREATE TABLE IF NOT EXISTS public.kunden
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mitarbeiter_id INTEGER NOT NULL,
    kundennummer VARCHAR(50) UNIQUE,
    firmenname VARCHAR(255),
    ansprechperson_vorname VARCHAR(100),
    ansprechperson_nachname VARCHAR(100),
    geschlecht VARCHAR(10) CHECK (geschlecht IN ('männlich', 'weiblich', 'divers', 'm', 'w', 'd')),
    strasse VARCHAR(255),
    hausnummer VARCHAR(20),
    plz VARCHAR(10),
    ort VARCHAR(100),
    land VARCHAR(100) DEFAULT 'Österreich',
    telefon VARCHAR(50),
    mobil VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    uid_nummer VARCHAR(50),
    steuernummer VARCHAR(50),
    zahlungsziel_tage INTEGER DEFAULT 30,
    aktiv BOOLEAN DEFAULT true,
    notizen TEXT,
    interne_notizen TEXT,
    erstellt_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    aktualisiert_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reserve1 VARCHAR(255),
    reserve2 VARCHAR(255),
    reserve3 TEXT,
    CONSTRAINT fk_kunden_mitarbeiter FOREIGN KEY (mitarbeiter_id)
        REFERENCES personlogin(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_kunden_mitarbeiter ON kunden(mitarbeiter_id);
CREATE INDEX IF NOT EXISTS idx_kunden_kundennummer ON kunden(kundennummer);
CREATE INDEX IF NOT EXISTS idx_kunden_aktiv ON kunden(aktiv);

COMMENT ON TABLE kunden IS 'Kundenstammdaten - jeder Mitarbeiter sieht nur seine eigenen Kunden';

-- ============================================
-- 4. DIENSTLEISTUNGSKATEGORIEN
-- ============================================

CREATE TABLE IF NOT EXISTS public.dienstleistungskategorien
(
    id SERIAL PRIMARY KEY,
    mitarbeiter_id INTEGER NOT NULL,
    bezeichnung VARCHAR(100) NOT NULL,
    beschreibung TEXT,
    standard_stundensatz DECIMAL(10, 2),
    farbe VARCHAR(7),
    aktiv BOOLEAN DEFAULT true,
    erstellt_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_kategorie_mitarbeiter FOREIGN KEY (mitarbeiter_id)
        REFERENCES personlogin(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_kategorie_mitarbeiter ON dienstleistungskategorien(mitarbeiter_id);

-- ============================================
-- 5. DIENSTLEISTUNGEN / ZEITERFASSUNG
-- ============================================

CREATE TABLE IF NOT EXISTS public.dienstleistungen
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mitarbeiter_id INTEGER NOT NULL,
    kunde_id UUID NOT NULL,
    kategorie_id INTEGER,
    -- Zeit
    start_datum DATE NOT NULL,
    start_zeit TIME NOT NULL,
    ende_datum DATE,
    ende_zeit TIME,
    -- Berechnet
    start_timestamp TIMESTAMP GENERATED ALWAYS AS (start_datum + start_zeit) STORED,
    ende_timestamp TIMESTAMP GENERATED ALWAYS AS (ende_datum + ende_zeit) STORED,
    dauer_minuten INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN ende_datum IS NOT NULL AND ende_zeit IS NOT NULL
            THEN EXTRACT(EPOCH FROM ((ende_datum + ende_zeit) - (start_datum + start_zeit)))::INTEGER / 60
            ELSE NULL
        END
    ) STORED,
    dauer_stunden DECIMAL(10, 2) GENERATED ALWAYS AS (
        CASE
            WHEN ende_datum IS NOT NULL AND ende_zeit IS NOT NULL
            THEN ROUND(EXTRACT(EPOCH FROM ((ende_datum + ende_zeit) - (start_datum + start_zeit)))::NUMERIC / 3600, 2)
            ELSE NULL
        END
    ) STORED,
    -- Beschreibung
    titel VARCHAR(255),
    beschreibung TEXT NOT NULL,
    -- Finanzen
    stundensatz DECIMAL(10, 2),
    pauschale DECIMAL(10, 2),
    gesamtbetrag DECIMAL(10, 2),
    -- Status
    abgeschlossen BOOLEAN DEFAULT false,
    abgerechnet BOOLEAN DEFAULT false,
    abgerechnet_am TIMESTAMP,
    fakturiert BOOLEAN DEFAULT false,
    -- Meta
    interne_notizen TEXT,
    notizen TEXT,
    erstellt_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    aktualisiert_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reserve1 VARCHAR(255),
    reserve2 VARCHAR(255),
    reserve3 TEXT,
    CONSTRAINT fk_dienstleistungen_mitarbeiter FOREIGN KEY (mitarbeiter_id)
        REFERENCES personlogin(id) ON DELETE CASCADE,
    CONSTRAINT fk_dienstleistungen_kunde FOREIGN KEY (kunde_id)
        REFERENCES kunden(id) ON DELETE CASCADE,
    CONSTRAINT fk_dienstleistungen_kategorie FOREIGN KEY (kategorie_id)
        REFERENCES dienstleistungskategorien(id) ON DELETE SET NULL,
    CONSTRAINT check_ende_nach_start CHECK (
        ende_datum IS NULL OR ende_zeit IS NULL OR
        (ende_datum + ende_zeit) > (start_datum + start_zeit)
    )
);

CREATE INDEX IF NOT EXISTS idx_dienstleistungen_mitarbeiter ON dienstleistungen(mitarbeiter_id);
CREATE INDEX IF NOT EXISTS idx_dienstleistungen_kunde ON dienstleistungen(kunde_id);
CREATE INDEX IF NOT EXISTS idx_dienstleistungen_datum ON dienstleistungen(start_datum DESC);
CREATE INDEX IF NOT EXISTS idx_dienstleistungen_abgerechnet ON dienstleistungen(abgerechnet);
CREATE INDEX IF NOT EXISTS idx_dienstleistungen_kategorie ON dienstleistungen(kategorie_id);

COMMENT ON TABLE dienstleistungen IS 'Zeiterfassung und Dienstleistungen mit automatischer Stundenberechnung';
COMMENT ON COLUMN dienstleistungen.dauer_minuten IS 'Automatisch berechnet aus Start- und Endzeit';
COMMENT ON COLUMN dienstleistungen.dauer_stunden IS 'Automatisch berechnet in Stunden mit 2 Dezimalstellen';

-- ============================================
-- 6. HONORARNOTEN / RECHNUNGEN
-- ============================================

CREATE SEQUENCE IF NOT EXISTS rechnungsnummer_seq START 1000;

CREATE TABLE IF NOT EXISTS public.honorarnoten
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mitarbeiter_id INTEGER NOT NULL,
    kunde_id UUID NOT NULL,
    rechnungsnummer VARCHAR(50) UNIQUE NOT NULL,
    rechnungsdatum DATE NOT NULL DEFAULT CURRENT_DATE,
    leistungsdatum_von DATE,
    leistungsdatum_bis DATE,
    faelligkeitsdatum DATE,
    nettobetrag DECIMAL(10, 2) NOT NULL DEFAULT 0,
    steuersatz DECIMAL(5, 2) DEFAULT 20.00,
    steuerbetrag DECIMAL(10, 2) GENERATED ALWAYS AS (
        ROUND(nettobetrag * steuersatz / 100, 2)
    ) STORED,
    bruttobetrag DECIMAL(10, 2) GENERATED ALWAYS AS (
        ROUND(nettobetrag + (nettobetrag * steuersatz / 100), 2)
    ) STORED,
    bezahlt BOOLEAN DEFAULT false,
    bezahlt_am DATE,
    zahlungsmethode VARCHAR(50),
    storniert BOOLEAN DEFAULT false,
    storniert_am TIMESTAMP,
    storno_grund TEXT,
    notizen TEXT,
    interne_notizen TEXT,
    erstellt_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    aktualisiert_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reserve1 VARCHAR(255),
    reserve2 VARCHAR(255),
    reserve3 TEXT,
    CONSTRAINT fk_honorarnoten_mitarbeiter FOREIGN KEY (mitarbeiter_id)
        REFERENCES personlogin(id) ON DELETE CASCADE,
    CONSTRAINT fk_honorarnoten_kunde FOREIGN KEY (kunde_id)
        REFERENCES kunden(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_honorarnoten_mitarbeiter ON honorarnoten(mitarbeiter_id);
CREATE INDEX IF NOT EXISTS idx_honorarnoten_kunde ON honorarnoten(kunde_id);
CREATE INDEX IF NOT EXISTS idx_honorarnoten_rechnungsnummer ON honorarnoten(rechnungsnummer);
CREATE INDEX IF NOT EXISTS idx_honorarnoten_datum ON honorarnoten(rechnungsdatum DESC);
CREATE INDEX IF NOT EXISTS idx_honorarnoten_bezahlt ON honorarnoten(bezahlt);

COMMENT ON TABLE honorarnoten IS 'Rechnungen/Honorarnoten mit automatischer Betragsberechnung';

-- ============================================
-- 7. HONORARNOTEN POSITIONEN
-- ============================================

CREATE TABLE IF NOT EXISTS public.honorarnoten_positionen
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    honorarnote_id UUID NOT NULL,
    dienstleistung_id UUID,
    position_nr INTEGER NOT NULL,
    beschreibung TEXT NOT NULL,
    menge DECIMAL(10, 3) NOT NULL DEFAULT 1,
    einheit VARCHAR(50) DEFAULT 'Stunden',
    einzelpreis DECIMAL(10, 2) NOT NULL,
    gesamtpreis DECIMAL(10, 2) GENERATED ALWAYS AS (
        ROUND(menge * einzelpreis, 2)
    ) STORED,
    erstellt_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reserve1 VARCHAR(255),
    reserve2 VARCHAR(255),
    CONSTRAINT fk_positionen_honorarnote FOREIGN KEY (honorarnote_id)
        REFERENCES honorarnoten(id) ON DELETE CASCADE,
    CONSTRAINT fk_positionen_dienstleistung FOREIGN KEY (dienstleistung_id)
        REFERENCES dienstleistungen(id) ON DELETE SET NULL,
    CONSTRAINT unique_position_nr UNIQUE (honorarnote_id, position_nr)
);

CREATE INDEX IF NOT EXISTS idx_positionen_honorarnote ON honorarnoten_positionen(honorarnote_id);
CREATE INDEX IF NOT EXISTS idx_positionen_dienstleistung ON honorarnoten_positionen(dienstleistung_id);

COMMENT ON TABLE honorarnoten_positionen IS 'Einzelpositionen einer Rechnung';

-- ============================================
-- 8. STUNDENZETTEL / MONATSÜBERSICHT
-- ============================================

CREATE TABLE IF NOT EXISTS public.stundenzettel
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mitarbeiter_id INTEGER NOT NULL,
    jahr INTEGER NOT NULL,
    monat INTEGER NOT NULL CHECK (monat BETWEEN 1 AND 12),
    soll_stunden DECIMAL(10, 2) DEFAULT 0,
    ist_stunden DECIMAL(10, 2) DEFAULT 0,
    ueberstunden DECIMAL(10, 2) GENERATED ALWAYS AS (
        ist_stunden - soll_stunden
    ) STORED,
    freigegeben BOOLEAN DEFAULT false,
    freigegeben_am TIMESTAMP,
    freigegeben_von INTEGER,
    notizen TEXT,
    erstellt_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    aktualisiert_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stundenzettel_mitarbeiter FOREIGN KEY (mitarbeiter_id)
        REFERENCES personlogin(id) ON DELETE CASCADE,
    CONSTRAINT fk_stundenzettel_freigeber FOREIGN KEY (freigegeben_von)
        REFERENCES personlogin(id) ON DELETE SET NULL,
    CONSTRAINT unique_mitarbeiter_monat UNIQUE (mitarbeiter_id, jahr, monat)
);

CREATE INDEX IF NOT EXISTS idx_stundenzettel_mitarbeiter ON stundenzettel(mitarbeiter_id);
CREATE INDEX IF NOT EXISTS idx_stundenzettel_jahr_monat ON stundenzettel(jahr, monat);

COMMENT ON TABLE stundenzettel IS 'Monatliche Stundenübersichten pro Mitarbeiter';

-- ============================================
-- 9. AUDIT LOG / ÄNDERUNGSPROTOKOLL
-- ============================================

CREATE TABLE IF NOT EXISTS public.audit_log
(
    id BIGSERIAL PRIMARY KEY,
    tabelle VARCHAR(100) NOT NULL,
    datensatz_id VARCHAR(100) NOT NULL,
    aktion VARCHAR(20) NOT NULL CHECK (aktion IN ('INSERT', 'UPDATE', 'DELETE')),
    mitarbeiter_id INTEGER,
    alte_daten JSONB,
    neue_daten JSONB,
    zeitstempel TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_adresse INET,
    CONSTRAINT fk_audit_mitarbeiter FOREIGN KEY (mitarbeiter_id)
        REFERENCES personlogin(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_tabelle ON audit_log(tabelle);
CREATE INDEX IF NOT EXISTS idx_audit_zeitstempel ON audit_log(zeitstempel DESC);
CREATE INDEX IF NOT EXISTS idx_audit_mitarbeiter ON audit_log(mitarbeiter_id);

-- ============================================
-- FUNKTIONEN & TRIGGER
-- ============================================

-- Funktion: Aktualisierungszeitstempel automatisch setzen
CREATE OR REPLACE FUNCTION update_aktualisiert_am()
RETURNS TRIGGER AS $$
BEGIN
    NEW.aktualisiert_am = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für alle relevanten Tabellen
DROP TRIGGER IF EXISTS trigger_personlogin_updated ON personlogin;
CREATE TRIGGER trigger_personlogin_updated
    BEFORE UPDATE ON personlogin
    FOR EACH ROW EXECUTE FUNCTION update_aktualisiert_am();

DROP TRIGGER IF EXISTS trigger_kunden_updated ON kunden;
CREATE TRIGGER trigger_kunden_updated
    BEFORE UPDATE ON kunden
    FOR EACH ROW EXECUTE FUNCTION update_aktualisiert_am();

DROP TRIGGER IF EXISTS trigger_dienstleistungen_updated ON dienstleistungen;
CREATE TRIGGER trigger_dienstleistungen_updated
    BEFORE UPDATE ON dienstleistungen
    FOR EACH ROW EXECUTE FUNCTION update_aktualisiert_am();

DROP TRIGGER IF EXISTS trigger_honorarnoten_updated ON honorarnoten;
CREATE TRIGGER trigger_honorarnoten_updated
    BEFORE UPDATE ON honorarnoten
    FOR EACH ROW EXECUTE FUNCTION update_aktualisiert_am();

DROP TRIGGER IF EXISTS trigger_stundenzettel_updated ON stundenzettel;
CREATE TRIGGER trigger_stundenzettel_updated
    BEFORE UPDATE ON stundenzettel
    FOR EACH ROW EXECUTE FUNCTION update_aktualisiert_am();

-- ============================================
-- Funktion: Login-Sperre prüfen
-- ============================================

CREATE OR REPLACE FUNCTION pruefe_login_sperre(p_mitarbeiter_id INTEGER)
RETURNS TABLE(
    gesperrt BOOLEAN,
    verbleibende_sekunden INTEGER,
    fehlversuche INTEGER
) AS $$
DECLARE
    v_login_versuche INTEGER;
    v_letzte_sperre TIMESTAMP;
    v_sperre_ende TIMESTAMP;
BEGIN
    SELECT
        personlogin.login_versuche,
        personlogin.letzte_login_sperre
    INTO v_login_versuche, v_letzte_sperre
    FROM personlogin
    WHERE id = p_mitarbeiter_id;

    IF v_letzte_sperre IS NOT NULL THEN
        v_sperre_ende := v_letzte_sperre + INTERVAL '5 minutes';

        IF v_sperre_ende > CURRENT_TIMESTAMP THEN
            RETURN QUERY SELECT
                true::BOOLEAN,
                EXTRACT(EPOCH FROM (v_sperre_ende - CURRENT_TIMESTAMP))::INTEGER,
                v_login_versuche;
            RETURN;
        ELSE
            UPDATE personlogin
            SET login_versuche = 0, letzte_login_sperre = NULL
            WHERE id = p_mitarbeiter_id;
            v_login_versuche := 0;
        END IF;
    END IF;

    RETURN QUERY SELECT
        false::BOOLEAN,
        0::INTEGER,
        COALESCE(v_login_versuche, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Funktion: Login-Versuch registrieren
-- ============================================

CREATE OR REPLACE FUNCTION registriere_login_versuch(
    p_mitarbeiter_id INTEGER,
    p_erfolgreich BOOLEAN,
    p_ip_adresse INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO login_versuche_historie (
        mitarbeiter_id, erfolgreich, ip_adresse, user_agent
    ) VALUES (
        p_mitarbeiter_id, p_erfolgreich, p_ip_adresse, p_user_agent
    );

    IF p_erfolgreich THEN
        UPDATE personlogin
        SET login_versuche = 0, letzte_login_sperre = NULL
        WHERE id = p_mitarbeiter_id;
    ELSE
        UPDATE personlogin
        SET login_versuche = login_versuche + 1
        WHERE id = p_mitarbeiter_id;

        UPDATE personlogin
        SET letzte_login_sperre = CURRENT_TIMESTAMP
        WHERE id = p_mitarbeiter_id AND login_versuche >= 3;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Funktion: Kundennummer automatisch generieren
-- ============================================

CREATE OR REPLACE FUNCTION generate_kundennummer()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.kundennummer IS NULL THEN
        NEW.kundennummer := 'KD-' || LPAD(nextval('kunden_nummer_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_kunden_kundennummer ON kunden;
CREATE TRIGGER trigger_kunden_kundennummer
    BEFORE INSERT ON kunden
    FOR EACH ROW EXECUTE FUNCTION generate_kundennummer();

-- ============================================
-- Funktion: Rechnungsnummer automatisch generieren
-- ============================================

CREATE OR REPLACE FUNCTION generate_rechnungsnummer()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.rechnungsnummer IS NULL OR NEW.rechnungsnummer = '' THEN
        NEW.rechnungsnummer :=
            TO_CHAR(CURRENT_DATE, 'YYYY') || '-' ||
            LPAD(nextval('rechnungsnummer_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_honorarnoten_rechnungsnummer ON honorarnoten;
CREATE TRIGGER trigger_honorarnoten_rechnungsnummer
    BEFORE INSERT ON honorarnoten
    FOR EACH ROW EXECUTE FUNCTION generate_rechnungsnummer();

-- ============================================
-- VIEWS FÜR AUSWERTUNGEN
-- ============================================

CREATE OR REPLACE VIEW v_stunden_monatlich AS
SELECT
    d.mitarbeiter_id,
    p.username,
    p.vorname,
    p.nachname,
    EXTRACT(YEAR FROM d.start_datum)::INTEGER as jahr,
    EXTRACT(MONTH FROM d.start_datum)::INTEGER as monat,
    TO_CHAR(d.start_datum, 'YYYY-MM') as jahr_monat,
    COUNT(*)::INTEGER as anzahl_eintraege,
    COALESCE(SUM(d.dauer_minuten), 0) / 60.0 as stunden_gesamt,
    ROUND(COALESCE(SUM(d.dauer_minuten), 0) / 60.0, 2) as stunden_gerundet,
    COALESCE(SUM(d.gesamtbetrag), 0) as umsatz_gesamt
FROM dienstleistungen d
JOIN personlogin p ON d.mitarbeiter_id = p.id
WHERE d.ende_datum IS NOT NULL AND d.ende_zeit IS NOT NULL
GROUP BY d.mitarbeiter_id, p.username, p.vorname, p.nachname,
         EXTRACT(YEAR FROM d.start_datum), EXTRACT(MONTH FROM d.start_datum),
         TO_CHAR(d.start_datum, 'YYYY-MM')
ORDER BY jahr DESC, monat DESC, p.nachname;

CREATE OR REPLACE VIEW v_stunden_taeglich AS
SELECT
    d.mitarbeiter_id,
    p.username,
    p.vorname,
    p.nachname,
    d.start_datum as datum,
    TO_CHAR(d.start_datum, 'Day') as wochentag,
    COUNT(*)::INTEGER as anzahl_eintraege,
    COALESCE(SUM(d.dauer_minuten), 0) / 60.0 as stunden_gesamt,
    ROUND(COALESCE(SUM(d.dauer_minuten), 0) / 60.0, 2) as stunden_gerundet
FROM dienstleistungen d
JOIN personlogin p ON d.mitarbeiter_id = p.id
WHERE d.ende_datum IS NOT NULL AND d.ende_zeit IS NOT NULL
GROUP BY d.mitarbeiter_id, p.username, p.vorname, p.nachname, d.start_datum
ORDER BY d.start_datum DESC;

CREATE OR REPLACE VIEW v_offene_rechnungen AS
SELECT
    h.id,
    h.rechnungsnummer,
    h.rechnungsdatum,
    h.faelligkeitsdatum,
    CURRENT_DATE - h.faelligkeitsdatum as tage_ueberfaellig,
    h.bruttobetrag,
    h.mitarbeiter_id,
    COALESCE(p.vorname || ' ' || p.nachname, p.username) as mitarbeiter_name,
    k.firmenname,
    COALESCE(k.ansprechperson_vorname || ' ' || k.ansprechperson_nachname, k.firmenname) as kunde_name,
    k.email as kunde_email
FROM honorarnoten h
JOIN personlogin p ON h.mitarbeiter_id = p.id
JOIN kunden k ON h.kunde_id = k.id
WHERE h.bezahlt = false AND h.storniert = false
ORDER BY h.faelligkeitsdatum ASC;

CREATE OR REPLACE VIEW v_laufende_dienstleistungen AS
SELECT
    d.id,
    d.start_datum,
    d.start_zeit,
    d.titel,
    d.beschreibung,
    d.mitarbeiter_id,
    COALESCE(p.vorname || ' ' || p.nachname, p.username) as mitarbeiter_name,
    COALESCE(k.firmenname, k.ansprechperson_vorname || ' ' || k.ansprechperson_nachname) as kunde,
    ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - d.start_timestamp)) / 3600, 2) as stunden_seit_start
FROM dienstleistungen d
JOIN personlogin p ON d.mitarbeiter_id = p.id
JOIN kunden k ON d.kunde_id = k.id
WHERE d.abgeschlossen = false AND d.ende_datum IS NULL
ORDER BY d.start_timestamp ASC;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- RLS für Kunden
ALTER TABLE kunden ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kunden_isolation ON kunden;
CREATE POLICY kunden_isolation ON kunden
    FOR ALL
    USING (mitarbeiter_id = NULLIF(current_setting('app.current_user_id', true), '')::INTEGER)
    WITH CHECK (mitarbeiter_id = NULLIF(current_setting('app.current_user_id', true), '')::INTEGER);

DROP POLICY IF EXISTS kunden_admin_all ON kunden;
CREATE POLICY kunden_admin_all ON kunden
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM personlogin
            WHERE id = NULLIF(current_setting('app.current_user_id', true), '')::INTEGER
            AND admin = 1
        )
    );

-- RLS für Dienstleistungen
ALTER TABLE dienstleistungen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dienstleistungen_isolation ON dienstleistungen;
CREATE POLICY dienstleistungen_isolation ON dienstleistungen
    FOR ALL
    USING (mitarbeiter_id = NULLIF(current_setting('app.current_user_id', true), '')::INTEGER)
    WITH CHECK (mitarbeiter_id = NULLIF(current_setting('app.current_user_id', true), '')::INTEGER);

DROP POLICY IF EXISTS dienstleistungen_admin_all ON dienstleistungen;
CREATE POLICY dienstleistungen_admin_all ON dienstleistungen
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM personlogin
            WHERE id = NULLIF(current_setting('app.current_user_id', true), '')::INTEGER
            AND admin = 1
        )
    );

-- RLS für Honorarnoten
ALTER TABLE honorarnoten ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS honorarnoten_isolation ON honorarnoten;
CREATE POLICY honorarnoten_isolation ON honorarnoten
    FOR ALL
    USING (mitarbeiter_id = NULLIF(current_setting('app.current_user_id', true), '')::INTEGER)
    WITH CHECK (mitarbeiter_id = NULLIF(current_setting('app.current_user_id', true), '')::INTEGER);

DROP POLICY IF EXISTS honorarnoten_admin_all ON honorarnoten;
CREATE POLICY honorarnoten_admin_all ON honorarnoten
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM personlogin
            WHERE id = NULLIF(current_setting('app.current_user_id', true), '')::INTEGER
            AND admin = 1
        )
    );

-- ============================================
-- BERECHTIGUNGEN
-- ============================================

ALTER TABLE personlogin OWNER TO marijan;
ALTER TABLE login_versuche_historie OWNER TO marijan;
ALTER TABLE kunden OWNER TO marijan;
ALTER TABLE dienstleistungskategorien OWNER TO marijan;
ALTER TABLE dienstleistungen OWNER TO marijan;
ALTER TABLE honorarnoten OWNER TO marijan;
ALTER TABLE honorarnoten_positionen OWNER TO marijan;
ALTER TABLE stundenzettel OWNER TO marijan;
ALTER TABLE audit_log OWNER TO marijan;

-- ============================================
-- TESTDATEN (Admin-Benutzer)
-- ============================================

-- Admin-Benutzer erstellen (Passwort: Admin123!)
INSERT INTO personlogin (username, email, hashed_passwort, vorname, nachname, admin, aktiv)
VALUES (
    'admin',
    'admin@kezar.at',
    crypt('Admin123!', gen_salt('bf')),
    'System',
    'Administrator',
    1,
    true
) ON CONFLICT (username) DO NOTHING;

-- ============================================
-- FERTIG!
-- ============================================

SELECT 'DB_TimeBook Setup erfolgreich abgeschlossen!' as status;
SELECT 'Tabellen erstellt: ' || COUNT(*)::TEXT
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
