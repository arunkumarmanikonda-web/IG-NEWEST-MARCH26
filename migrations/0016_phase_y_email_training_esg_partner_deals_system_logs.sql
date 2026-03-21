-- Migration 0016: Phase Y — Email Queue, Scheduled Tasks, Employee Training, ESG Metrics, Partner Deals, System Logs
-- Generated: 2026-03-21

-- ── 1. Email Queue ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_email_queue (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id   TEXT NOT NULL UNIQUE,
  to_email     TEXT NOT NULL,
  to_name      TEXT,
  from_email   TEXT NOT NULL DEFAULT 'noreply@indiagully.com',
  subject      TEXT NOT NULL,
  body_html    TEXT,
  body_text    TEXT,
  template_id  TEXT,
  template_vars TEXT DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'queued', -- queued | sent | failed | cancelled
  priority     INTEGER NOT NULL DEFAULT 5,     -- 1=highest, 10=lowest
  attempts     INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  scheduled_at TEXT,
  sent_at      TEXT,
  error_msg    TEXT,
  category     TEXT DEFAULT 'transactional',   -- transactional | marketing | alert | report
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON ig_email_queue(status, priority, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_to ON ig_email_queue(to_email, status);

-- ── 2. Scheduled Tasks ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_scheduled_tasks (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id      TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  description  TEXT,
  task_type    TEXT NOT NULL,   -- export | report | email | cleanup | sync | alert
  cron_expr    TEXT,            -- cron expression e.g. '0 9 * * 1' = Mon 9am
  payload_json TEXT DEFAULT '{}',
  is_active    INTEGER NOT NULL DEFAULT 1,
  last_run_at  TEXT,
  next_run_at  TEXT,
  last_status  TEXT,            -- success | failed | skipped
  run_count    INTEGER NOT NULL DEFAULT 0,
  fail_count   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_active ON ig_scheduled_tasks(is_active, next_run_at);

-- ── 3. Employee Training (L&D) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_employee_training (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id     INTEGER NOT NULL,
  course_id       TEXT NOT NULL,
  course_name     TEXT NOT NULL,
  category        TEXT DEFAULT 'compliance', -- compliance | technical | soft-skills | safety | dpdp
  provider        TEXT,
  status          TEXT NOT NULL DEFAULT 'enrolled', -- enrolled | in_progress | completed | failed | expired
  score_pct       INTEGER,
  completion_date TEXT,
  expiry_date     TEXT,
  is_mandatory    INTEGER NOT NULL DEFAULT 0,
  cert_url        TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_training_employee ON ig_employee_training(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_training_course ON ig_employee_training(course_id, status);
CREATE INDEX IF NOT EXISTS idx_training_expiry ON ig_employee_training(expiry_date, is_mandatory);

-- ── 4. ESG Metrics ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_esg_metrics (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  category     TEXT NOT NULL,   -- environmental | social | governance
  sub_category TEXT NOT NULL,   -- carbon | energy | water | diversity | training | board | compliance
  metric_name  TEXT NOT NULL,
  value        REAL NOT NULL,
  unit         TEXT NOT NULL,
  period       TEXT NOT NULL,   -- e.g. '2025-Q4', 'FY2025-26'
  baseline     REAL,
  target       REAL,
  status       TEXT DEFAULT 'on_track', -- on_track | at_risk | critical | achieved
  notes        TEXT,
  verified_by  TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_esg_category ON ig_esg_metrics(category, sub_category, period);

-- ── 5. Partner Deals ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_partner_deals (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id       TEXT NOT NULL UNIQUE,
  partner_name  TEXT NOT NULL,
  partner_tier  TEXT DEFAULT 'silver', -- gold | silver | bronze | platinum
  client_name   TEXT NOT NULL,
  deal_value_lakh REAL NOT NULL DEFAULT 0,
  product       TEXT,
  stage         TEXT NOT NULL DEFAULT 'registered', -- registered | qualified | proposal | negotiation | won | lost
  expected_close TEXT,
  region        TEXT,
  mdf_requested_lakh REAL DEFAULT 0,
  mdf_approved_lakh  REAL DEFAULT 0,
  dpa_signed    INTEGER DEFAULT 0,
  registered_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at     TEXT
);
CREATE INDEX IF NOT EXISTS idx_partner_deals_partner ON ig_partner_deals(partner_name, stage);
CREATE INDEX IF NOT EXISTS idx_partner_deals_stage ON ig_partner_deals(stage, expected_close);

-- ── 6. System Logs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_system_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  level      TEXT NOT NULL DEFAULT 'info', -- debug | info | warn | error | critical
  service    TEXT NOT NULL,                -- api | worker | cron | webhook | export
  message    TEXT NOT NULL,
  meta_json  TEXT DEFAULT '{}',
  request_id TEXT,
  user_id    INTEGER,
  duration_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON ig_system_logs(level, service, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_service ON ig_system_logs(service, created_at DESC);

-- ── Seed: Email Queue ─────────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_email_queue (message_id, to_email, to_name, subject, status, category, created_at, sent_at) VALUES
('msg_payslip_mar26_001', 'arjun.sharma@indiagully.com', 'Arjun Sharma', 'Your March 2026 Payslip is Ready', 'sent', 'transactional', datetime('now','-2 days'), datetime('now','-2 days','+30 seconds')),
('msg_gst_reminder_001',  'finance@indiagully.com',      'Finance Team', 'GSTR-1 Filing Due: April 2026',     'queued', 'alert',  datetime('now','-1 hour'), NULL),
('msg_dpdp_breach_001',   'dpo@indiagully.com',          'DPO Team',     'DPDP Breach Notification Required', 'sent',  'alert',  datetime('now','-3 days'), datetime('now','-3 days','+15 seconds')),
('msg_vendor_dpa_001',    'vendor@razorpay.com',          'Razorpay DPA', 'DPA Signature Required — Urgent',   'queued', 'transactional', datetime('now','-4 hours'), NULL),
('msg_weekly_report_001', 'ceo@indiagully.com',           'CEO',          'Weekly Platform Report — Mar 2026', 'sent',  'report', datetime('now','-7 days'), datetime('now','-7 days','+45 seconds'));

-- ── Seed: Scheduled Tasks ─────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_scheduled_tasks (task_id, name, task_type, cron_expr, is_active, last_status, run_count, last_run_at, next_run_at) VALUES
('task_weekly_report',    'Weekly Executive Report',    'report',  '0 8 * * 1',  1, 'success', 12, datetime('now','-7 days'), datetime('now','+7 days')),
('task_gst_reminder',     'GST Filing Reminder',        'alert',   '0 9 1 * *',  1, 'success',  3, datetime('now','-30 days'), datetime('now','+10 days')),
('task_payroll_reminder', 'Monthly Payroll Reminder',   'alert',   '0 9 25 * *', 1, 'success',  3, datetime('now','-25 days'), datetime('now','+5 days')),
('task_audit_cleanup',    'Audit Log Cleanup (>90d)',   'cleanup', '0 2 * * 0',  1, 'success', 12, datetime('now','-7 days'),  datetime('now','+7 days')),
('task_export_leads',     'Daily Leads Export',         'export',  '0 6 * * *',  0, 'skipped',  0, NULL, datetime('now','+1 day')),
('task_dpdp_consent_chk', 'DPDP Consent Audit',        'alert',   '0 10 * * 1', 1, 'success',  4, datetime('now','-7 days'),  datetime('now','+7 days'));

-- ── Seed: Employee Training ───────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_employee_training (employee_id, course_id, course_name, category, provider, status, score_pct, completion_date, expiry_date, is_mandatory) VALUES
(1, 'CRS-DPDP-001', 'DPDP Act 2023 Awareness',         'dpdp',        'India Gully LMS', 'completed', 92, '2026-01-15', '2027-01-15', 1),
(1, 'CRS-SEC-001',  'Cybersecurity Fundamentals',       'compliance',  'India Gully LMS', 'completed', 88, '2026-02-10', '2027-02-10', 1),
(2, 'CRS-DPDP-001', 'DPDP Act 2023 Awareness',         'dpdp',        'India Gully LMS', 'completed', 78, '2026-01-20', '2027-01-20', 1),
(2, 'CRS-HR-001',   'Workplace Safety & POSH',          'compliance',  'India Gully LMS', 'in_progress', NULL, NULL, '2026-04-30', 1),
(3, 'CRS-DPDP-001', 'DPDP Act 2023 Awareness',         'dpdp',        'India Gully LMS', 'enrolled',  NULL, NULL, NULL, 1),
(1, 'CRS-FIN-001',  'Finance for Non-Finance Managers', 'soft-skills', 'Coursera',        'completed', 95, '2026-03-01', NULL, 0),
(4, 'CRS-SEC-001',  'Cybersecurity Fundamentals',       'compliance',  'India Gully LMS', 'completed', 72, '2026-02-28', '2027-02-28', 1),
(5, 'CRS-DPDP-001', 'DPDP Act 2023 Awareness',         'dpdp',        'India Gully LMS', 'in_progress', NULL, NULL, NULL, 1);

-- ── Seed: ESG Metrics ─────────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_esg_metrics (category, sub_category, metric_name, value, unit, period, baseline, target, status) VALUES
-- Environmental
('environmental', 'carbon',   'Scope 1 GHG Emissions',          2.4,   'tCO2e',   'FY2025-26', 3.2,  2.0,  'on_track'),
('environmental', 'carbon',   'Scope 2 GHG Emissions (Market)', 18.4,  'tCO2e',   'FY2025-26', 24.0, 15.0, 'on_track'),
('environmental', 'energy',   'Total Energy Consumption',       142.0, 'MWh',     'FY2025-26', 168.0,130.0,'on_track'),
('environmental', 'energy',   'Renewable Energy Share',          68.0, 'pct',     'FY2025-26', 42.0, 80.0, 'at_risk'),
('environmental', 'water',    'Water Consumption',               84.0, 'kL',      'FY2025-26', 96.0, 72.0, 'on_track'),
-- Social
('social', 'diversity',  'Women in Leadership (pct)',           34.0, 'pct',     'FY2025-26', 28.0, 40.0, 'on_track'),
('social', 'diversity',  'Total Headcount',                     48.0, 'FTE',     'FY2025-26', 36.0, 60.0, 'on_track'),
('social', 'training',   'Avg Training Hours per Employee',     18.4, 'hrs/yr',  'FY2025-26', 14.0, 24.0, 'at_risk'),
('social', 'training',   'DPDP Training Completion Rate',       84.0, 'pct',     'FY2025-26', 0.0,  100.0,'at_risk'),
('social', 'safety',     'Workplace Incident Rate',              0.0, 'per 100', 'FY2025-26', 0.0,  0.0,  'achieved'),
-- Governance
('governance', 'board',      'Board Independence (%)',          60.0, 'pct',     'FY2025-26', 40.0, 60.0, 'achieved'),
('governance', 'compliance', 'DPDP Compliance Score',           83.0, 'pct',     'FY2025-26', 0.0,  95.0, 'on_track'),
('governance', 'compliance', 'Policy Review Completion',        78.6, 'pct',     'FY2025-26', 60.0, 100.0,'at_risk'),
('governance', 'compliance', 'Audit Finding Resolution Rate',   92.0, 'pct',     'FY2025-26', 80.0, 98.0, 'on_track');

-- ── Seed: Partner Deals ───────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_partner_deals (deal_id, partner_name, partner_tier, client_name, deal_value_lakh, product, stage, expected_close, region, mdf_requested_lakh, mdf_approved_lakh, dpa_signed) VALUES
('PD-2026-001', 'TechSolutions Pvt Ltd', 'gold',   'Mumbai HORECA Chain',    8.4,  'HORECA SaaS',   'negotiation', '2026-04-30', 'West',  1.2, 0.8, 1),
('PD-2026-002', 'CloudFirst Systems',   'silver',  'Pune IT Park Cluster',   4.2,  'HR Platform',   'proposal',    '2026-05-15', 'West',  0.6, 0.4, 1),
('PD-2026-003', 'DataBridge India',     'gold',    'Bangalore FinTech Co',   12.8, 'Full Suite',    'won',         '2026-03-15', 'South', 1.8, 1.8, 1),
('PD-2026-004', 'BizEnable Corp',       'silver',  'Chennai Retail Group',   3.6,  'DPDP Compliance','registered', '2026-06-30', 'South', 0.4, 0.0, 0),
('PD-2026-005', 'NexGen Partners',      'bronze',  'Delhi FMCG Brand',       2.4,  'HR Platform',   'qualified',   '2026-05-30', 'North', 0.2, 0.0, 1),
('PD-2026-006', 'Alliance Tech',        'platinum','Pan-India Enterprise',   42.0, 'Enterprise Suite','negotiation','2026-06-15','Pan-India',6.0,4.0, 1);

-- ── Seed: System Logs ─────────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_system_logs (level, service, message, duration_ms, created_at) VALUES
('info',  'api',     'Phase X deployed successfully — 511 routes active',     NULL, datetime('now','-1 day')),
('info',  'worker',  'D1 migration 0015 applied — 6 new tables created',      NULL, datetime('now','-1 day','+5 minutes')),
('warn',  'api',     'Rate limit triggered: /api/auth/login from 203.x.x.x',  NULL, datetime('now','-2 hours')),
('error', 'webhook', 'Webhook delivery failed: wh_gst_portal (HTTP 503)',     NULL, datetime('now','-3 hours')),
('info',  'cron',    'Weekly report email dispatched to CEO',                 2840, datetime('now','-7 days')),
('warn',  'api',     'Slow query: /api/cs/health-score took 842ms (D1)',       842, datetime('now','-4 hours')),
('info',  'export',  'Leads export completed: 2840 rows, 284KB CSV',          NULL, datetime('now','-1 day'));
