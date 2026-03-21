-- Migration 0012: Phase T — Sales deals, bank transactions, leave requests, payslips
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Converts hardcoded/static data to live D1 queries for:
--   Sales CRM, Finance (bank statement, GST EWB), HR (payslips, leave, TDS)

-- ── Sales Deals ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_sales_deals (
  id              INTEGER  PRIMARY KEY AUTOINCREMENT,
  deal_id         TEXT     NOT NULL UNIQUE,          -- DL-001, DL-002 …
  name            TEXT     NOT NULL,
  client          TEXT     NOT NULL,
  value_crore     REAL     NOT NULL DEFAULT 0,       -- stored as numeric crore value
  value_display   TEXT,                              -- "₹425 Cr" formatted
  stage           TEXT     NOT NULL DEFAULT 'Discovery',
  probability     INTEGER  NOT NULL DEFAULT 25,      -- 0-100
  fee_expected    TEXT,
  close_date      TEXT,                              -- "Apr 2026"
  owner           TEXT,
  reminder_active INTEGER  NOT NULL DEFAULT 0,
  nda_ref         TEXT,
  notes           TEXT,
  status          TEXT     NOT NULL DEFAULT 'active',  -- active | won | lost
  created_at      TEXT     DEFAULT (datetime('now')),
  updated_at      TEXT     DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sales_deals_stage    ON ig_sales_deals(stage);
CREATE INDEX IF NOT EXISTS idx_sales_deals_status   ON ig_sales_deals(status);
CREATE INDEX IF NOT EXISTS idx_sales_deals_owner    ON ig_sales_deals(owner);

-- ── Bank Transactions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_bank_transactions (
  id              INTEGER  PRIMARY KEY AUTOINCREMENT,
  txn_date        TEXT     NOT NULL,
  narration       TEXT     NOT NULL,
  txn_type        TEXT     NOT NULL DEFAULT 'Credit',  -- Credit | Debit
  amount          REAL     NOT NULL DEFAULT 0,
  balance         REAL     NOT NULL DEFAULT 0,
  reference       TEXT,
  account_no      TEXT     NOT NULL DEFAULT 'HDFC CA 0012 3456 7890',
  period          TEXT     NOT NULL,                   -- "Feb 2026"
  category        TEXT,                                -- Fees | Expense | TDS | Rent …
  created_at      TEXT     DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bank_txns_date       ON ig_bank_transactions(txn_date);
CREATE INDEX IF NOT EXISTS idx_bank_txns_period     ON ig_bank_transactions(period);
CREATE INDEX IF NOT EXISTS idx_bank_txns_type       ON ig_bank_transactions(txn_type);

-- ── Leave Requests ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_leave_requests (
  id              INTEGER  PRIMARY KEY AUTOINCREMENT,
  employee_id     TEXT     NOT NULL REFERENCES ig_employees(employee_id),
  leave_type      TEXT     NOT NULL DEFAULT 'Earned',  -- Earned | Casual | Sick | LWP
  from_date       TEXT     NOT NULL,
  to_date         TEXT     NOT NULL,
  days            INTEGER  NOT NULL DEFAULT 1,
  reason          TEXT,
  status          TEXT     NOT NULL DEFAULT 'Pending',  -- Pending | Approved | Rejected
  approved_by     TEXT,
  approved_at     TEXT,
  created_at      TEXT     DEFAULT (datetime('now')),
  updated_at      TEXT     DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_leave_employee       ON ig_leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_status         ON ig_leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_dates          ON ig_leave_requests(from_date, to_date);

-- ── Payslips ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_payslips (
  id              INTEGER  PRIMARY KEY AUTOINCREMENT,
  slip_ref        TEXT     NOT NULL UNIQUE,             -- SLIP-YYYYMM-EMPID
  employee_id     TEXT     NOT NULL,
  employee_name   TEXT     NOT NULL,
  month           TEXT     NOT NULL,                    -- "Feb 2026"
  gross_salary    REAL     NOT NULL DEFAULT 0,
  basic           REAL     NOT NULL DEFAULT 0,
  hra             REAL     NOT NULL DEFAULT 0,
  special_allow   REAL     NOT NULL DEFAULT 0,
  pf_deduction    REAL     NOT NULL DEFAULT 0,
  tds_deduction   REAL     NOT NULL DEFAULT 0,
  other_deduction REAL     NOT NULL DEFAULT 0,
  net_salary      REAL     NOT NULL DEFAULT 0,
  generated_by    TEXT,
  generated_at    TEXT     DEFAULT (datetime('now')),
  pdf_url         TEXT
);
CREATE INDEX IF NOT EXISTS idx_payslips_employee    ON ig_payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_month       ON ig_payslips(month);

-- ── TDS Declarations (per employee per FY) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_tds_declarations (
  id              INTEGER  PRIMARY KEY AUTOINCREMENT,
  employee_id     TEXT     NOT NULL,
  employee_name   TEXT     NOT NULL,
  fy              TEXT     NOT NULL DEFAULT '2025-26',
  regime          TEXT     NOT NULL DEFAULT 'New',     -- New | Old
  basic_exemption REAL     NOT NULL DEFAULT 300000,
  sec_80c         REAL     NOT NULL DEFAULT 0,
  sec_80d         REAL     NOT NULL DEFAULT 0,
  hra_exemption   REAL     NOT NULL DEFAULT 0,
  lta_exemption   REAL     NOT NULL DEFAULT 0,
  other_deductions REAL    NOT NULL DEFAULT 0,
  total_deductions REAL    NOT NULL DEFAULT 0,
  taxable_income  REAL,
  estimated_tds   REAL,
  submitted       INTEGER  NOT NULL DEFAULT 0,
  submitted_at    TEXT,
  created_at      TEXT     DEFAULT (datetime('now')),
  updated_at      TEXT     DEFAULT (datetime('now')),
  UNIQUE(employee_id, fy)
);
CREATE INDEX IF NOT EXISTS idx_tds_decl_employee    ON ig_tds_declarations(employee_id);
CREATE INDEX IF NOT EXISTS idx_tds_decl_fy          ON ig_tds_declarations(fy);

-- ── Additional indexes for unused tables to be activated ────────────────────
CREATE INDEX IF NOT EXISTS idx_leave_req_emp        ON ig_leave_requests(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_payslip_month_emp    ON ig_payslips(month, employee_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SEED DATA
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Seed: Sales Deals
INSERT OR IGNORE INTO ig_sales_deals
  (deal_id, name, client, value_crore, value_display, stage, probability, fee_expected, close_date, status)
VALUES
  ('DL-001','Rajasthan Heritage Hotels M&A','Rajasthan Hotels Pvt Ltd',425,'₹425 Cr','LOI Signed',90,'₹6.4 Cr','Apr 2026','active'),
  ('DL-002','NCR Mixed-Use Development','NCR Realty Corp',850,'₹850 Cr','Due Diligence',75,'₹12.75 Cr','Jun 2026','active'),
  ('DL-003','Pan-India QSR Rollout','Mumbai Mall Pvt Ltd',132,'₹132 Cr','Won',100,'₹1.98 Cr','Feb 2026','won'),
  ('DL-004','South India Retail Portfolio','South India Retail',680,'₹680 Cr','Proposal',55,'₹10.2 Cr','Jul 2026','active'),
  ('DL-005','Mumbai Entertainment Complex','Entertainment Ventures Ltd',240,'₹240 Cr','Negotiation',70,'₹3.6 Cr','May 2026','active'),
  ('DL-006','Goa Beach Resort Portfolio','Goa Tourism Holdings',320,'₹320 Cr','Discovery',35,'₹4.8 Cr','Sep 2026','active');

-- Seed: Bank transactions (Feb 2026)
INSERT OR IGNORE INTO ig_bank_transactions
  (txn_date, narration, txn_type, amount, balance, account_no, period, category)
VALUES
  ('2026-02-28','NEFT CREDIT - Demo Client Corp','Credit',250160,5620000,'HDFC CA 0012 3456 7890','Feb 2026','Fees'),
  ('2026-02-27','IMPS DEBIT - Deloitte Consulting','Debit',141600,5369840,'HDFC CA 0012 3456 7890','Feb 2026','Expense'),
  ('2026-02-25','RTGS CREDIT - Entertainment Ventures','Credit',320000,5511440,'HDFC CA 0012 3456 7890','Feb 2026','Fees'),
  ('2026-02-22','NEFT DEBIT - Office Rent Q1','Debit',185000,5191440,'HDFC CA 0012 3456 7890','Feb 2026','Rent'),
  ('2026-02-20','NEFT CREDIT - Rajasthan Hotels','Credit',480000,5376440,'HDFC CA 0012 3456 7890','Feb 2026','Fees'),
  ('2026-02-18','RTGS DEBIT - TDS Payment Q3','Debit',95000,4896440,'HDFC CA 0012 3456 7890','Feb 2026','TDS');

-- Seed: TDS Declarations for FY 2025-26
INSERT OR IGNORE INTO ig_tds_declarations
  (employee_id, employee_name, fy, regime, sec_80c, sec_80d, total_deductions, submitted)
VALUES
  ('EMP-001','Arun Manikonda','2025-26','New',0,0,150000,1),
  ('EMP-002','Pavan Manikonda','2025-26','Old',150000,25000,350000,1),
  ('EMP-003','Amit Jhingan','2025-26','New',0,0,0,0);
