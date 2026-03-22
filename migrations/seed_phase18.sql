-- ============================================================================
-- India Gully — Phase 18 Seed Data
-- Matches exact table schemas from all 4 migrations
-- ============================================================================

-- ── Create missing ERP tables ─────────────────────────────────────────────────
-- ig_clients table created in migration 0018

-- ig_enquiries table created in migration 0018

-- ig_vouchers table created in migration 0018

-- ig_board_meetings table created in migration 0018

-- ig_payroll_runs table created in migration 0018

-- ── Seed: ig_users ────────────────────────────────────────────────────────────
-- INSERT OR REPLACE ensures re-running this migration keeps passwords current
INSERT OR REPLACE INTO ig_users
  (identifier, password_hash, password_salt, totp_secret, totp_enabled,
   role, portal, dashboard_url, is_active, mfa_required, is_demo, totp_demo_pin)
VALUES
  -- 1. Super Admin | Password: India@5327** | TOTP: CG5LSHWCQHZL7TV7CQE6Z3DJIAO2MMBZ
  ('superadmin@indiagully.com',
   '531e7f8d58df22dc04f4883380c7def8ea1f7a548938d62065d46cf1c011ec1c',
   'ig-salt-admin-v3-2026', 'CG5LSHWCQHZL7TV7CQE6Z3DJIAO2MMBZ', 1,
   'Super Admin', 'admin', '/admin/dashboard', 1, 1, 0, ''),

  -- 2. Arun Manikonda (MD/Board) | Password: Arun@IG2026 | TOTP: ZMUGY577GXFLTDG6KXKUT3DWZZXOA4JQ
  ('akm@indiagully.com',
   'cdd6bc852a717f91b12f69240f31e79a2395c0fc78933c1085a09898f9dbe5ad',
   'ig-salt-board-akm-2026', 'ZMUGY577GXFLTDG6KXKUT3DWZZXOA4JQ', 1,
   'Board', 'board', '/portal/board/dashboard', 1, 1, 0, ''),

  -- 3. Pavan Manikonda (ED/Board) | Password: Pavan@IG2026 | TOTP: OGLMM2FKY3CI26XF2W6PMUPXMV3EY4DO
  ('pavan@indiagully.com',
   '1acec72c5694e8b9422a5dc4f53619e640df99c78d7ea50f265433a888b9c69c',
   'ig-salt-board-pavan-2026', 'OGLMM2FKY3CI26XF2W6PMUPXMV3EY4DO', 1,
   'Board', 'board', '/portal/board/dashboard', 1, 1, 0, ''),

  -- 4. Amit Jhingan (President/Board) | Password: Amit@IG2026 | TOTP: BI6OWJWK2F5B3C6MZW2UJJOFAV7M3GSR
  ('amit.jhingan@indiagully.com',
   '93a39866cc13631cdc12d38c762869938bfcee2a649250c4952bce79ebebd836',
   'ig-salt-board-amit-2026', 'BI6OWJWK2F5B3C6MZW2UJJOFAV7M3GSR', 1,
   'Board', 'board', '/portal/board/dashboard', 1, 1, 0, ''),

  -- 5. Atul Rana (Head Sales/Employee) | Password: Atul@IG2026# | TOTP: GX6QF2VEKJVQ6LYN7ZTV3SNHBUHPPQQU
  ('atul.rana@indiagully.com',
   'f1868b84e10fb9ba07c183969b669591a82e97f55927cc1ef7fbf8d7bb1d8066',
   'ig-salt-emp-atul-2026', 'GX6QF2VEKJVQ6LYN7ZTV3SNHBUHPPQQU', 1,
   'Employee', 'employee', '/portal/employee/dashboard', 1, 1, 0, ''),

  -- 6. HR Manager | Password: HR@IG2026# | TOTP: 6CYKXRA3K7ENLOPSY5S25FECVXX3BT3Z
  ('hr@indiagully.com',
   'b00b260813234b492e7d553c6baf9db49dff4cf30e3260cfb1d841ae1331508f',
   'ig-salt-hr-2026', '6CYKXRA3K7ENLOPSY5S25FECVXX3BT3Z', 1,
   'Employee', 'employee', '/admin/hr', 1, 1, 0, ''),

  -- 7. Finance CFO | Password: Finance@IG2026# | TOTP: INRLENYXGKG66B4G7PVWZFG7NQLRJHUD
  ('finance@indiagully.com',
   'bea826a65411a726a511dfe3e9cc22f230e71854a74d923b8967724f98eedad7',
   'ig-salt-finance-2026', 'INRLENYXGKG66B4G7PVWZFG7NQLRJHUD', 1,
   'Employee', 'employee', '/admin/finance', 1, 1, 0, ''),

  -- 8. Legal CS | Password: Legal@IG2026# | TOTP: CK76ZZNXPCGWCQNFQZDK4YTQH3DH2YL5
  ('legal@indiagully.com',
   '255f716a8d4c3476776ed5b2971806991ea67083befba1f311ab255270bb70ab',
   'ig-salt-legal-2026', 'CK76ZZNXPCGWCQNFQZDK4YTQH3DH2YL5', 1,
   'Employee', 'employee', '/admin/governance', 1, 1, 0, ''),

  -- Demo / QA (testing only)
  ('demo@indiagully.com',
   '4c4cab256567b00115b6a6e9014569afe7e05cabd16633929a0031730fb7faca',
   'ig-salt-client-v3-2026', 'VCPFNOW2QGBUBUTF2MCQXFCLVCPPOXJU', 1,
   'Client', 'client', '/portal/client/dashboard', 1, 1, 1, ''),

  ('IG-EMP-0001',
   '819a5723b41c76ca06d205ff86911c800ee2de0e6eb81365bca9b826f0bc56b1',
   'ig-salt-emp-v3-2026', 'B3S56WWK5R6NSEDML5ARXTDXCVRUXZ67', 1,
   'Employee', 'employee', '/portal/employee/dashboard', 1, 1, 1, ''),

  ('IG-KMP-0001',
   '0a964f672593bd3bd0964d1551588a365593519bd3d9f7bbbd0679347352e816',
   'ig-salt-board-v3-2026', 'FMWCS4OPGN73MK3LFQOCZYFLW555NAWN', 1,
   'Board', 'board', '/portal/board/dashboard', 1, 1, 1, '');

