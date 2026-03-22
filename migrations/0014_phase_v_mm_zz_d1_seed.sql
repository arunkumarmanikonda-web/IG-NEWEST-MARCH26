-- Migration 0014: Phase V — MM-ZZ route D1 wiring seed data
-- Seeds ig_horeca_vendors (procurement), ig_risk_registry (risk/PP),
-- ig_compliance_calendar (XX), ig_kpi_records (LL extensions),
-- ig_okrs (TT/YY), ig_insights (QQ/analytics), ig_audit_log indexes
-- No new tables — purely seed data + performance indexes
-- Generated: 2026-03-21

-- ─────────────────────────────────────────────
-- 1. Vendor/Procurement seed (NN round)
-- ─────────────────────────────────────────────
-- PATCH: Add insight columns used in Phase V seed
ALTER TABLE ig_insights ADD COLUMN ref TEXT;
ALTER TABLE ig_insights ADD COLUMN insight_text TEXT;
ALTER TABLE ig_insights ADD COLUMN priority TEXT DEFAULT 'medium';
ALTER TABLE ig_insights ADD COLUMN source TEXT;
ALTER TABLE ig_insights ADD COLUMN generated_at TEXT;
ALTER TABLE ig_insights ADD COLUMN expires_at TEXT;


INSERT OR IGNORE INTO ig_horeca_vendors (name, category, contact_name, email, phone, gstin, payment_terms, rating, created_at)
VALUES
  ('Apex Supplies Pvt. Ltd.',      'Raw Materials',   'Rajan Mehta',  'rajan@apexsupplies.in',   '9810001001', '07AABCA1234A1Z5', 'Net-30',  4.2, datetime('now','-180 days')),
  ('BrightPack Industries',        'Packaging',       'Sunita Rao',   'sunita@brightpack.in',    '9820002002', '29AABCB5678B1Z3', 'Net-45',  3.8, datetime('now','-150 days')),
  ('CoolChain Logistics',          'Cold Chain',      'Arjun Singh',  'arjun@coolchain.co',      '9830003003', '06AABCC9012C1Z1', 'Net-30',  4.5, datetime('now','-120 days')),
  ('DairyFresh Co-op',             'Dairy',           'Meena Pillai', 'meena@dairyfresh.in',     '9840004004', '32AABCD3456D1Z9', 'Net-15',  4.7, datetime('now','-200 days')),
  ('EcoWrap Solutions',            'Packaging',       'Kartik Joshi', 'kartik@ecowrap.in',       '9850005005', '24AABCE7890E1Z7', 'Net-30',  3.5, datetime('now','-90 days')),
  ('FuelMart Petroleum',           'Energy',          'Priya Nair',   'priya@fuelmart.in',       '9860006006', '21AABCF2345F1Z5', 'Net-7',   4.0, datetime('now','-60 days')),
  ('GreenField Agro',              'Fresh Produce',   'Vivek Sharma', 'vivek@greenfield.farm',   '9870007007', '09AABCG6789G1Z3', 'Net-7',   4.8, datetime('now','-240 days')),
  ('HorizonTech Systems',          'IT Hardware',     'Deepa Kumar',  'deepa@horizontech.in',    '9880008008', '36AABCH1234H1Z1', 'Net-60',  3.9, datetime('now','-30 days')),
  ('IndoSpice Traders',            'Spices',          'Ramesh Gupta', 'ramesh@indospice.com',    '9890009009', '08AABCI5678I1Z9', 'Net-30',  4.3, datetime('now','-180 days')),
  ('JetSpeed Courier',             'Logistics',       'Anita Bose',   'anita@jetspeed.in',       '9900010010', '19AABCJ9012J1Z7', 'Net-15',  3.7, datetime('now','-45 days')),
  ('KitchenPro Equipment',         'Equipment',       'Sanjay Patel', 'sanjay@kitchenpro.in',    '9910011011', '24AABCK3456K1Z5', 'Net-60',  4.1, datetime('now','-300 days')),
  ('LiquorBridge Imports',         'Beverages',       'Nalini Reddy', 'nalini@liquorbridge.in',  '9920012012', '36AABCL7890L1Z3', 'Net-30',  4.6, datetime('now','-150 days'));

