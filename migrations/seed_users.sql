-- ============================================================================
-- India Gully Enterprise Platform — Phase 18B Seed
-- Seeds ig_users with the same PBKDF2 hashes used in USER_STORE (api.tsx)
-- Seeds ig_cms_content with default site content
-- Seeds ig_enquiries, ig_clients, ig_employees stubs for ERP demo
-- ============================================================================

-- ── Users (matching USER_STORE in api.tsx) ────────────────────────────────────
INSERT OR IGNORE INTO ig_users
  (identifier, password_hash, password_salt, totp_secret, totp_enabled,
   role, portal, dashboard_url, is_active, mfa_required, is_demo, totp_demo_pin)
VALUES
  -- Super Admin: IGAdmin@2026 / TOTP: JBSWY3DPEHPK3PXP / PIN: 123456
  ('superadmin@indiagully.com',
   '03620224810d84bfe71510f8cc0dea92da229208246b1916235ed0e0d1c9d035',
   'ig-salt-admin-v3-2026',
   'JBSWY3DPEHPK3PXP', 1,
   'Super Admin', 'admin', '/admin/dashboard',
   1, 1, 1, '123456'),

  -- Demo Client: IGDemo@2026 / TOTP: JBSWY3DPEHPK3PXQ / PIN: 123456
  ('demo@indiagully.com',
   '4b785ef73842a2a8dd83285291f6d70b556667314f64bb4219c507770f92a2ce',
   'ig-salt-client-v3-2026',
   'JBSWY3DPEHPK3PXQ', 1,
   'Client', 'client', '/portal/client/dashboard',
   1, 1, 1, '123456'),

  -- Demo Employee: IGEmp@2026 / TOTP: JBSWY3DPEHPK3PXR / PIN: 123456
  ('IG-EMP-0001',
   '2327d437979646c3a1dd2535776f7b2998528832264450ce3a82ce1c335b59d4',
   'ig-salt-emp-v3-2026',
   'JBSWY3DPEHPK3PXR', 1,
   'Employee', 'employee', '/portal/employee/dashboard',
   1, 1, 1, '123456'),

  -- Demo Board/KMP: IGBoard@2026 / TOTP: JBSWY3DPEHPK3PXS / PIN: 123456
  ('IG-KMP-0001',
   'd436a3bf72ea09c74d7f778ecbc32fcd0c54db0d2cd2c3ecc352c1cb994be876',
   'ig-salt-board-v3-2026',
   'JBSWY3DPEHPK3PXS', 1,
   'Board', 'board', '/portal/board/dashboard',
   1, 1, 1, '123456');

-- ── CMS Content defaults ──────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_cms_content (key, value, content_type, page, section, is_published, version)
VALUES
  -- Home hero
  ('hero.tagline',    'Celebrating Desiness Across Every Vertical', 'text', 'home', 'hero', 1, 1),
  ('hero.subtitle',   'India''s premier multi-vertical advisory firm across Real Estate, Retail, Hospitality, Entertainment, Debt & HORECA Solutions.', 'text', 'home', 'hero', 1, 1),
  ('hero.cta_primary',   'View Active Mandates',  'text', 'home', 'hero', 1, 1),
  ('hero.cta_secondary', 'Submit an Enquiry',     'text', 'home', 'hero', 1, 1),
  -- Home stats
  ('stats.pipeline',  '₹1,165 Cr+',  'text', 'home', 'stats', 1, 1),
  ('stats.brands',    '20+',          'text', 'home', 'stats', 1, 1),
  ('stats.hotels',    '15+',          'text', 'home', 'stats', 1, 1),
  ('stats.presence',  'Pan-India',    'text', 'home', 'stats', 1, 1),
  ('stats.transacted','₹2,000 Cr+',  'text', 'home', 'stats', 1, 1),
  -- About
  ('about.tagline',   'Celebrating Desiness Since 2017', 'text', 'about', 'hero', 1, 1),
  ('about.blurb',     'India Gully — Vivacious Entertainment and Hospitality Pvt. Ltd. is a multi-vertical advisory firm specialising in Real Estate, Hospitality, Retail, Entertainment and HORECA Solutions.', 'text', 'about', 'hero', 1, 1),
  -- Footer
  ('footer.copyright','© 2026 Vivacious Entertainment and Hospitality Pvt. Ltd. | CIN: U74999DL2017PTC323237', 'text', 'global', 'footer', 1, 1),
  ('footer.tagline',  'Celebrating Desiness — Pan India Advisory across 5 Verticals', 'text', 'global', 'footer', 1, 1),
  -- Contact
  ('contact.phone',   '+91 8988 988 988',     'text', 'contact', 'details', 1, 1),
  ('contact.email',   'info@indiagully.com',  'text', 'contact', 'details', 1, 1),
  ('contact.address', 'New Delhi, India',     'text', 'contact', 'details', 1, 1),
  -- SEO
  ('seo.home.title',        'India Gully — Celebrating Desiness',  'text', 'home',    'seo', 1, 1),
  ('seo.home.description',  'India''s premier multi-vertical advisory firm.',           'text', 'home',    'seo', 1, 1),
  ('seo.about.title',       'About Us — India Gully',               'text', 'about',   'seo', 1, 1),
  ('seo.listings.title',    'Active Mandates — India Gully',        'text', 'listings','seo', 1, 1),
  ('seo.insights.title',    'Insights — India Gully Research',      'text', 'insights','seo', 1, 1),
  ('seo.contact.title',     'Contact Us — India Gully',             'text', 'contact', 'seo', 1, 1);