INSERT OR IGNORE INTO ig_cms_pages
  (slug, title, meta_desc, body_html, status, author)
VALUES
  ('home',      'Home — India Gully',
   'India''s premier multi-vertical advisory firm across Real Estate, Retail, Hospitality, Entertainment, Debt & HORECA Solutions.',
   '<h1>Celebrating Desiness</h1>', 'published', 'superadmin@indiagully.com'),
  ('about',     'About Us — India Gully',
   'Learn about India Gully — Vivacious Entertainment and Hospitality Pvt. Ltd., our leadership, history and mission.',
   '<h1>About India Gully</h1>', 'published', 'superadmin@indiagully.com'),
  ('services',  'Advisory Services — India Gully',
   '6 advisory verticals: Real Estate, Hospitality, Retail, Entertainment, Debt & HORECA.',
   '<h1>Our Services</h1>', 'published', 'superadmin@indiagully.com'),
  ('listings',  'Active Mandates — India Gully',
   '8 active advisory mandates across hospitality, real estate and mixed-use.',
   '<h1>Active Mandates</h1>', 'published', 'superadmin@indiagully.com'),
  ('contact',   'Contact Us — India Gully',
   'Get in touch with India Gully advisory team.',
   '<h1>Contact Us</h1>', 'published', 'superadmin@indiagully.com'),
  ('invest',    'Investor Relations — India Gully',
   '₹1,165 Cr+ pipeline. Partner with India Gully for real estate and hospitality investments.',
   '<h1>Investor Relations</h1>', 'published', 'superadmin@indiagully.com');

