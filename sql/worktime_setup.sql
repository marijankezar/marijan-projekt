-- ============================================================
-- Worktime Setup SQL
-- Multi-Company Zeiterfassung & Task-Management
-- DB: db_worktime
-- ============================================================

-- Unternehmen
CREATE TABLE IF NOT EXISTS wt_companies (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  address     TEXT,
  email       VARCHAR(200),
  phone       VARCHAR(50),
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Benutzer (company_id NULL = globaler Super-Admin, reserved)
CREATE TABLE IF NOT EXISTS wt_users (
  id             SERIAL PRIMARY KEY,
  company_id     INTEGER REFERENCES wt_companies(id) ON DELETE CASCADE,
  username       VARCHAR(100) UNIQUE NOT NULL,
  email          VARCHAR(200) UNIQUE NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  first_name     VARCHAR(100),
  last_name      VARCHAR(100),
  role           VARCHAR(20) NOT NULL DEFAULT 'employee',
  -- employee | supervisor | admin
  active         BOOLEAN DEFAULT false,
  lang           VARCHAR(5) DEFAULT 'de',
  target_hours   DECIMAL(5,2) DEFAULT 8.0,
  login_attempts INTEGER DEFAULT 0,
  locked_until   TIMESTAMPTZ,
  last_login     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  created_by     INTEGER REFERENCES wt_users(id)
);

-- Kunden (pro Company)
CREATE TABLE IF NOT EXISTS wt_customers (
  id          SERIAL PRIMARY KEY,
  company_id  INTEGER REFERENCES wt_companies(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  address     TEXT,
  email       VARCHAR(200),
  phone       VARCHAR(50),
  notes       TEXT,
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  created_by  INTEGER REFERENCES wt_users(id)
);

-- Task-Vorlagen (pro User, optional Customer)
CREATE TABLE IF NOT EXISTS wt_tasks (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER REFERENCES wt_users(id) ON DELETE CASCADE,
  company_id          INTEGER REFERENCES wt_companies(id),
  customer_id         INTEGER REFERENCES wt_customers(id) ON DELETE SET NULL,
  title               VARCHAR(200) NOT NULL,
  description         TEXT,
  status              VARCHAR(20) DEFAULT 'planned',
  -- planned | in_progress | completed
  hourly_value_euro   DECIMAL(10,2),
  hourly_value_points DECIMAL(10,2),
  active              BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Arbeitszeit-Buchungen
CREATE TABLE IF NOT EXISTS wt_time_entries (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES wt_users(id) ON DELETE CASCADE,
  company_id      INTEGER REFERENCES wt_companies(id),
  work_start      TIMESTAMPTZ NOT NULL,
  work_end        TIMESTAMPTZ,
  break_minutes   INTEGER DEFAULT 0,
  notes           TEXT,
  approval_status VARCHAR(20) DEFAULT 'open',
  -- open | pending | approved | rejected
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Task-Einträge innerhalb einer Arbeitszeit
CREATE TABLE IF NOT EXISTS wt_task_entries (
  id            SERIAL PRIMARY KEY,
  time_entry_id INTEGER REFERENCES wt_time_entries(id) ON DELETE CASCADE,
  task_id       INTEGER REFERENCES wt_tasks(id) ON DELETE SET NULL,
  user_id       INTEGER REFERENCES wt_users(id) ON DELETE CASCADE,
  company_id    INTEGER REFERENCES wt_companies(id),
  start_time    TIMESTAMPTZ NOT NULL,
  end_time      TIMESTAMPTZ,
  description   TEXT,
  status        VARCHAR(20) DEFAULT 'in_progress',
  -- planned | in_progress | completed
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_wt_users_company ON wt_users(company_id);
CREATE INDEX IF NOT EXISTS idx_wt_time_entries_user_start ON wt_time_entries(user_id, work_start);
CREATE INDEX IF NOT EXISTS idx_wt_time_entries_company_start ON wt_time_entries(company_id, work_start);
CREATE INDEX IF NOT EXISTS idx_wt_task_entries_time_entry ON wt_task_entries(time_entry_id);
CREATE INDEX IF NOT EXISTS idx_wt_task_entries_user_start ON wt_task_entries(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_wt_tasks_user ON wt_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_wt_customers_company ON wt_customers(company_id);
