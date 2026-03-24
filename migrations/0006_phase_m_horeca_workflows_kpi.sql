-- ============================================================
-- PHASE M MIGRATION: HORECA, Workflows, KPI, Risk, Settings
-- ============================================================

-- HORECA: Vendors
-- PATCH: Add new KPI columns introduced in Phase M (safe to ignore if already exist)
ALTER TABLE ig_kpi_records ADD COLUMN department TEXT;
ALTER TABLE ig_kpi_records ADD COLUMN metric_name TEXT;
ALTER TABLE ig_kpi_records ADD COLUMN target_label TEXT;
ALTER TABLE ig_kpi_records ADD COLUMN actual_label TEXT;
ALTER TABLE ig_kpi_records ADD COLUMN pct_complete REAL DEFAULT 0;
ALTER TABLE ig_kpi_records ADD COLUMN period TEXT;
ALTER TABLE ig_kpi_records ADD COLUMN target_value REAL;
ALTER TABLE ig_kpi_records ADD COLUMN actual_value REAL;
ALTER TABLE ig_kpi_records ADD COLUMN unit TEXT;


CREATE TABLE IF NOT EXISTS ig_horeca_vendors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  gstin TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  payment_terms TEXT DEFAULT 'Net 30',
  tier TEXT DEFAULT 'Bronze',
  rating REAL DEFAULT 0,
  lead_time_days INTEGER DEFAULT 7,
  kyc_verified INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_horeca_vendors_status ON ig_horeca_vendors(status);
CREATE INDEX IF NOT EXISTS idx_horeca_vendors_category ON ig_horeca_vendors(category);

-- HORECA: Products/SKUs
CREATE TABLE IF NOT EXISTS ig_horeca_products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  unit TEXT DEFAULT 'Piece',
  price REAL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 0,
  hsn_code TEXT,
  gst_rate REAL DEFAULT 18,
  brand TEXT,
  image_url TEXT,
  active INTEGER DEFAULT 1,
  featured INTEGER DEFAULT 0,
  warehouse TEXT DEFAULT 'Delhi Warehouse',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_horeca_products_sku ON ig_horeca_products(sku);
CREATE INDEX IF NOT EXISTS idx_horeca_products_category ON ig_horeca_products(category);