-- ── Seed: ig_clients ──────────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_clients (company_name, contact_name, email, phone, sector, status, source)
VALUES
  ('Maple Resorts Pvt. Ltd.',  'Vikram Anand',  'vikram@mapleresorts.com',  '+91 98765 43210', 'Hospitality', 'Active',   'Referral'),
  ('Heritage Hotels Group',    'Priya Sharma',  'priya@heritagehotels.in',  '+91 87654 32109', 'Hospitality', 'Active',   'Website'),
  ('Nexus Retail Solutions',   'Amit Gupta',    'amit@nexusretail.com',     '+91 76543 21098', 'Retail',      'Prospect', 'Cold Outreach'),
  ('Delhi NCR Developers',     'Sunita Mehta',  'sunita@delhincr.com',      '+91 65432 10987', 'Real Estate', 'Active',   'Partner'),
  ('Cloud Kitchen Ventures',   'Rahul Bose',    'rahul@ckv.in',             '+91 54321 09876', 'HORECA',      'Active',   'Website'),
  ('EY India LLP',             'Kapil Verma',   'kapil@ey.com',             '+91 98108 89134', 'Advisory',    'Active',   'Partnership');

-- ── Seed: ig_enquiries ────────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_enquiries
  (ref_number, enquiry_type, name, email, phone, organisation, message, vertical, scale, status, source)
VALUES
  ('IG-ENQ-2026001','EOI',     'Vikram Anand',  'vikram@mapleresorts.com', '+91 98765 43210', 'Maple Resorts', 'Interested in Kasauli Heritage Hotel mandate — 47 keys, ₹85 Cr',   'Hospitality','₹50–100 Cr','Active',  'Website'),
  ('IG-ENQ-2026002','NDA',     'Priya Sharma',  'priya@heritagehotels.in', '+91 87654 32109', 'Heritage Hotels','NDA required for Shimla Hills Resort Development',                 'Hospitality','₹100+ Cr', 'Active',  'Referral'),
  ('IG-ENQ-2026003','General', 'Amit Gupta',    'amit@nexusretail.com',    '+91 76543 21098', 'Nexus Retail',  'Advisory for Noida high-street retail leasing 40,000 sqft',         'Retail',     '₹10–25 Cr','Pending', 'Website'),
  ('IG-ENQ-2026004','HORECA',  'Rahul Bose',    'rahul@ckv.in',            '+91 54321 09876', 'Cloud Kitchen', 'BOQ for 3 cloud kitchen fitouts in Delhi NCR',                       'HORECA',     '₹1–5 Cr', 'Active',  'Website'),
  ('IG-ENQ-2026005','EOI',     'Sunita Mehta',  'sunita@delhincr.com',     '+91 65432 10987', 'Delhi NCR Dev', 'Interested in Jaipur mixed-use ₹450 Cr mandate',                    'Real Estate','₹100+ Cr', 'Active',  'Partner'),
  ('IG-ENQ-2026006','General', 'Kapil Verma',   'kapil@ey.com',            '+91 98108 89134', 'EY India',      'Co-advisory mandate discussion for hotel transaction',               'Advisory',   '₹100+ Cr', 'Closed',  'Partnership');

-- ── Seed: ig_invoices ─────────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_invoices
  (invoice_number, client_name, client_gstin, amount_gross, gst_rate, amount_gst, amount_net, status, due_date, paid_date)
VALUES
  ('INV-2026-001', 'Maple Resorts Pvt. Ltd.',  '07AABCM1234P1Z1', 211864, 18, 38136, 250000, 'Paid',    '2026-01-31', '2026-01-20'),
  ('INV-2026-002', 'Heritage Hotels Group',    '07AABCH5678P1Z2', 127119, 18, 22881, 150000, 'Overdue', '2026-02-28', NULL),
  ('INV-2026-003', 'Cloud Kitchen Ventures',   '07AABCC9012P1Z3',  72034, 18, 12966,  85000, 'Paid',    '2026-02-28', '2026-02-20'),
  ('INV-2026-004', 'Delhi NCR Developers',     '07AABCD3456P1Z4', 338983, 18, 61017, 400000, 'Sent',    '2026-03-31', NULL),
  ('INV-2026-005', 'EY India LLP',             '07AAACE0470N1ZU', 211864, 18, 38136, 250000, 'Draft',   '2026-04-15', NULL);

