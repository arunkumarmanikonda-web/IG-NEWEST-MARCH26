-- Migration 0005: Sales Leads, Contracts, Mandates D1 tables
-- India Gully Super Admin – Phase L

-- ── Sales Leads ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_leads (
  id             INTEGER  PRIMARY KEY AUTOINCREMENT,
  lead_id        TEXT     NOT NULL UNIQUE,            -- LD-001 etc.
  name           TEXT     NOT NULL,
  sector         TEXT     NOT NULL DEFAULT 'General',
  value_cr       REAL     NOT NULL DEFAULT 0,         -- crores
  stage          TEXT     NOT NULL DEFAULT 'Qualification',
  contact_name   TEXT,
  contact_email  TEXT,
  probability    INTEGER  DEFAULT 50,                 -- 0-100
  owner          TEXT     DEFAULT 'AKM',
  notes          TEXT,
  status         TEXT     NOT NULL DEFAULT 'Active',  -- Active|Won|Lost
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_leads_stage  ON ig_leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_status ON ig_leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_owner  ON ig_leads(owner);

-- ── Contracts ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_contracts (
  id             INTEGER  PRIMARY KEY AUTOINCREMENT,
  contract_id    TEXT     NOT NULL UNIQUE,            -- AGR-001, NDA-001 etc.
  name           TEXT     NOT NULL,
  party          TEXT     NOT NULL,
  contract_type  TEXT     NOT NULL DEFAULT 'Advisory',-- Advisory|PMC|Mandate|NDA|MOU|Retainer
  start_date     TEXT,
  expiry_date    TEXT,
  status         TEXT     NOT NULL DEFAULT 'Draft',   -- Draft|Active|Expiring|Expired|Terminated
  signed         INTEGER  DEFAULT 0,                  -- 0|1
  doc_id         INTEGER  REFERENCES ig_documents(id),
  notes          TEXT,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON ig_contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_type   ON ig_contracts(contract_type);

-- ── Mandates ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_mandates (
  id             INTEGER  PRIMARY KEY AUTOINCREMENT,
  mandate_id     TEXT     NOT NULL UNIQUE,            -- MND-001 etc.
  name           TEXT     NOT NULL,
  mandate_type   TEXT     NOT NULL DEFAULT 'Advisory',-- Hospitality|Real Estate|HORECA|Retail|Entertainment
  value_cr       REAL     NOT NULL DEFAULT 0,
  stage          TEXT     NOT NULL DEFAULT 'NDA Signed',
  client_id      INTEGER  REFERENCES ig_clients(id),
  client_name    TEXT,
  assigned_to    INTEGER  REFERENCES ig_users(id),
  assigned_name  TEXT,
  status         TEXT     NOT NULL DEFAULT 'Active',  -- Active|On Hold|Closed|Lost
  start_date     TEXT,
  notes          TEXT,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mandates_status ON ig_mandates(status);
CREATE INDEX IF NOT EXISTS idx_mandates_type   ON ig_mandates(mandate_type);

-- ── KPI / OKR Records ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_kpi_records (
  id             INTEGER  PRIMARY KEY AUTOINCREMENT,
  dept           TEXT     NOT NULL,
  objective      TEXT     NOT NULL,
  key_result     TEXT     NOT NULL,
  target         TEXT,
  actual         TEXT,
  pct            INTEGER  DEFAULT 0,
  fy             TEXT     DEFAULT '2025-26',
  quarter        TEXT     DEFAULT 'Q4',
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Seed default lead data ─────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_leads (lead_id, name, sector, value_cr, stage, contact_name, probability, owner, status) VALUES
  ('LD-001', 'Green Valley Mall',    'Retail',       240,  'Proposal',     'Rajan Mehta',  60, 'AKM',   'Active'),
  ('LD-002', 'Sunrise Hotel Chain',  'Hospitality',  580,  'Negotiation',  'Priya Kapoor', 75, 'Pavan', 'Active'),
  ('LD-003', 'Tech Valley Office',   'Real Estate',  1200, 'Discovery',    'Arjun Singh',  30, 'AKM',   'Active'),
  ('LD-004', 'Spice Garden F&B',     'HORECA',       45,   'LOI',          'Meera Pillai', 85, 'Pavan', 'Active'),
  ('LD-005', 'PVR Entertainment',    'Entertainment',890,  'Proposal',     'Vikram Nair',  45, 'AKM',   'Active'),
  ('LD-006', 'Coastal Resorts',      'Hospitality',  320,  'Qualification','Sunita Reddy', 20, 'Pavan', 'Active');

-- ── Seed default contract data ────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_contracts (contract_id, name, party, contract_type, start_date, expiry_date, status, signed) VALUES
  ('AGR-001', 'Advisory Agreement FY2025',        'Demo Client Corp',   'Advisory', '01 Jan 2025', '31 Dec 2025', 'Active',   1),
  ('PMC-001', 'Hotel PMC Agreement',               'Rajasthan Hotels',   'PMC',      '15 Feb 2026', '14 Feb 2027', 'Active',   1),
  ('MND-001', 'Retail Leasing Mandate',            'Mumbai Mall Pvt.',   'Mandate',  '01 Dec 2025', '30 Nov 2026', 'Active',   1),
  ('RET-001', 'EY Advisory Retainer',              'Ernst & Young',      'Retainer', '01 Apr 2025', '31 Mar 2026', 'Expiring', 1),
  ('MOU-001', 'CBRE Co-Advisory MOU',              'CBRE India',         'MOU',      '01 Jan 2026', '31 Dec 2026', 'Active',   1),
  ('NDA-001', 'NDA — Entertainment Project',       'Confidential',       'NDA',      '01 Feb 2026', '01 Feb 2027', 'Active',   0),
  ('DRF-001', 'New Client Advisory Agreement',     'TBD',                'Advisory', NULL,          NULL,          'Draft',    0);

-- ── Seed default mandate data ─────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_mandates (mandate_id, name, mandate_type, value_cr, stage, client_name, assigned_name, status) VALUES
  ('MND-001', 'Jaipur Hospitality Hub — 5-Star Hotel',   'Hospitality', 425,  'LOI Signed',     'Jaipur Hotels Ltd',      'AKM',   'Active'),
  ('MND-002', 'Delhi NCR Mixed-Use Commercial Complex',  'Real Estate', 2100, 'Due Diligence',  'NCR Realty Corp',        'Pavan', 'Active'),
  ('MND-003', 'Mumbai HORECA Supply Chain',              'HORECA',      87,   'Mandate Signed', 'Mumbai F&B Group',       'AKM',   'Active'),
  ('MND-004', 'Goa Beachfront Resort Development',       'Hospitality', 320,  'Proposal Sent',  'Goa Ventures Pvt Ltd',   'Pavan', 'Active'),
  ('MND-005', 'Hyderabad IT Park — Entertainment Zone',  'Entertainment',1500,'NDA Signed',     'Tech Parks India Ltd',   'AKM',   'Active'),
  ('MND-006', 'Bengaluru Food Court Chain Rollout',      'HORECA',      45,   'LOI Signed',     'Bengaluru Foods Pvt Ltd','Pavan', 'Active');
