-- ============================================================
-- Regatta v2: Veranstaltungen, Crew-Registrierung, Ziellinie, Yardstick
-- DB: db_regatta
-- Additiv zu regatta_setup.sql — keine bestehende Tabelle wird umgebaut,
-- bestehendes personenbezogenes Ad-hoc-Tracking bleibt vollständig nutzbar.
-- ============================================================

-- Bootsklassen mit Yardstickzahl
CREATE TABLE IF NOT EXISTS boat_class (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  yardstick   NUMERIC(6,2) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Veranstaltungen
CREATE TABLE IF NOT EXISTS event (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  description           TEXT,
  location              TEXT,
  event_date            DATE NOT NULL,
  start_time            TIMESTAMPTZ NOT NULL,  -- offizieller Startschuss, Basis für "Gesegelte Zeit"
  status                TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','active','ended')),
  gps_interval_seconds  INT NOT NULL DEFAULT 5 CHECK (gps_interval_seconds BETWEEN 1 AND 60),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_status_idx ON event(status);

-- Meldung (Boot + Skipper für eine Veranstaltung)
CREATE TABLE IF NOT EXISTS entry (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  boat_class_id  UUID NOT NULL REFERENCES boat_class(id),
  skipper_id     UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  boat_name      TEXT NOT NULL,
  sail_number    TEXT NOT NULL,
  start_number   TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Startnummer eindeutig PRO Veranstaltung (nicht global — Standard-Regatta-Praxis)
CREATE UNIQUE INDEX IF NOT EXISTS entry_event_start_number_idx ON entry(event_id, start_number);
CREATE INDEX IF NOT EXISTS entry_event_idx ON entry(event_id);
CREATE INDEX IF NOT EXISTS entry_skipper_idx ON entry(skipper_id);

-- Crew (bis zu 4 weitere Personen ohne Login-Account — reine Stammdaten)
CREATE TABLE IF NOT EXISTS entry_crew (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id    UUID NOT NULL REFERENCES entry(id) ON DELETE CASCADE,
  position    SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 4),
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  nation      TEXT NOT NULL,
  birth_year  SMALLINT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS entry_crew_position_idx ON entry_crew(entry_id, position);

-- Ziellinie (1 pro Veranstaltung), Punkt A -> Punkt B in Fahrtrichtung des Zieleinlaufs
CREATE TABLE IF NOT EXISTS finish_line (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID NOT NULL UNIQUE REFERENCES event(id) ON DELETE CASCADE,
  point_a_lat  DOUBLE PRECISION NOT NULL,
  point_a_lng  DOUBLE PRECISION NOT NULL,
  point_b_lat  DOUBLE PRECISION NOT NULL,
  point_b_lng  DOUBLE PRECISION NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Zielzeiten — genau 1 pro Meldung/Session, verhindert Mehrfach-Erkennung
CREATE TABLE IF NOT EXISTS finish_time (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id          UUID NOT NULL UNIQUE REFERENCES entry(id) ON DELETE CASCADE,
  track_session_id  UUID NOT NULL UNIQUE REFERENCES track_session(id) ON DELETE CASCADE,
  finish_at         TIMESTAMPTZ NOT NULL,  -- interpolierte Kreuzungszeit
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bestehende Tabellen additiv erweitern
ALTER TABLE person ADD COLUMN IF NOT EXISTS nation TEXT;
ALTER TABLE person ADD COLUMN IF NOT EXISTS birth_year SMALLINT;

-- nullable = abwärtskompatibel zum bisherigen personenbezogenen Ad-hoc-Tracking ohne Event
ALTER TABLE track_session ADD COLUMN IF NOT EXISTS entry_id UUID REFERENCES entry(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS track_session_entry_idx ON track_session(entry_id);

-- ============================================================
-- Beispiel-Bootsklassen (gängige Yardstickzahlen, DSV-Referenzwerte)
-- ============================================================
INSERT INTO boat_class (name, yardstick) VALUES
  ('Laser', 113),
  ('Pirat', 100),
  ('FD', 95)
ON CONFLICT (name) DO NOTHING;