-- ─────────────────────────────────────────────
-- 2. Risk registry seed (PP round)
-- ─────────────────────────────────────────────
INSERT OR IGNORE INTO ig_risk_registry (id, sector, property_name, factors_json, risk_score, assigned_to, status, created_at)
VALUES
  ('RISK-001', 'Operational',  'Supply Chain Disruption', 'Single-source dependency. Mitigation: Dual-source 3 critical vendors by Q2', 16, 'ops@indiagully.com', 'Open', datetime('now','-60 days')),
  ('RISK-002', 'Financial',    'Revenue Concentration', 'Top 5 clients = 68% of ARR. Mitigation: Diversify to 12+ clients by FY-end', 15, 'finance@indiagully.com', 'Open', datetime('now','-45 days')),
  ('RISK-003', 'Compliance',   'GST Reconciliation Gap', '0.10L mismatch in ITC. Mitigation: Filed rectification with GSTN', 8, 'finance@indiagully.com', 'Mitigated', datetime('now','-30 days')),
  ('RISK-004', 'Cyber',        'Phishing / Account Takeover', 'Admin account targeted twice in last 90 days. Mitigation: MFA enforced, security training Q1', 15, 'it@indiagully.com', 'Open', datetime('now','-20 days')),
  ('RISK-005', 'HR',           'Key-Person Dependency', 'CFO and CTO are single points of failure. Mitigation: Succession planning document by Apr 2026', 10, 'hr@indiagully.com', 'Open', datetime('now','-90 days')),
  ('RISK-006', 'Legal',        'MSME Payment Delays', '4 MSME vendors >45 days unpaid. Mitigation: Expedite payment cycle, AP review weekly', 12, 'finance@indiagully.com', 'Open', datetime('now','-10 days')),
  ('RISK-007', 'Market',       'Hospitality Sector Slowdown', 'Q3 demand dip, 3 hotel clients deferred mandates. Mitigation: Pipeline diversification into FMCG', 12, 'sales@indiagully.com', 'Monitored', datetime('now','-15 days')),
  ('RISK-008', 'Operational',  'Data Centre Outage', 'Single AZ deployment, 14-min avg sync lag on ERP. Mitigation: Multi-region failover planned Q2', 8, 'it@indiagully.com', 'Mitigated', datetime('now','-7 days'));

-- ─────────────────────────────────────────────
-- 3. Compliance calendar seed (XX round)
-- ─────────────────────────────────────────────
INSERT OR IGNORE INTO ig_compliance_calendar (id, title, due_date, module, status, notes, created_at)
VALUES
  ('CAL-001', 'GSTR-1 Filing — April 2026',          '2026-05-11', 'finance@indiagully.com',    'Upcoming', 'B2B invoice details upload to GSTN',         datetime('now')),
  ('CAL-002', 'GSTR-3B Payment — April 2026',         '2026-05-20', 'finance@indiagully.com',    'Upcoming', 'Net GST liability payment and filing',       datetime('now')),
  ('CAL-003', 'TDS Return §194J Q4 FY26',             '2026-05-31', 'finance@indiagully.com',    'Upcoming', 'Professional services TDS return 26Q',       datetime('now')),
  ('CAL-004', 'PF Challan — April 2026',               '2026-05-15', 'hr@indiagully.com',         'Upcoming', 'EPFO ECR upload and challan payment',        datetime('now')),
  ('CAL-005', 'ESIC Contribution — April 2026',        '2026-05-15', 'hr@indiagully.com',         'Upcoming', 'ESIC portal contribution',                   datetime('now')),
  ('CAL-006', 'PT Return — Karnataka Q4',              '2026-04-30', 'hr@indiagully.com',         'Due Soon', 'Professional tax return',                    datetime('now')),
  ('CAL-007', 'FSSAI Renewal — Main Kitchen',          '2026-06-30', 'ops@indiagully.com',        'Upcoming', 'FSSAI license renewal submission',           datetime('now')),
  ('CAL-008', 'DPDP DPO Annual Report',                '2026-07-01', 'dpo@indiagully.com',        'Upcoming', 'Submit annual DPO compliance report to CERT',datetime('now')),
  ('CAL-009', 'Income Tax Advance Tax Q1 FY27',        '2026-06-15', 'finance@indiagully.com',    'Upcoming', '15% advance tax instalment',                 datetime('now')),
  ('CAL-010', 'Board Meeting — Q4 FY26 Review',        '2026-04-30', 'cs@indiagully.com',         'Due Soon', 'Financial results and strategy review',      datetime('now')),
  ('CAL-011', 'SEBI BRSR Disclosure FY26',             '2026-09-30', 'finance@indiagully.com',    'Upcoming', 'Business Responsibility & Sustainability',   datetime('now')),
  ('CAL-012', 'Annual VAPT / Penetration Test',        '2026-06-30', 'it@indiagully.com',         'Upcoming', 'External pen-test per IT policy',            datetime('now'));

