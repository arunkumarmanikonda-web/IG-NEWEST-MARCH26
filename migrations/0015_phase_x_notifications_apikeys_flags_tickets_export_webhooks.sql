-- Migration 0015: Phase X — Notifications, API Keys, Feature Flags, Support Tickets, Export Jobs, Outbound Webhooks
-- Generated: 2026-03-21

-- ── 1. Notifications ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_notifications (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER,
  type         TEXT NOT NULL DEFAULT 'info',  -- info | warning | error | success
  category     TEXT NOT NULL DEFAULT 'system', -- system | hr | finance | compliance | sales | dpdp
  title        TEXT NOT NULL,
  message      TEXT NOT NULL,
  is_read      INTEGER NOT NULL DEFAULT 0,
  action_url   TEXT,
  meta_json    TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  read_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON ig_notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON ig_notifications(category, created_at DESC);

-- ── 2. API Keys ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_api_keys (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  key_id       TEXT NOT NULL UNIQUE,
  key_hash     TEXT NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  created_by   INTEGER,
  scopes       TEXT NOT NULL DEFAULT '[]',   -- JSON array of scopes
  rate_limit   INTEGER NOT NULL DEFAULT 1000,
  last_used_at TEXT,
  expires_at   TEXT,
  is_active    INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at   TEXT
);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON ig_api_keys(is_active, expires_at);

-- ── 3. Feature Flags ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_feature_flags (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  flag_key     TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  description  TEXT,
  is_enabled   INTEGER NOT NULL DEFAULT 0,
  rollout_pct  INTEGER NOT NULL DEFAULT 0,   -- 0-100
  environments TEXT NOT NULL DEFAULT '["production"]', -- JSON array
  targeting    TEXT DEFAULT '{}',            -- JSON targeting rules
  created_by   INTEGER,
  updated_by   INTEGER,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON ig_feature_flags(flag_key, is_enabled);

-- ── 4. Support Tickets ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_support_tickets (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id    TEXT NOT NULL UNIQUE,
  subject      TEXT NOT NULL,
  description  TEXT,
  category     TEXT NOT NULL DEFAULT 'general', -- general | billing | technical | compliance | hr
  priority     TEXT NOT NULL DEFAULT 'medium',  -- low | medium | high | critical
  status       TEXT NOT NULL DEFAULT 'open',    -- open | in_progress | pending | resolved | closed
  reporter_id  INTEGER,
  reporter_email TEXT,
  assignee_id  INTEGER,
  resolution   TEXT,
  tags         TEXT DEFAULT '[]',
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at  TEXT,
  sla_due_at   TEXT
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON ig_support_tickets(status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_reporter ON ig_support_tickets(reporter_id, status);

-- ── 5. Export Jobs ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_export_jobs (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id       TEXT NOT NULL UNIQUE,
  type         TEXT NOT NULL,   -- leads | invoices | employees | audit_log | gst | payslips
  format       TEXT NOT NULL DEFAULT 'csv', -- csv | xlsx | pdf | json
  filters_json TEXT DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'queued', -- queued | processing | complete | failed
  row_count    INTEGER DEFAULT 0,
  file_url     TEXT,
  file_size_kb INTEGER DEFAULT 0,
  requested_by INTEGER,
  error_msg    TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  expires_at   TEXT
);
CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON ig_export_jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_jobs_user ON ig_export_jobs(requested_by, created_at DESC);

-- ── 6. Outbound Webhooks ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_webhooks_outbound (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  webhook_id    TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  url           TEXT NOT NULL,
  events        TEXT NOT NULL DEFAULT '[]',  -- JSON array of event types
  secret_hash   TEXT,
  is_active     INTEGER NOT NULL DEFAULT 1,
  retry_count   INTEGER NOT NULL DEFAULT 3,
  last_fired_at TEXT,
  last_status   INTEGER,
  total_deliveries INTEGER NOT NULL DEFAULT 0,
  failed_deliveries INTEGER NOT NULL DEFAULT 0,
  created_by    INTEGER,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_webhooks_outbound_active ON ig_webhooks_outbound(is_active, events);

-- ── Seed: Notifications ──────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_notifications (user_id, type, category, title, message, is_read, action_url, created_at) VALUES
(1, 'warning',  'compliance',  'DPDP DFR Submission Due',         'Data Fiduciary Registration due by 2026-06-30. Draft started.', 0, '/admin#dpdp',        datetime('now', '-2 hours')),
(1, 'warning',  'finance',     'MSME Overdue Payments Alert',     '4 MSME vendor invoices overdue >45 days totalling ₹8.4L.',     0, '/admin#finance',     datetime('now', '-4 hours')),
(1, 'info',     'hr',          'Payroll Run Initiated',           'March 2026 payroll run started. ETA: 2 hours.',                 1, '/admin#payroll',     datetime('now', '-6 hours')),
(1, 'error',    'sales',       'Churn Alert: FreshMart Retail',   'FreshMart Retail (ARR ₹18.4L) at 84% churn probability.',      0, '/admin#cs',          datetime('now', '-8 hours')),
(1, 'success',  'system',      'Phase W Deployment Complete',     '77/79 stubs upgraded, 452 D1 routes live. Build 4.8MB.',        1, '/admin#platform',   datetime('now', '-1 day')),
(1, 'info',     'compliance',  'GST GSTR-1 Filing Due',           'April 2026 GSTR-1 filing due 2026-05-11.',                     0, '/admin#gst',         datetime('now', '-12 hours')),
(1, 'warning',  'dpdp',        'Vendor DPA Pending: Razorpay',    'Razorpay DPA still unsigned — high risk. Action required.',    0, '/admin#dpdp',        datetime('now', '-3 hours')),
(1, 'success',  'sales',       'New Deal Closed: TechPark Café',  'TechPark Café signed ₹4.2L ARR deal. Onboarding started.',     1, '/admin#sales',       datetime('now', '-1 day'));

-- ── Seed: Feature Flags ──────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_feature_flags (flag_key, name, description, is_enabled, rollout_pct, environments) VALUES
('ai_payroll_anomaly',     'AI Payroll Anomaly Detection',   'ML-based payroll anomaly flagging',              1, 100, '["production","staging"]'),
('whatsapp_otp',           'WhatsApp OTP Login',             'OTP via WhatsApp Business API',                  1, 100, '["production"]'),
('horeca_demand_forecast',  'HORECA Demand Forecasting',     'ML demand forecast for HORECA module',            0, 0,   '["staging"]'),
('dpdp_auto_consent',      'DPDP Auto Consent Collection',   'Automated consent collection on signup',          1, 100, '["production"]'),
('executive_board_pack',   'Executive Board Pack PDF',       'Auto-generate board pack PDF monthly',            0, 20,  '["staging"]'),
('partner_portal',         'Partner Self-Service Portal',    'Partners can log in and view their metrics',      0, 0,   '["staging"]'),
('bulk_export',            'Bulk Data Export',               'Export leads/invoices/employees to CSV/XLSX',     1, 100, '["production"]'),
('ai_churn_prediction',    'AI Churn Prediction Engine',     'Real-time churn probability scoring',             1, 100, '["production","staging"]');

-- ── Seed: Support Tickets ────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_support_tickets (ticket_id, subject, category, priority, status, reporter_email, created_at, sla_due_at) VALUES
('TKT-2026-001', 'Payslip not generated for March',        'hr',         'high',     'in_progress', 'hr@indiagully.com',      datetime('now', '-3 days'),  datetime('now', '+1 day')),
('TKT-2026-002', 'GST filing portal timeout',              'technical',  'critical', 'open',        'finance@indiagully.com', datetime('now', '-1 day'),   datetime('now', '+4 hours')),
('TKT-2026-003', 'Invoice not showing in portal',          'billing',    'medium',   'pending',     'ops@indiagully.com',     datetime('now', '-5 days'),  datetime('now', '+2 days')),
('TKT-2026-004', 'DPDP consent withdraw not confirming',   'compliance', 'high',     'open',        'dpo@indiagully.com',     datetime('now', '-2 days'),  datetime('now', '+6 hours')),
('TKT-2026-005', 'Attendance sync failure — Pune office',  'technical',  'medium',   'resolved',    'admin@indiagully.com',   datetime('now', '-7 days'),  datetime('now', '-2 days')),
('TKT-2026-006', 'EWB generation API error',               'technical',  'high',     'in_progress', 'logistics@indiagully.com', datetime('now', '-2 days'), datetime('now', '+8 hours'));

-- ── Seed: API Keys ───────────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_api_keys (key_id, key_hash, name, description, scopes, rate_limit, is_active, created_at) VALUES
('igk_prod_hrms_001',   'sha256:placeholder1', 'HRMS Integration Key',     'Used by payroll system to sync employee data', '["hr:read","payroll:read"]',        2000, 1, datetime('now', '-90 days')),
('igk_prod_crm_001',    'sha256:placeholder2', 'CRM Sync Key',             'Salesforce bidirectional sync',                '["leads:read","leads:write"]',      1000, 1, datetime('now', '-60 days')),
('igk_prod_gst_001',    'sha256:placeholder3', 'GST Portal Key',           'Auto-filing with GST portal',                  '["gst:read","gst:write"]',          500,  1, datetime('now', '-30 days')),
('igk_staging_test_001','sha256:placeholder4', 'Staging Test Key',         'QA automation suite key',                      '["*"]',                             5000, 1, datetime('now', '-14 days'));

-- ── Seed: Outbound Webhooks ──────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_webhooks_outbound (webhook_id, name, url, events, is_active, total_deliveries, failed_deliveries, created_at) VALUES
('wh_slack_alerts',   'Slack Critical Alerts',   'https://hooks.slack.com/services/placeholder', '["churn.alert","fraud.detected","compliance.breach"]', 1, 142, 3,  datetime('now', '-30 days')),
('wh_crm_sync',       'CRM Lead Sync',           'https://api.salesforce.com/webhook/ig',         '["lead.created","deal.closed","lead.updated"]',       1, 890, 12, datetime('now', '-60 days')),
('wh_gst_portal',     'GST Auto-file Trigger',   'https://api.gst.gov.in/webhook/placeholder',    '["invoice.approved","gst.period.close"]',             0, 48,  2,  datetime('now', '-90 days')),
('wh_dpdp_notify',    'DPDP Rights Notifier',    'https://dpdp.indiagully.com/webhook/rights',    '["dpdp.consent.withdrawn","dpdp.rights.request"]',    1, 34,  0,  datetime('now', '-45 days'));

-- ── Export Jobs seed (recent) ────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_export_jobs (job_id, type, format, status, row_count, file_size_kb, requested_by, created_at, completed_at) VALUES
('exp_leads_20260320',    'leads',     'csv',  'complete', 2840, 284,  1, datetime('now', '-1 day'),   datetime('now', '-1 day', '+5 minutes')),
('exp_invoices_20260319', 'invoices',  'xlsx', 'complete', 184,  142,  1, datetime('now', '-2 days'),  datetime('now', '-2 days', '+3 minutes')),
('exp_audit_20260318',    'audit_log', 'csv',  'complete', 5420, 842,  1, datetime('now', '-3 days'),  datetime('now', '-3 days', '+8 minutes')),
('exp_emp_20260317',      'employees', 'xlsx', 'complete', 48,   28,   1, datetime('now', '-4 days'),  datetime('now', '-4 days', '+2 minutes')),
('exp_gst_20260301',      'gst',       'pdf',  'complete', 184,  380,  1, datetime('now', '-20 days'), datetime('now', '-20 days', '+12 minutes'));
