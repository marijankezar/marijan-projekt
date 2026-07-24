-- ============================================================
-- Regatta-Tracking Setup SQL
-- Live-GPS-Tracking für Regatta-Teilnehmer (Crew, Sessions, GPS-Punkte)
-- DB: db_regatta
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- für gen_random_uuid()

-- Personen (Crew-Mitglieder / Teilnehmer)
CREATE TABLE IF NOT EXISTS person (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_number   TEXT,
  first_name     TEXT NOT NULL,
  last_name      TEXT NOT NULL,
  display_name   TEXT NOT NULL,
  email          TEXT UNIQUE,
  password_hash  TEXT,               -- NULL = kein Login möglich (nur Roster-Eintrag)
  is_admin       BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tracking-Sessions (eine Person kann mehrere Sessions haben)
CREATE TABLE IF NOT EXISTS track_session (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id    UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  stopped_at   TIMESTAMPTZ,
  active       BOOLEAN NOT NULL DEFAULT true
);

-- Nur eine aktive Session pro Person gleichzeitig
-- (verhindert Doppel-Start / Geister-Marker bei Doppelklick oder mehreren Tabs)
CREATE UNIQUE INDEX IF NOT EXISTS track_session_one_active_per_person
  ON track_session(person_id) WHERE active;

CREATE INDEX IF NOT EXISTS track_session_person_idx ON track_session(person_id);

-- GPS-Punkte
CREATE TABLE IF NOT EXISTS gps_point (
  id          BIGSERIAL PRIMARY KEY,
  session_id  UUID NOT NULL REFERENCES track_session(id) ON DELETE CASCADE,
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  accuracy    DOUBLE PRECISION,
  speed       DOUBLE PRECISION,
  heading     DOUBLE PRECISION,
  altitude    DOUBLE PRECISION,
  timestamp   TIMESTAMPTZ NOT NULL, -- vom Client: GeolocationPosition.timestamp
  UNIQUE(session_id, timestamp)     -- Idempotenz bei Retry
);

CREATE INDEX IF NOT EXISTS gps_point_session_ts_idx ON gps_point(session_id, timestamp DESC);

-- ============================================================
-- Bootstrap-Admin
-- Login: admin@kezar.at / regatta2026  -- BITTE NACH ERSTEM LOGIN ÄNDERN
-- ============================================================
INSERT INTO person (first_name, last_name, display_name, email, password_hash, is_admin)
VALUES (
  'Admin', 'User', 'Admin',
  'admin@kezar.at',
  '$2b$12$W3XZCHu9gWfpX78.QVfzGem0EtPbcHlFRu0Y7AP5MAyvgnhPzch3u',
  true
)
ON CONFLICT (email) DO NOTHING;