-- ── Demo Clients ──────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_clients
  (company_name, contact_name, email, phone, sector, status, source)
VALUES
  ('Maple Resorts Pvt. Ltd.',     'Vikram Anand',    'vikram@mapleresorts.com', '+91 98765 43210', 'Hospitality', 'Active',   'Referral'),
  ('Heritage Hotels Group',       'Priya Sharma',    'priya@heritagehotels.in', '+91 87654 32109', 'Hospitality', 'Active',   'Website'),
  ('Nexus Retail Solutions',      'Amit Gupta',      'amit@nexusretail.com',    '+91 76543 21098', 'Retail',      'Prospect', 'Cold Outreach'),
  ('Delhi NCR Developers',        'Sunita Mehta',    'sunita@delhincr.com',     '+91 65432 10987', 'Real Estate', 'Active',   'Partner Referral'),
  ('Cloud Kitchen Ventures',      'Rahul Bose',      'rahul@ckv.in',            '+91 54321 09876', 'HORECA',      'Active',   'Website'),
  ('EY India LLP (Co-Advisory)',  'Kapil Verma',     'kapil@ey.com',            '+91 98108 89134', 'Advisory',    'Active',   'Partnership');

-- ── Demo Employees ────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_employees
  (employee_code, first_name, last_name, email_official, email_personal,
   phone_official, department, designation, date_of_joining,
   ctc_annual, status, employment_type)
VALUES
  ('IG-EMP-0001', 'Arun',   'Manikonda', 'akm@indiagully.com',   'arun.personal@gmail.com',
   '+91 98108 89134', 'Leadership',     'Managing Director',           '2017-01-01', 4800000, 'Active', 'Full-Time'),
  ('IG-EMP-0002', 'Pavan',  'Manikonda', 'pavan@indiagully.com', 'pavan.personal@gmail.com',
   '+91 99999 88888', 'Leadership',     'Director — HORECA & Sales',   '2017-01-01', 3600000, 'Active', 'Full-Time'),
  ('IG-EMP-0003', 'Priya',  'Kapoor',    'priya@indiagully.com', 'priya.k@gmail.com',
   '+91 98765 12345', 'Advisory',       'Senior Analyst',              '2021-06-01', 1200000, 'Active', 'Full-Time'),
  ('IG-EMP-0004', 'Amit',   'Jhingan',   'amit@indiagully.com',  'amit.j@gmail.com',
   '+91 87654 23456', 'Finance & Legal','Finance Manager',             '2022-03-15', 1800000, 'Active', 'Full-Time'),
  ('IG-EMP-0005', 'Sunita', 'Sharma',    'sunita@indiagully.com','sunita.s@gmail.com',
   '+91 76543 34567', 'Operations',     'Operations Executive',        '2023-01-10',  720000, 'Active', 'Full-Time');

-- ── Demo Enquiries ────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_enquiries
  (ref_number, enquiry_type, name, email, phone, organisation, message,
   vertical, scale, status, source)
