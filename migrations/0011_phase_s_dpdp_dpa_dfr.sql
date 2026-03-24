-- Migration 0011: Phase S — DPA records, DFR table, platform health indexes
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- DPDP Vendor DPA records table
CREATE TABLE IF NOT EXISTS ig_dpdp_vendor_dpas (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  dpa_id        TEXT NOT NULL UNIQUE,
  vendor        TEXT NOT NULL,
  category      TEXT,
  status        TEXT DEFAULT 'Pending',
  signed_date   TEXT,
  expiry_date   TEXT,
  risk_level    TEXT DEFAULT 'Medium',
  document_url  TEXT,
  signed_by     TEXT,
  notes         TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_dpdp_vendor_dpas_status ON ig_dpdp_vendor_dpas(status);
CREATE INDEX IF NOT EXISTS idx_dpdp_vendor_dpas_vendor ON ig_dpdp_vendor_dpas(vendor);

-- DPDP DFR (Data Fiduciary Registration) submissions
CREATE TABLE IF NOT EXISTS ig_dpdp_dfr (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_ref   TEXT NOT NULL UNIQUE,
  entity_name      TEXT NOT NULL,
  fiduciary_class  TEXT,
  data_categories  TEXT,
  submitted_by     TEXT,
  status           TEXT DEFAULT 'Draft',
  acknowledgement  TEXT,
  submitted_at     TEXT,
  acknowledged_at  TEXT,
  created_at       TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_dpdp_dfr_status ON ig_dpdp_dfr(status);

-- Additional index on ig_employees for TDS 16A queries
CREATE INDEX IF NOT EXISTS idx_employees_status_dept ON ig_employees(status, department);

-- Seed: Pre-load 6 vendor DPA records
INSERT OR IGNORE INTO ig_dpdp_vendor_dpas (dpa_id, vendor, category, status, signed_date, expiry_date, risk_level) VALUES
  ('DPA-001', 'AWS India', 'Cloud Infrastructure', 'Signed', '2025-01-15', '2026-01-14', 'Low'),
  ('DPA-002', 'SendGrid / Twilio', 'Email & SMS', 'Signed', '2025-02-01', '2026-01-31', 'Medium'),
  ('DPA-003', 'Cloudflare Inc.', 'CDN & Security', 'Signed', '2025-01-20', '2026-01-19', 'Low'),
  ('DPA-004', 'Razorpay Pvt Ltd', 'Payments', 'Pending', NULL, NULL, 'High'),
  ('DPA-005', 'DocuSign Inc.', 'e-Signing', 'Pending', NULL, NULL, 'Medium'),
  ('DPA-006', 'Zoom Video Comm.', 'Video Conferencing', 'Pending', NULL, NULL, 'Low');