-- ── Seed: ig_employees ────────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_employees
  (employee_id, name, email, department, designation, joining_date, ctc_annual, is_active)
VALUES
  ('IG-EMP-0001', 'Arun Manikonda',  'akm@indiagully.com',    'Leadership',      'Managing Director',          '2017-01-01', 4800000, 1),
  ('IG-EMP-0002', 'Pavan Manikonda', 'pavan@indiagully.com',  'Leadership',      'Director — HORECA & Sales',  '2017-01-01', 3600000, 1),
  ('IG-EMP-0003', 'Priya Kapoor',    'priya@indiagully.com',  'Advisory',        'Senior Analyst',             '2021-06-01', 1200000, 1),
  ('IG-EMP-0004', 'Amit Jhingan',    'amit@indiagully.com',   'Finance & Legal', 'Finance Manager',            '2022-03-15', 1800000, 1),
  ('IG-EMP-0005', 'Sunita Sharma',   'sunita@indiagully.com', 'Operations',      'Operations Executive',       '2023-01-10',  720000, 1);

-- ── Seed: ig_vouchers ─────────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_vouchers
  (voucher_type, voucher_number, date, narration, amount, dr_account_code, cr_account_code, reference, fy_year, is_reconciled)
VALUES
  ('Sales',   'SAL-2026-001', '2026-01-15', 'Advisory fee — Maple Resorts Q1 2026',       250000, '1120', '4100', 'INV-2026-001', '2025-26', 1),
  ('Sales',   'SAL-2026-002', '2026-02-01', 'Advisory retainer — Heritage Hotels Feb',     150000, '1120', '4100', 'INV-2026-002', '2025-26', 0),
  ('Sales',   'SAL-2026-003', '2026-02-15', 'HORECA supply — Cloud Kitchen BOQ',            85000, '1120', '4300', 'INV-2026-003', '2025-26', 1),
  ('Sales',   'SAL-2026-004', '2026-03-01', 'Transaction advisory — Delhi NCR Dev',        400000, '1120', '4200', 'INV-2026-004', '2025-26', 0),
  ('Receipt', 'RCP-2026-001', '2026-01-20', 'Payment received against INV-2026-001',       250000, '1110', '1120', 'INV-2026-001', '2025-26', 1),
  ('Receipt', 'RCP-2026-002', '2026-02-20', 'Payment received against INV-2026-003',        85000, '1110', '1120', 'INV-2026-003', '2025-26', 1),
  ('Payment', 'PMT-2026-001', '2026-01-31', 'Office rent — January 2026',                   45000, '5300', '1110', 'RENT-JAN-26',  '2025-26', 1),
  ('Payment', 'PMT-2026-002', '2026-02-05', 'Travel — Delhi-Mumbai-Delhi (Arun)',            18500, '5200', '1110', 'EXP-TRVL-001', '2025-26', 1),
  ('Payment', 'PMT-2026-003', '2026-02-28', 'Office rent — February 2026',                  45000, '5300', '1110', 'RENT-FEB-26',  '2025-26', 1),
  ('Payment', 'PMT-2026-004', '2026-03-05', 'Digital marketing — Google Ads Feb',           25000, '5500', '1110', 'MKT-FEB-26',   '2025-26', 0),
  ('Journal', 'JNL-2026-001', '2026-02-28', 'Accrual — Feb advisory fees receivable',      150000, '1120', '4100', 'ACCR-FEB-26',  '2025-26', 0),
  ('Journal', 'JNL-2026-002', '2026-03-31', 'FY closing — accrued advisory fees Q4',       250000, '1120', '4100', 'ACCR-MAR-26',  '2025-26', 0);

-- ── Seed: ig_board_meetings ───────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_board_meetings
  (meeting_type, meeting_number, meeting_date, meeting_time, venue, mode, agenda_text, status, quorum_required)