-- HORECA: Purchase Orders
CREATE TABLE IF NOT EXISTS ig_horeca_purchase_orders (
  id TEXT PRIMARY KEY,
  vendor_id TEXT,
  vendor_name TEXT,
  items_json TEXT,
  value REAL DEFAULT 0,
  gst REAL DEFAULT 0,
  total REAL DEFAULT 0,
  status TEXT DEFAULT 'Pending',
  approved_by TEXT,
  billing_address TEXT,
  delivery_address TEXT,
  expected_delivery DATE,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- HORECA: Quotes
CREATE TABLE IF NOT EXISTS ig_horeca_quotes (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  items_json TEXT,
  subtotal REAL DEFAULT 0,
  gst REAL DEFAULT 0,
  total REAL DEFAULT 0,
  status TEXT DEFAULT 'Draft',
  valid_until DATE,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- HORECA: Orders (Customer orders)
CREATE TABLE IF NOT EXISTS ig_horeca_orders (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  po_ref TEXT,
  items_json TEXT,
  value REAL DEFAULT 0,
  status TEXT DEFAULT 'Processing',
  shipped_at DATETIME,
  delivered_at DATETIME,
  tracking_number TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- HORECA: Stock Movements
CREATE TABLE IF NOT EXISTS ig_horeca_stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT NOT NULL,
  item_name TEXT,
  from_location TEXT,
  to_location TEXT,
  qty INTEGER DEFAULT 0,
  movement_type TEXT DEFAULT 'Transfer',
  ref_id TEXT,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Workflows
CREATE TABLE IF NOT EXISTS ig_workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  trigger_condition TEXT,
  steps_json TEXT,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ig_workflow_runs (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  workflow_name TEXT,
  status TEXT DEFAULT 'Running',
  started_by TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  duration_minutes INTEGER,
  current_step INTEGER DEFAULT 0,
  steps_json TEXT,
  error_message TEXT,
  FOREIGN KEY (workflow_id) REFERENCES ig_workflows(id)
);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow ON ig_workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON ig_workflow_runs(status);

-- KPI / OKR
CREATE TABLE IF NOT EXISTS ig_kpi_records (
  id TEXT PRIMARY KEY,
  department TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  target_value REAL,
  actual_value REAL,
  target_label TEXT,
  actual_label TEXT,
  unit TEXT,
  period TEXT,
  pct_complete REAL DEFAULT 0,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_kpi_dept ON ig_kpi_records(department);
CREATE INDEX IF NOT EXISTS idx_kpi_period ON ig_kpi_records(period);

CREATE TABLE IF NOT EXISTS ig_okrs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  department TEXT NOT NULL,
  objective TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  owner TEXT,
  color TEXT DEFAULT '#2563eb',
  period TEXT DEFAULT 'FY2025-26',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Risk Registry
CREATE TABLE IF NOT EXISTS ig_risk_registry (
  id TEXT PRIMARY KEY,
  mandate_id TEXT,
  property_name TEXT NOT NULL,
  sector TEXT,
  value TEXT,
  risk_score INTEGER DEFAULT 0,
  trend TEXT DEFAULT 'stable',
  assigned_to TEXT,
  factors_json TEXT,
  recommendations_json TEXT,
  status TEXT DEFAULT 'Active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_risk_mandate ON ig_risk_registry(mandate_id);

-- Platform Settings
CREATE TABLE IF NOT EXISTS ig_platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  category TEXT DEFAULT 'general',
  updated_by TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Compliance Calendar
CREATE TABLE IF NOT EXISTS ig_compliance_calendar (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'Upcoming',
  urgency TEXT DEFAULT 'warn',
  module TEXT,
  notes TEXT,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_compliance_due ON ig_compliance_calendar(due_date);

-- Seed: Workflow library
INSERT OR IGNORE INTO ig_workflows (id, name, category, trigger_condition, active) VALUES
  ('wf0','Invoice Approval','Finance','Invoice amount > ₹50,000 submitted',1),
  ('wf1','Mandate Onboarding','Operations','New client enquiry form submitted',1),
  ('wf2','Leave Approval','HR','Leave application submitted by employee',1),
  ('wf3','Contract Renewal','Legal','Contract expiry within 30 days',0),
  ('wf4','Vendor Onboarding','Finance','New vendor onboarding form submitted',1),
  ('wf5','Board Resolution','Governance','Board meeting scheduled',1);

-- Seed: Default platform settings
INSERT OR IGNORE INTO ig_platform_settings (key, value, category) VALUES
  ('platform_name','India Gully Enterprise Platform','general'),
  ('company_name','Vivacious Entertainment & Hospitality Pvt. Ltd.','legal'),
  ('cin','U74900DL2017PTC000000','legal'),
  ('gstin','07XXXXXX000XXX','tax'),
  ('support_email','info@indiagully.com','contact'),
  ('support_phone','+91 8988 988 988','contact'),
  ('smtp_host','smtp.gmail.com','email'),
  ('smtp_port','587','email'),
  ('smtp_user','info@indiagully.com','email');

-- Seed: KPI OKRs
INSERT OR IGNORE INTO ig_okrs (department, objective, progress, owner, color, period) VALUES
  ('Finance',    'Achieve ₹15 Cr revenue in FY 2025',     82, 'Arun Manikonda', '#2563eb', 'FY2025-26'),
  ('Sales',      'Close ₹25 Cr in new engagements FY25',  70, 'Amit Jhingan',   '#B8960C', 'FY2025-26'),
  ('HR',         'Hire 5 key roles, 0% attrition FY25',   60, 'Pavan Manikonda','#7c3aed', 'FY2025-26'),
  ('Governance', '100% statutory compliance, 4 board mtgs',75, 'Arun Manikonda', '#16a34a', 'FY2025-26'),
  ('HORECA',     '₹2 Cr HORECA revenue, 3 new hotel clients',55,'Amit Jhingan',  '#d97706', 'FY2025-26');

-- Seed: KPI Records
INSERT OR IGNORE INTO ig_kpi_records (department, metric_name, target_label, actual_label, pct_complete, period) VALUES
  ('Finance','Advisory revenue MTD','₹12.4L/mo','₹12.4L',100,'FY2025-26'),
  ('Finance','Invoice collection rate','>90%','87%',87,'FY2025-26'),
  ('Finance','EBITDA margin','>35%','37.1%',100,'FY2025-26'),
  ('Finance','GST compliance — on time','100%','100%',100,'FY2025-26'),
  ('Sales','Pipeline value','₹50 Cr+','₹52.4 Cr',100,'FY2025-26'),
  ('Sales','Lead to proposal rate','>50%','43%',86,'FY2025-26'),
  ('Sales','Proposals won','6 deals','3 deals',50,'FY2025-26'),
  ('HR','Positions filled','5','2',40,'FY2025-26'),
  ('HR','Employee satisfaction NPS','>40','52',100,'FY2025-26'),
  ('Governance','Board meetings held','4/year','2',50,'FY2025-26'),
  ('Governance','ROC filings on time','100%','100%',100,'FY2025-26'),
  ('HORECA','Active hotel clients','3','1',33,'FY2025-26'),
  ('HORECA','HORECA revenue YTD','₹2 Cr','₹85L',43,'FY2025-26');

-- Seed: Compliance calendar
INSERT OR IGNORE INTO ig_compliance_calendar (id, title, due_date, status, urgency, module) VALUES
  ('CC-001','GSTR-1 Filing','2026-03-11','Upcoming','warn','Finance'),
  ('CC-002','Advance Tax Q4','2026-03-15','Upcoming','warn','Finance'),
  ('CC-003','MCA Annual Return (MGT-7)','2026-03-31','Pending','danger','Governance'),
  ('CC-004','ITR-6 Filing Deadline','2026-03-31','Pending','danger','Finance'),
  ('CC-005','TM-006 Trademark Renewal','2026-04-15','Action','danger','Legal'),
  ('CC-006','FSSAI License Renewal','2026-04-30','Action','warn','HORECA'),
  ('CC-007','Annual DPDP Audit','2026-06-30','Scheduled','ok','DPDP'),
  ('CC-008','Companies Act §96 AGM','2026-09-30','Scheduled','ok','Governance');

-- Seed: Risk registry  
INSERT OR IGNORE INTO ig_risk_registry (id, property_name, sector, value, risk_score, trend, assigned_to) VALUES
  ('RSK-001','Hotel Rajshree & Spa — Chandigarh','Hospitality','₹70 Cr',83,'improving','Aarav Shah'),
  ('RSK-002','Retail Leasing — Mumbai MMR','Real Estate','₹2,100 Cr',88,'stable','Priya Sharma'),
  ('RSK-003','Heritage Hotel Portfolio — Rajasthan','Hospitality','₹620 Cr',61,'improving','Amit Jhingan'),
  ('RSK-004','Luxury Resort Rollout — Rajasthan+Goa','Hospitality','₹350 Cr',79,'declining','Rahul Verma'),
  ('RSK-005','Maple Resort — Chail, HP','Hospitality','₹30 Cr',76,'stable','Aarav Shah'),
  ('RSK-006','Desi Brand — Retail Expansion','Retail','₹45 Cr',91,'stable','Priya Sharma');

-- Seed: HORECA vendors
INSERT OR IGNORE INTO ig_horeca_vendors (id, name, category, gstin, tier, rating, status, kyc_verified) VALUES
  ('VEN-001','Premier Kitchen Supplies','Kitchen Equipment','07AABCS1234F1Z5','Gold',4.8,'Active',1),
  ('VEN-002','Hotelware India Ltd.','Crockery & Cutlery','27AABCH5678G1Z3','Silver',4.2,'Active',1),
  ('VEN-003','Royal Linen & Textiles','Linen & Fabrics','09AAACR9012H1Z1','Gold',4.9,'Active',1),
  ('VEN-004','FrontDesk Solutions','Front Office','07AABCF3456I1Z8','Bronze',3.8,'Active',1),
  ('VEN-005','CleanPro Housekeeping','Housekeeping','29AABCC7890J1Z6','Silver',4.1,'Active',1),
  ('VEN-006','Bar & Beverage Co.','Food & Beverage','27AABCB2345K1Z4','—',0,'Pending',0),
  ('VEN-007','Hotel Tech Systems','Technology','07AABCH6789L1Z2','Gold',4.7,'Active',1);

-- Seed: HORECA products
INSERT OR IGNORE INTO ig_horeca_products (id, sku, name, category, unit, price, stock, reorder_level, gst_rate) VALUES
  ('P001','HRC-KE-001','Commercial Convection Oven','Kitchen Equipment','Piece',85000,3,2,18),
  ('P002','HRC-KE-002','Industrial Refrigerator 500L','Kitchen Equipment','Piece',120000,2,1,18),
  ('P003','HRC-CC-001','Bone China Dinner Set (24pc)','Crockery & Cutlery','Set',8500,12,20,12),
  ('P004','HRC-CC-002','Stainless Steel Cutlery Set','Crockery & Cutlery','Set',2200,35,40,12),
  ('P005','HRC-LF-001','Premium Bath Linen (5pc)','Linen & Fabrics','Set',1800,45,30,5),
  ('P006','HRC-LF-002','Queen Bed Sheet Set','Linen & Fabrics','Set',3200,28,25,5),
  ('P007','HRC-HK-001','Industrial Floor Scrubber','Housekeeping','Piece',65000,2,3,18),
  ('P008','HRC-FO-001','Front Desk Software License','Front Office','License',45000,1,1,18);

