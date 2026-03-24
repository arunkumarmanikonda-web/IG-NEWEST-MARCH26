-- ============================================================================
-- Migration 0017: Real User Accounts (Directors, KMPs, Employees)
-- Apply: npx wrangler d1 execute india-gully-production --file=this.sql
-- ============================================================================

-- Arun Manikonda (Managing Director)
INSERT OR IGNORE INTO ig_users
  (identifier, password_hash, password_salt, totp_secret, totp_enabled,
   role, portal, dashboard_url, is_active, mfa_required, is_demo, totp_demo_pin)
VALUES
  ('akm@indiagully.com',
   'cdd6bc852a717f91b12f69240f31e79a2395c0fc78933c1085a09898f9dbe5ad',
   'ig-salt-board-akm-2026',
   '4Q54XPCBOQVYNMT2PG2ONFEF2GPVECRU', 0,
   'Board', 'board', '/portal/board/dashboard',
   1, 1, 0, '');

-- Pavan Manikonda (Executive Director)
INSERT OR IGNORE INTO ig_users
  (identifier, password_hash, password_salt, totp_secret, totp_enabled,
   role, portal, dashboard_url, is_active, mfa_required, is_demo, totp_demo_pin)
VALUES
  ('pavan@indiagully.com',
   '1acec72c5694e8b9422a5dc4f53619e640df99c78d7ea50f265433a888b9c69c',
   'ig-salt-board-pavan-2026',
   '3IC6XPOQAV4BU5JQVXGS766S2QVXKGDO', 0,
   'Board', 'board', '/portal/board/dashboard',
   1, 1, 0, '');

-- Amit Jhingan (President — Real Estate / KMP)
INSERT OR IGNORE INTO ig_users
  (identifier, password_hash, password_salt, totp_secret, totp_enabled,
   role, portal, dashboard_url, is_active, mfa_required, is_demo, totp_demo_pin)
VALUES
  ('amit.jhingan@indiagully.com',
   '93a39866cc13631cdc12d38c762869938bfcee2a649250c4952bce79ebebd836',
   'ig-salt-board-amit-2026',
   'YW3DZJZTMUKGDDT3QCR6S2JJKZHWYYTO', 0,
   'Board', 'board', '/portal/board/dashboard',
   1, 1, 0, '');






-- Atul Rana (Head Sales - Entertainment Business — IG-EMP-0001)
INSERT OR IGNORE INTO ig_users
  (identifier, password_hash, password_salt, totp_secret, totp_enabled,
   role, portal, dashboard_url, is_active, mfa_required, is_demo, totp_demo_pin)
VALUES
  ('atul.rana@indiagully.com',
   'f807bec8e89aedf0ee9cdf5210b493a07c688008a9e2edae3ec55ccc47870b57',
   'ig-salt-emp-atul-2026',
   'GX6QF2VEKJVQ6LYN7ZTV3SNHBUHPPQQU', 0,
   'Employee', 'employee', '/portal/employee/dashboard',
   1, 1, 0, '');

-- Create ig_cms_content if not exists (may be created later in seed_users.sql too)
CREATE TABLE IF NOT EXISTS ig_cms_content (
  id           INTEGER  PRIMARY KEY AUTOINCREMENT,
  key          TEXT     UNIQUE NOT NULL,
  value        TEXT     NOT NULL DEFAULT '',
  content_type TEXT     NOT NULL DEFAULT 'text',
  page         TEXT,
  section      TEXT,
  is_published INTEGER  NOT NULL DEFAULT 1,
  version      INTEGER  NOT NULL DEFAULT 1,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- Update or insert CMS stat
INSERT OR REPLACE INTO ig_cms_content (key, value, content_type, is_published, version)
VALUES ('stats.pipeline', '₹2,100 Cr+', 'text', 1, 1);

-- Deactivate generic placeholder identifiers (IG-EMP-0001 etc.) in favour of real emails
-- Keep is_active=0 so they can still be referenced in audit logs
UPDATE ig_users SET is_active=0 WHERE identifier IN ('IG-EMP-0001','IG-KMP-0001') AND is_demo=1;

SELECT 'Migration 0017 complete — ' || COUNT(*) || ' real user accounts' as status
FROM ig_users WHERE is_demo=0 AND is_active=1;