VALUES
  ('Board Meeting', 'BM-2026-01', '2026-01-15', '11:00',
   'Registered Office, New Delhi, India', 'Physical',
   '1. Approval of Q3 FY2025-26 Financial Statements
2. Review of active mandates pipeline — ₹1,165 Cr
3. Approval of EY co-advisory engagement letter
4. Any other business with permission of chair',
   'Completed', 2),
  ('Board Meeting', 'BM-2026-02', '2026-02-20', '11:00',
   'Registered Office, New Delhi, India', 'Physical',
   '1. Review of pipeline additions — Jaipur Mixed-Use, Goa Beach Resort
2. Approval of revised HORECA catalogue pricing
3. DPDP compliance update from DPO
4. Any other business',
   'Completed', 2),
  ('Board Meeting', 'BM-2026-03', '2026-03-28', '11:00',
   'Registered Office, New Delhi, India', 'Video Conference',
   '1. Approval of FY2025-26 Audited Financial Statements
2. Director''s Report for FY2025-26
3. Appointment of Statutory Auditor for FY2026-27
4. Approval of investor relations portal launch
5. Any other business',
   'Scheduled', 2);

-- ── Seed: ig_payroll_runs ─────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_payroll_runs
  (month, year, status, total_gross, total_deductions, total_net, fy_year)
VALUES
  (10, 2025, 'Processed', 950000, 142500, 807500, '2025-26'),
  (11, 2025, 'Processed', 950000, 142500, 807500, '2025-26'),
  (12, 2025, 'Processed', 975000, 145000, 830000, '2025-26'),
  (1,  2026, 'Processed', 950000, 142500, 807500, '2025-26'),
  (2,  2026, 'Processed', 950000, 142500, 807500, '2025-26'),
  (3,  2026, 'Draft',     950000, 142500, 807500, '2025-26');

-- ── Seed: ig_resolutions ─────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_resolutions
  (resolution_no, meeting_type, meeting_date, subject, resolution_text, proposed_by, seconded_by, votes_for, votes_against, votes_abstain, status)
VALUES
  ('BR-2026-001', 'Board Meeting', '2026-01-15', 'Approval of Q3 FY2025-26 Financial Statements',
   'RESOLVED THAT the un-audited financial results of the Company for the quarter ended December 31, 2025 as reviewed by the Audit Committee and presented to the Board, be and are hereby approved.',
   'Arun Manikonda', 'Pavan Manikonda', 2, 0, 0, 'Passed'),
  ('BR-2026-002', 'Board Meeting', '2026-01-15', 'EY Co-Advisory Engagement',
   'RESOLVED THAT the Company be and is hereby authorised to enter into a co-advisory engagement with Ernst & Young LLP for the transaction advisory mandate of Heritage Hotels Group, at a co-advisory fee sharing of 60:40.',
   'Arun Manikonda', 'Pavan Manikonda', 2, 0, 0, 'Passed'),
  ('BR-2026-003', 'Board Meeting', '2026-02-20', 'Revised HORECA Catalogue Pricing',
   'RESOLVED THAT the HORECA product catalogue pricing effective April 1, 2026 as presented by the Director — HORECA & Sales be and is hereby approved with a 7% price revision.',
   'Pavan Manikonda', 'Arun Manikonda', 2, 0, 0, 'Passed');

-- ── Verify seed ───────────────────────────────────────────────────────────────
SELECT 'Phase 18 Seed Complete' AS status,
       (SELECT COUNT(*) FROM ig_users)         AS users,
       (SELECT COUNT(*) FROM ig_clients)        AS clients,
       (SELECT COUNT(*) FROM ig_enquiries)      AS enquiries,
       (SELECT COUNT(*) FROM ig_employees)      AS employees,
       (SELECT COUNT(*) FROM ig_invoices)       AS invoices,
       (SELECT COUNT(*) FROM ig_vouchers)       AS vouchers,
       (SELECT COUNT(*) FROM ig_board_meetings) AS board_meetings,
       (SELECT COUNT(*) FROM ig_payroll_runs)   AS payroll_runs,
       (SELECT COUNT(*) FROM ig_resolutions)    AS resolutions,
       (SELECT COUNT(*) FROM ig_cms_pages)      AS cms_pages;