-- ─────────────────────────────────────────────
-- 4. KPI records — LL-round product/engineering (Q4 FY26)
-- ─────────────────────────────────────────────
INSERT OR IGNORE INTO ig_kpi_records (department, metric_name, target_value, actual_value, target_label, actual_label, unit, period, pct_complete)
VALUES
  ('Product',      'Sprint Velocity',       80,  82,   '80 pts',  '82 pts',   'story_points', '2026-Q4', 102),
  ('Product',      'Feature On-Track Rate', 90,  87,   '90%',     '87%',      'pct',          '2026-Q4',  97),
  ('Product',      'Roadmap Completion',    85,  78,   '85%',     '78%',      'pct',          '2026-Q4',  92),
  ('Engineering',  'Test Coverage',         80,  72,   '80%',     '72%',      'pct',          '2026-Q4',  90),
  ('Engineering',  'P1 Incidents (month)',   2,   2,   '≤2',      '2',        'count',        '2026-Q4', 100),
  ('Engineering',  'MTTR (hours)',           3,   4.2, '≤3h',     '4.2h',     'hours',        '2026-Q4',  71),
  ('Engineering',  'Tech Debt (days)',      20,  24,   '≤20d',    '24d',      'days',         '2026-Q4',  83),
  ('CS',           'Customer Health Score', 75,  68,   '75',      '68',       'score',        '2026-Q4',  91),
  ('CS',           'NPS Score',             50,  54,   '50',      '54',       'score',        '2026-Q4', 108),
  ('CS',           'Onboarding (avg days)',  21,  28,   '21d',     '28d',      'days',         '2026-Q4',  75),
  ('Procurement',  'On-Time Delivery',      92,  88,   '92%',     '88%',      'pct',          '2026-Q4',  96),
  ('Procurement',  'Vendor Rating (avg)',    4.0, 4.1, '4.0',     '4.1',      'rating',       '2026-Q4', 103),
  ('Marketing',    'CAC (₹ Lakh)',           1.2, 1.4, '₹1.2L',  '₹1.4L',   'lakh',         '2026-Q4',  86),
  ('Marketing',    'Lead Conversion Rate',  12,  10.8, '12%',     '10.8%',    'pct',          '2026-Q4',  90),
  ('IT',           'Uptime SLA',            99.9,99.7, '99.9%',  '99.7%',    'pct',          '2026-Q4',  99),
  ('IT',           'Security Patch Lag',     7,  12,   '≤7d',     '12d',      'days',         '2026-Q4',  58);

