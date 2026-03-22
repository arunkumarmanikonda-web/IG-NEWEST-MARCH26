-- ============================================================================
-- Migration 0018: Phase Z — Seed Support Tables
-- Creates tables needed for seed data that were missing from earlier migrations.
-- Apply: npx wrangler d1 migrations apply india-gully-production --remote
-- ============================================================================

-- ── Clients ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_clients (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name  TEXT    NOT NULL,
  contact_name  TEXT    NOT NULL,
  email         TEXT    UNIQUE NOT NULL,
  phone         TEXT,
  sector        TEXT,
  status        TEXT    NOT NULL DEFAULT 'Prospect',
  source        TEXT,
  notes         TEXT,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_clients_status   ON ig_clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_sector   ON ig_clients(sector);

-- ── Enquiries ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_enquiries (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  ref_number    TEXT    UNIQUE NOT NULL,
  enquiry_type  TEXT    NOT NULL DEFAULT 'General',
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL,
  phone         TEXT,
  organisation  TEXT,
  message       TEXT,
  vertical      TEXT,
  scale         TEXT,
  status        TEXT    NOT NULL DEFAULT 'New',
  source        TEXT,
  assigned_to   INTEGER REFERENCES ig_users(id),
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON ig_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_type   ON ig_enquiries(enquiry_type);

-- ── Vouchers ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_vouchers (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  voucher_type     TEXT    NOT NULL,
  voucher_number   TEXT    UNIQUE NOT NULL,
  date             DATE    NOT NULL,
  narration        TEXT,
  amount           REAL    NOT NULL DEFAULT 0,
  dr_account_code  TEXT,
  cr_account_code  TEXT,
  reference        TEXT,
  created_by       INTEGER REFERENCES ig_users(id),
  fy_year          TEXT    NOT NULL DEFAULT '2025-26',
  is_reconciled    INTEGER NOT NULL DEFAULT 0,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vouchers_date    ON ig_vouchers(date);
CREATE INDEX IF NOT EXISTS idx_vouchers_type    ON ig_vouchers(voucher_type);
CREATE INDEX IF NOT EXISTS idx_vouchers_fy      ON ig_vouchers(fy_year);

-- ── Board Meetings ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_board_meetings (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_type    TEXT    NOT NULL DEFAULT 'Board Meeting',
  meeting_number  TEXT    UNIQUE NOT NULL,
  meeting_date    DATE    NOT NULL,
  meeting_time    TEXT,
  venue           TEXT,
  mode            TEXT    NOT NULL DEFAULT 'Physical',
  agenda_text     TEXT,
  status          TEXT    NOT NULL DEFAULT 'Scheduled',
  quorum_required INTEGER NOT NULL DEFAULT 2,
  minutes_text    TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_board_mtg_date   ON ig_board_meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_board_mtg_status ON ig_board_meetings(status);

-- ── Payroll Runs ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_payroll_runs (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  month            INTEGER NOT NULL,
  year             INTEGER NOT NULL,
  status           TEXT    NOT NULL DEFAULT 'Draft',
  run_by           INTEGER REFERENCES ig_users(id),
  total_gross      REAL    NOT NULL DEFAULT 0,
  total_deductions REAL    NOT NULL DEFAULT 0,
  total_net        REAL    NOT NULL DEFAULT 0,
  fy_year          TEXT    NOT NULL DEFAULT '2025-26',
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(month, year)
);

SELECT 'Migration 0018 complete — seed support tables created' AS status;
