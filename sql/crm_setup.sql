-- CRM Tabellen für Freelancer CRM
-- Ausführen mit: psql $DATABASE_URL < sql/crm_setup.sql

-- Kunden (Clients)
CREATE TABLE IF NOT EXISTS crm_kunden (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES personlogin(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  firma VARCHAR(255),
  email VARCHAR(255),
  telefon VARCHAR(100),
  notizen TEXT,
  erstellt_am TIMESTAMP DEFAULT NOW(),
  aktualisiert_am TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_kunden_user_id ON crm_kunden(user_id);

-- Projekte (Projects)
CREATE TABLE IF NOT EXISTS crm_projekte (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES personlogin(id) ON DELETE CASCADE,
  kunde_id INTEGER REFERENCES crm_kunden(id) ON DELETE SET NULL,
  titel VARCHAR(255) NOT NULL,
  beschreibung TEXT,
  status VARCHAR(50) DEFAULT 'offen',
  budget NUMERIC(10,2),
  deadline DATE,
  erstellt_am TIMESTAMP DEFAULT NOW(),
  aktualisiert_am TIMESTAMP DEFAULT NOW(),
  CONSTRAINT crm_projekte_status_check CHECK (status IN ('offen', 'aktiv', 'abgeschlossen', 'pausiert'))
);

CREATE INDEX IF NOT EXISTS idx_crm_projekte_user_id ON crm_projekte(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_projekte_kunde_id ON crm_projekte(kunde_id);

-- Aufgaben (Tasks)
CREATE TABLE IF NOT EXISTS crm_aufgaben (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES personlogin(id) ON DELETE CASCADE,
  projekt_id INTEGER REFERENCES crm_projekte(id) ON DELETE SET NULL,
  titel VARCHAR(255) NOT NULL,
  beschreibung TEXT,
  prioritaet VARCHAR(20) DEFAULT 'mittel',
  status VARCHAR(30) DEFAULT 'offen',
  faellig_am DATE,
  erstellt_am TIMESTAMP DEFAULT NOW(),
  aktualisiert_am TIMESTAMP DEFAULT NOW(),
  CONSTRAINT crm_aufgaben_prioritaet_check CHECK (prioritaet IN ('niedrig', 'mittel', 'hoch')),
  CONSTRAINT crm_aufgaben_status_check CHECK (status IN ('offen', 'in_bearbeitung', 'erledigt'))
);

CREATE INDEX IF NOT EXISTS idx_crm_aufgaben_user_id ON crm_aufgaben(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_aufgaben_projekt_id ON crm_aufgaben(projekt_id);
