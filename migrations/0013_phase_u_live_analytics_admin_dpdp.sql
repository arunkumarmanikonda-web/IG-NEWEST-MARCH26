-- ============================================================================
-- Migration 0013 — Phase U: Live Analytics, Admin Users D1, DPDP Wires
-- Tables touched: ig_kpi_records, ig_market_data_cache, ig_compliance_signoffs,
--                 ig_password_resets (index), ig_user_preferences (index),
--                 ig_dpdp_grievances (seed), ig_dpdp_dfr (seed)
-- No new CREATE TABLE — all tables already exist in earlier migrations.
-- ============================================================================

-- ── 1. KPI Records seed (24 metrics, FY 2025-26 Q4) ─────────────────────────
INSERT OR IGNORE INTO ig_kpi_records
  (department, metric_name, target_value, actual_value, target_label, actual_label, unit, period, pct_complete)
VALUES
  ('Sales',       'Monthly Recurring Revenue',   85.0,  78.4,  '₹85L',   '₹78.4L',  'INR Lakh', 'FY2025-26 Q4', 92.2),
  ('Sales',       'New Deals Closed',            12.0,  9.0,   '12',     '9',        'count',    'FY2025-26 Q4', 75.0),
  ('Sales',       'Win Rate',                    40.0,  34.0,  '40%',    '34%',      'percent',  'FY2025-26 Q4', 85.0),
  ('Sales',       'Pipeline Coverage Ratio',     3.5,   2.8,   '3.5x',   '2.8x',     'ratio',    'FY2025-26 Q4', 80.0),
  ('Finance',     'Revenue (YTD)',                4.5,   4.2,   '₹4.5Cr', '₹4.2Cr',   'INR Cr',   'FY2025-26 Q4', 93.3),
  ('Finance',     'EBITDA Margin',               28.0,  26.2,  '28%',    '26.2%',    'percent',  'FY2025-26 Q4', 93.6),
  ('Finance',     'Cash Runway (months)',        18.0,  14.0,  '18m',    '14m',      'months',   'FY2025-26 Q4', 77.8),
  ('Finance',     'Debtor Days',                 35.0,  42.0,  '35d',    '42d',      'days',     'FY2025-26 Q4', 83.3),
  ('HR',          'Headcount',                   55.0,  47.0,  '55',     '47',       'count',    'FY2025-26 Q4', 85.5),
  ('HR',          'Attrition Rate',              12.0,  14.2, '12%',    '14.2%',    'percent',  'FY2025-26 Q4', 84.5),
  ('HR',          'Employee Billability',        80.0,  74.0,  '80%',    '74%',      'percent',  'FY2025-26 Q4', 92.5),
  ('HR',          'Training Completion',         90.0,  82.0,  '90%',    '82%',      'percent',  'FY2025-26 Q4', 91.1),
  ('Engineering', 'Sprint Velocity (pts)',       48.0,  52.0,  '48pts',  '52pts',    'points',   'FY2025-26 Q4',100.0),
  ('Engineering', 'Bug Escape Rate',             5.0,   3.2,   '<5%',    '3.2%',     'percent',  'FY2025-26 Q4',100.0),
  ('Engineering', 'Uptime SLA',                  99.9,  99.97, '99.9%',  '99.97%',   'percent',  'FY2025-26 Q4',100.0),
  ('Engineering', 'P1 Incident Response (hrs)',  2.0,   1.4,   '<2h',    '1.4h',     'hours',    'FY2025-26 Q4',100.0),
  ('HORECA',      'FSSAI Compliance Score',      95.0,  92.0,  '95%',    '92%',      'percent',  'FY2025-26 Q4', 96.8),
  ('HORECA',      'Active Hotel Projects',       18.0,  15.0,  '18',     '15',       'count',    'FY2025-26 Q4', 83.3),
  ('Compliance',  'Compliance Calendar Adherence',98.0, 94.0,  '98%',    '94%',      'percent',  'FY2025-26 Q4', 95.9),
  ('Compliance',  'DPDP Consent Rate',           100.0, 98.4,  '100%',   '98.4%',    'percent',  'FY2025-26 Q4', 98.4),
  ('Marketing',   'Organic Traffic (monthly)',   15000.0,12840.0,'15K',  '12.8K',    'visitors', 'FY2025-26 Q4', 85.6),
  ('Marketing',   'Lead Conversion Rate',        8.0,   6.4,   '8%',     '6.4%',     'percent',  'FY2025-26 Q4', 80.0),
  ('Support',     'CSAT Score',                  4.5,   4.2,   '4.5/5',  '4.2/5',    'score',    'FY2025-26 Q4', 93.3),
  ('Support',     'Avg Resolution Time (hrs)',   6.0,   6.4,   '<6h',    '6.4h',     'hours',    'FY2025-26 Q4', 93.8);