-- ─────────────────────────────────────────────
-- 5. OKRs seed (TT/YY rounds)
-- ─────────────────────────────────────────────
INSERT OR IGNORE INTO ig_okrs (department, objective, progress, owner, period, created_at)
VALUES
  ('Sales',        'Grow ARR to ₹6 Cr FY26 — Close 12 new enterprise deals',      67, 'sales@indiagully.com', 'FY26-Q4', datetime('now','-90 days')),
  ('Sales',        'Grow ARR to ₹6 Cr FY26 — Reduce avg sales cycle to 35 days', 83, 'sales@indiagully.com', 'FY26-Q4', datetime('now','-90 days')),
  ('Product',      'Launch V2.0 platform by Jun 2026 — Complete 85% roadmap features', 92, 'product@indiagully.com', 'FY26-Q4', datetime('now','-60 days')),
  ('Product',      'Launch V2.0 platform by Jun 2026 — Achieve test coverage 80%', 90, 'product@indiagully.com', 'FY26-Q4', datetime('now','-60 days')),
  ('HR',           'Reduce attrition to 10% FY26 — Complete succession plans for KMPs', 40, 'hr@indiagully.com', 'FY26-Q4', datetime('now','-30 days')),
  ('Finance',      'Achieve EBITDA 28% — Reduce debtor days to 35', 83, 'finance@indiagully.com', 'FY26-Q4', datetime('now','-30 days')),
  ('Finance',      'Achieve EBITDA 28% — Close 3 pending audit observations', 67, 'finance@indiagully.com', 'FY26-Q4', datetime('now','-30 days')),
  ('IT',           'Zero P1 downtime incidents FY26 — Deploy multi-region failover', 0, 'it@indiagully.com', 'FY26-Q4', datetime('now','-15 days'));

-- ─────────────────────────────────────────────
-- 6. Insights / AI pipeline seed (QQ round)
-- ─────────────────────────────────────────────
INSERT OR IGNORE INTO ig_insights (ref, category, title, insight_text, priority, source, status, generated_at, expires_at)
VALUES
  ('INS-001', 'Sales',       'Deal Velocity Alert',          'Sunrise Hospitality stalled 96 days in Proposal — assign CSM for re-engagement', 'High',   'pipeline_ml',    'Active', datetime('now','-2 days'),  datetime('now','+28 days')),
  ('INS-002', 'Finance',     'GST Mismatch',                 '₹0.10L ITC mismatch with GSTN portal — file rectification this week',            'High',   'gst_reconciler', 'Active', datetime('now','-1 day'),   datetime('now','+14 days')),
  ('INS-003', 'CS',          'Churn Risk',                   'FreshMart Retail: 42 days no login, health score 28 — escalate immediately',      'High',   'health_score_ml','Active', datetime('now','-3 days'),  datetime('now','+21 days')),
  ('INS-004', 'HR',          'Attrition Pattern',            'Engineering attrition 18.4% — above 14.2% avg, exit interviews show comp gap',    'Medium', 'hr_analytics',   'Active', datetime('now','-5 days'),  datetime('now','+30 days')),
  ('INS-005', 'Procurement', 'Vendor Concentration',         'Top 5 vendors = 68% FY26 spend, add 2 alternates for BrightPack and FuelMart',   'Medium', 'spend_analytics', 'Active', datetime('now','-7 days'),  datetime('now','+45 days')),
  ('INS-006', 'Compliance',  'MSME Payment Overdue',         '4 MSME vendors unpaid >45 days — MSMED Act §15 penalty risk, clear by Apr 30',   'High',   'compliance_bot', 'Active', datetime('now','-1 day'),   datetime('now','+10 days')),
  ('INS-007', 'Marketing',   'CAC Spike',                    'CAC increased ₹0.2L vs target — Meta campaigns underperforming, shift to SEO',   'Medium', 'marketing_bi',   'Active', datetime('now','-4 days'),  datetime('now','+21 days')),
  ('INS-008', 'IT',          'Patch Lag',                    '12 servers are 5+ days behind security patches — schedule maintenance window',   'Medium', 'it_monitoring',  'Active', datetime('now','-2 days'),  datetime('now','+7 days'));

-- ─────────────────────────────────────────────
-- 7. Performance indexes (safe — all IF NOT EXISTS)
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_risk_registry_status    ON ig_risk_registry(status);
CREATE INDEX IF NOT EXISTS idx_risk_registry_score     ON ig_risk_registry(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_cal_due      ON ig_compliance_calendar(due_date);
CREATE INDEX IF NOT EXISTS idx_kpi_records_dept_period ON ig_kpi_records(department, period);
CREATE INDEX IF NOT EXISTS idx_okrs_quarter            ON ig_okrs(period, owner);
CREATE INDEX IF NOT EXISTS idx_insights_priority       ON ig_insights(priority, status);
CREATE INDEX IF NOT EXISTS idx_horeca_vendors_rating   ON ig_horeca_vendors(rating DESC, status);
