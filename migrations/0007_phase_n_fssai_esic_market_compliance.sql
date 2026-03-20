-- Migration 0007: Phase N — FSSAI, ESIC/EPFO data, Market Intelligence, Compliance Signoffs
-- Created: 2026-03-20
-- Phase: N — Final D1 wiring for HORECA/FSSAI, HR/ESIC, Compliance signoffs

-- ── HORECA: FSSAI Compliance Store ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_horeca_fssai (
  id              INTEGER  PRIMARY KEY AUTOINCREMENT,
  operator        TEXT     NOT NULL,
  licence_number  TEXT     UNIQUE NOT NULL,
  licence_type    TEXT     NOT NULL DEFAULT 'State Licence',
  valid_from      TEXT,
  valid_until     TEXT,
  issuing_authority TEXT,
  compliance_score INTEGER DEFAULT 0,
  fsms_status     TEXT,
  data_json       TEXT,   -- full compliance payload as JSON
  updated_by      TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fssai_licence ON ig_horeca_fssai(licence_number);

-- ── HORECA: FSSAI Renewal Applications ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_horeca_fssai_renewals (
  id              INTEGER  PRIMARY KEY AUTOINCREMENT,
  application_no  TEXT     UNIQUE NOT NULL,
  licence_number  TEXT     NOT NULL,
  renewal_years   INTEGER  DEFAULT 1,
  new_expiry      TEXT,
  fee_payable     REAL,
  status          TEXT     NOT NULL DEFAULT 'Submitted',
  submitted_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at    DATETIME,
  notes           TEXT
);

-- ── HORECA: FSSAI Inspection Schedule ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_horeca_fssai_inspections (
  id              INTEGER  PRIMARY KEY AUTOINCREMENT,
  inspection_ref  TEXT     UNIQUE NOT NULL,
  outlet_name     TEXT,
  outlet_address  TEXT,
  preferred_date  TEXT,
  actual_date     TEXT,
  status          TEXT     NOT NULL DEFAULT 'Requested',
  result          TEXT,
  officer         TEXT,
  notes           TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── HR: ESIC Contribution Records ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_esic_contributions (
  id               INTEGER  PRIMARY KEY AUTOINCREMENT,
  period           TEXT     NOT NULL,  -- YYYY-MM
  esic_reg_no      TEXT     NOT NULL,
  employees_covered INTEGER DEFAULT 0,
  total_employer_share REAL DEFAULT 0,
  total_employee_share REAL DEFAULT 0,
  total_remittance REAL    DEFAULT 0,
  challan_no       TEXT,
  status           TEXT    NOT NULL DEFAULT 'Pending',
  due_date         TEXT,
  filed_at         DATETIME,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_esic_period ON ig_esic_contributions(period);

-- ── Market Intelligence Cache ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_market_data_cache (
  id          INTEGER  PRIMARY KEY AUTOINCREMENT,
  data_key    TEXT     UNIQUE NOT NULL,  -- e.g. 'india_hospitality_2026q1'
  data_json   TEXT     NOT NULL,
  source      TEXT,
  valid_until DATETIME,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Compliance Signoff Records ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_compliance_signoffs (
  id          INTEGER  PRIMARY KEY AUTOINCREMENT,
  ref         TEXT     UNIQUE NOT NULL,
  module      TEXT     NOT NULL,
  signed_by   TEXT     NOT NULL,
  score       INTEGER,
  notes       TEXT,
  cert_type   TEXT     NOT NULL DEFAULT 'gold',
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_signoff_module ON ig_compliance_signoffs(module);

-- ── DPDP: Grievance Records (separate table for faster queries) ───────────────
CREATE TABLE IF NOT EXISTS ig_dpdp_grievances (
  id           INTEGER  PRIMARY KEY AUTOINCREMENT,
  ref          TEXT     UNIQUE NOT NULL,
  user_id      TEXT     NOT NULL,
  subject      TEXT     NOT NULL,
  description  TEXT,
  contact_email TEXT,
  status       TEXT     NOT NULL DEFAULT 'Received',
  dpo_assigned TEXT     NOT NULL DEFAULT 'dpo@indiagully.com',
  resolved_at  DATETIME,
  resolution   TEXT,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_grievance_user ON ig_dpdp_grievances(user_id);
CREATE INDEX IF NOT EXISTS idx_grievance_status ON ig_dpdp_grievances(status);

-- ── Seed: FSSAI baseline record ───────────────────────────────────────────────
INSERT OR IGNORE INTO ig_horeca_fssai
  (operator, licence_number, licence_type, valid_from, valid_until, issuing_authority, compliance_score, fsms_status, data_json, updated_by)
VALUES
  ('Vivacious Entertainment and Hospitality Pvt. Ltd.',
   '11226999000001', 'State Licence', '2024-04-01', '2027-03-31',
   'Food Safety Commissioner, Delhi', 88,
   'Implemented — ISO 22000:2018 aligned',
   '{"renewal_alert":false,"renewal_due":"2027-01-01","last_inspection":{"date":"2025-12-15","result":"Satisfactory","officer":"FSO Rajiv Nair, FSSAI"}}',
   'system');

-- ── Seed: ESIC Feb 2026 ───────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_esic_contributions
  (period, esic_reg_no, employees_covered, total_employer_share, total_employee_share, total_remittance, status, due_date)
VALUES
  ('2026-02', 'E-31/DL/0000000001', 1, 1138, 263, 1401, 'Pending', '2026-03-15');

-- ── Seed: Compliance signoffs (existing modules) ──────────────────────────────
INSERT OR IGNORE INTO ig_compliance_signoffs (ref, module, signed_by, score, notes, cert_type)
VALUES
  ('GCS-0001', 'Authentication',     'Super Admin', 100, 'Phase L verified', 'gold'),
  ('GCS-0002', 'DPDP Compliance',    'Super Admin', 96,  'Phase M verified', 'gold'),
  ('GCS-0003', 'Finance Module',     'Super Admin', 92,  'D1 wired Phase L', 'gold'),
  ('GCS-0004', 'Governance Board',   'Super Admin', 90,  'D1 wired Phase L', 'gold'),
  ('GCS-0005', 'HORECA Module',      'Super Admin', 88,  'D1 wired Phase M', 'gold');