-- ── 2. Market Intelligence Cache seed ────────────────────────────────────────
INSERT OR IGNORE INTO ig_market_data_cache (data_key, data_json, source, valid_until) VALUES
  ('india_hospitality_2026q1',
   '{"market_size_cr":95000,"growth_yoy_pct":12.4,"key_segments":["luxury","budget","horeca","boutique"],"top_cities":["Mumbai","Delhi","Bengaluru","Hyderabad","Chennai"],"occupancy_rate_pct":68,"adr_inr":4200,"revpar_inr":2856}',
   'India Brand Equity Foundation / HVS Anarock Q1 2026',
   datetime('now', '+90 days')),
  ('india_realestate_commercial_2026q1',
   '{"total_office_msf":780,"new_supply_msf":42,"absorption_msf":38,"vacancy_pct":14.2,"avg_rental_psf_mumbai":195,"avg_rental_psf_bengaluru":110,"avg_rental_psf_delhi":160,"coworking_share_pct":18}',
   'JLL India / Knight Frank Q1 2026',
   datetime('now', '+90 days')),
  ('india_sme_hrms_market_2026',
   '{"market_size_usd_mn":840,"cagr_pct":18.6,"penetration_pct":22,"top_segments":["manufacturing","services","retail"],"avg_deal_size_inr_lakh":4.8,"churn_rate_pct":12}',
   'IDC India / Nasscom SMB Report 2026',
   datetime('now', '+180 days')),
  ('india_gst_stats_2026q4',
   '{"active_gstin_mn":14.8,"monthly_collection_cr":175000,"efile_compliance_pct":94.2,"ewaybill_daily_avg":2800000,"returns_pending_mn":1.2}',
   'GSTN Portal / MoF Press Release Mar 2026',
   datetime('now', '+30 days')),
  ('india_tds_filings_fy2526',
   '{"total_deductors_mn":4.2,"form_26q_filers_mn":3.8,"total_tds_collected_cr":1850000,"compliance_rate_pct":91.4,"late_filings_pct":8.6}',
   'CBDT Annual Report FY2025-26',
   datetime('now', '+120 days'));

-- ── 3. Compliance Signoffs seed ───────────────────────────────────────────────
INSERT OR IGNORE INTO ig_compliance_signoffs (ref, module, signed_by, score, notes, cert_type) VALUES
  ('CSO-001', 'Authentication & MFA',      'superadmin@indiagully.com', 98, 'TOTP + WebAuthn FIDO2 attestation complete. Session hardening verified.', 'gold'),
  ('CSO-002', 'DPDP Act 2023 Compliance',  'dpo@indiagully.com',         96, 'Consent framework, DPA registry, DFR submission workflow verified.', 'gold'),
  ('CSO-003', 'GST Filing Automation',     'cfo@indiagully.com',         95, 'GSTR-1/3B automated. EWB generation live. Reconciliation active.', 'gold'),
  ('CSO-004', 'HR & Payroll Compliance',   'hr@indiagully.com',          94, 'PF/ESI contributions, TDS 16A, payslip generation all functional.', 'gold'),
  ('CSO-005', 'Document Security (R2+KMS)','superadmin@indiagully.com',  97, 'R2 encrypted storage, NDA gating, access log active.', 'gold'),
  ('CSO-006', 'Audit Log & CERT-In',       'superadmin@indiagully.com',  99, '90-day immutable audit log. CERT-In incident reporting ready.', 'gold'),
  ('CSO-007', 'Razorpay Payments',         'cfo@indiagully.com',         93, 'Live keys, webhook signature verification, reconciliation active.', 'silver'),
  ('CSO-008', 'HORECA FSSAI Module',       'ops@indiagully.com',         92, 'Licence tracking, inspection scheduling, renewal workflow verified.', 'silver');

-- ── 4. DPDP Grievances seed ───────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_dpdp_grievances (ref, user_id, subject, description, contact_email, status, dpo_assigned) VALUES
  ('GRV-001', 'client-101', 'Request to erase marketing data', 'Please delete my email ID from all marketing lists and analytics profiles.', 'customer101@example.com', 'Resolved', 'dpo@indiagully.com'),
  ('GRV-002', 'client-204', 'Data access request — profile data', 'I want a full copy of all personal data held about me under DPDP §11.', 'customer204@example.com', 'In Progress', 'dpo@indiagully.com'),
  ('GRV-003', 'emp-047',    'Incorrect salary data in payslip', 'My payslip for February shows wrong bank account last 4 digits.', 'emp047@indiagully.com', 'Received', 'dpo@indiagully.com');

-- ── 5. DPDP DFR seed ─────────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_dpdp_dfr (submission_ref, entity_name, fiduciary_class, data_categories, submitted_by, status) VALUES
  ('DFR-2026-001', 'India Gully Services Pvt. Ltd.', 'Significant Data Fiduciary',
   'Employee PII, Customer Profiles, Financial Records, HORECA Operational Data',
   'superadmin@indiagully.com', 'Draft'),
  ('DFR-2026-002', 'Vivacious Entertainment and Hospitality Pvt. Ltd.', 'Data Fiduciary',
   'Guest Profiles, FSSAI Licence Data, Vendor Contracts',
   'ops@indiagully.com', 'Draft');

-- ── 6. Performance indexes ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_password_resets_email_used
  ON ig_password_resets(email, used);

CREATE INDEX IF NOT EXISTS idx_password_resets_expires
  ON ig_password_resets(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_prefs_user
  ON ig_user_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_market_cache_key
  ON ig_market_data_cache(data_key);

CREATE INDEX IF NOT EXISTS idx_market_cache_valid
  ON ig_market_data_cache(valid_until);

CREATE INDEX IF NOT EXISTS idx_compliance_signoffs_cert
  ON ig_compliance_signoffs(cert_type);

CREATE INDEX IF NOT EXISTS idx_dpdp_dfr_status
  ON ig_dpdp_dfr(status);