VALUES
  ('IG-ENQ-2026001', 'EOI',     'Vikram Anand',   'vikram@mapleresorts.com', '+91 98765 43210', 'Maple Resorts',      'Interested in Kasauli Heritage Hotel mandate — 47 keys, ₹85 Cr',    'Hospitality', '₹50–100 Cr', 'Active',   'Website'),
  ('IG-ENQ-2026002', 'NDA',     'Priya Sharma',   'priya@heritagehotels.in', '+91 87654 32109', 'Heritage Hotels',    'Require NDA for Resort development project Shimla Hills',            'Hospitality', '₹100+ Cr',  'Active',   'Referral'),
  ('IG-ENQ-2026003', 'General', 'Amit Gupta',     'amit@nexusretail.com',    '+91 76543 21098', 'Nexus Retail',       'Advisory for Noida high street retail leasing 40,000 sqft',         'Retail',      '₹10–25 Cr', 'Pending',  'Website'),
  ('IG-ENQ-2026004', 'HORECA',  'Rahul Bose',     'rahul@ckv.in',            '+91 54321 09876', 'Cloud Kitchen',      'BOQ for 3 cloud kitchen fitouts in Delhi NCR',                       'HORECA',      '₹1–5 Cr',   'Active',   'Website'),
  ('IG-ENQ-2026005', 'EOI',     'Sunita Mehta',   'sunita@delhincr.com',     '+91 65432 10987', 'Delhi NCR Dev',      'Interested in Jaipur mixed-use ₹450 Cr mandate',                    'Real Estate', '₹100+ Cr',  'Active',   'Partner'),
  ('IG-ENQ-2026006', 'General', 'Kapil Verma',    'kapil@ey.com',            '+91 98108 89134', 'EY India',           'Co-advisory mandate discussion for hotel transaction',               'Advisory',    '₹100+ Cr',  'Closed',   'Partnership');

-- ── Demo Finance Vouchers ─────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_vouchers
  (voucher_type, voucher_number, date, narration, amount, dr_account_code,
   cr_account_code, reference, created_by, fy_year, is_reconciled)
VALUES
  ('Sales',    'INV-2026-001', '2026-01-15', 'Advisory fee — Maple Resorts Q1',          250000,  '1120', '4100', 'PO-MAR-001', 1, '2025-26', 1),
  ('Sales',    'INV-2026-002', '2026-02-01', 'Advisory retainer — Heritage Hotels Feb',   150000,  '1120', '4100', 'PO-HER-002', 1, '2025-26', 0),
  ('Sales',    'INV-2026-003', '2026-02-15', 'HORECA supply — Cloud Kitchen BOQ',          85000,  '1120', '4300', 'PO-CKV-003', 2, '2025-26', 1),
  ('Receipt',  'RCP-2026-001', '2026-01-20', 'Payment received — INV-2026-001',           250000,  '1110', '1120', 'INV-2026-001',1,'2025-26', 1),
  ('Payment',  'PMT-2026-001', '2026-01-31', 'Office rent — Jan 2026',                    45000,   '5300', '1110', 'RENT-JAN26',  1, '2025-26', 1),
  ('Payment',  'PMT-2026-002', '2026-02-05', 'Travel — Delhi-Mumbai-Delhi (Arun)',         18500,   '5200', '1110', 'EXP-TRVL-001',1,'2025-26', 1),
  ('Journal',  'JNL-2026-001', '2026-02-28', 'Accrual — Feb advisory fees receivable',   150000,  '1120', '4100', 'ACCR-FEB26',  1, '2025-26', 0);

-- ── Demo Board Meeting ────────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_board_meetings
  (meeting_type, meeting_number, meeting_date, meeting_time, venue, mode,
   agenda_text, status, quorum_required)
VALUES
  ('Board Meeting',     'BM-2026-01', '2026-01-15', '11:00', 'Registered Office, New Delhi', 'Physical',
   '1. Approval of Q3 FY2025-26 Financial Statements\n2. Review of active mandates pipeline\n3. Approval of EY co-advisory engagement letter\n4. Any other business',
   'Completed', 2),
  ('Board Meeting',     'BM-2026-02', '2026-03-28', '11:00', 'Registered Office, New Delhi', 'Video Conference',
   '1. Approval of FY2025-26 Audited Financial Statements\n2. Director''s Report for FY2025-26\n3. Appointment of Statutory Auditor\n4. Any other business',
   'Scheduled', 2);

-- ── Demo Payroll Run ──────────────────────────────────────────────────────────
INSERT OR IGNORE INTO ig_payroll_runs
  (month, year, status, run_by, total_gross, total_deductions, total_net, fy_year)
VALUES
  (1,  2026, 'Processed', 1, 950000, 142500, 807500, '2025-26'),
  (2,  2026, 'Processed', 1, 950000, 142500, 807500, '2025-26'),
  (3,  2026, 'Draft',     1, 950000, 142500, 807500, '2025-26');

-- ── Done ──────────────────────────────────────────────────────────────────────
SELECT 'Seed complete' AS status,
       (SELECT COUNT(*) FROM ig_users)     AS users,
       (SELECT COUNT(*) FROM ig_cms_content) AS cms_rows,
       (SELECT COUNT(*) FROM ig_clients)   AS clients,
       (SELECT COUNT(*) FROM ig_employees) AS employees,
       (SELECT COUNT(*) FROM ig_enquiries) AS enquiries,
       (SELECT COUNT(*) FROM ig_vouchers)  AS vouchers;
