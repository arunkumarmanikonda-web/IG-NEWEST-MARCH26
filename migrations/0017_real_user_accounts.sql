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

-- Riya Sharma (Sr. Analyst — IG-EMP-0001)
INSERT OR IGNORE INTO ig_users
  (identifier, password_hash, password_salt, totp_secret, totp_enabled,
   role, portal, dashboard_url, is_active, mfa_required, is_demo, totp_demo_pin)
VALUES
  ('riya.sharma@indiagully.com',
   '4c35abafbb488fa51e15f1a746099bfd7d7ec8293ab0a233977e70dae42bfcce',
   'ig-salt-emp-riya-2026',
   'KXXBLMSFAGYVVPJLRCSYYU2YXKFBQK4P', 0,
   'Employee', 'employee', '/portal/employee/dashboard',
   1, 1, 0, '');

-- Arjun Mehta (Associate — IG-EMP-0002)
INSERT OR IGNORE INTO ig_users
  (identifier, password_hash, password_salt, totp_secret, totp_enabled,
   role, portal, dashboard_url, is_active, mfa_required, is_demo, totp_demo_pin)
VALUES
  ('arjun.mehta@indiagully.com',
   'f00f76cb2f14ec6e26b45c23300a38f4daf536ef4e3f1d4beda177ce9546f19c',
   'ig-salt-emp-arjun-2026',
   'TJFZKNKFM2XVQD6V27UF4WRZ6A2XGMUC', 0,
   'Employee', 'employee', '/portal/employee/dashboard',
   1, 1, 0, '');

-- Priya Nair (Manager Operations — IG-EMP-0003)
INSERT OR IGNORE INTO ig_users
  (identifier, password_hash, password_salt, totp_secret, totp_enabled,
   role, portal, dashboard_url, is_active, mfa_required, is_demo, totp_demo_pin)
VALUES
  ('priya.nair@indiagully.com',
   'b961dc06f0b5bcf2473e3cc3e5da475b338b862a06a40dec21740d6287c655d6',
   'ig-salt-emp-priya-2026',
   'U5NSCSZIM2SPOFJ4FUFSOEIUVXMDXOAX', 0,
   'Employee', 'employee', '/portal/employee/dashboard',
   1, 1, 0, '');

-- Vikram Singh (Director Advisory — IG-EMP-0004)
INSERT OR IGNORE INTO ig_users
  (identifier, password_hash, password_salt, totp_secret, totp_enabled,
   role, portal, dashboard_url, is_active, mfa_required, is_demo, totp_demo_pin)
VALUES
  ('vikram.singh@indiagully.com',
   '9e6f7542c174e7ca61cdb6ba5686c17ee67d306668ed4783e3e566e6b97c3cce',
   'ig-salt-emp-vikram-2026',
   'AWHPPL7JBEUQSBHWABDFVVUSBSGDT34S', 0,
   'Employee', 'employee', '/portal/employee/dashboard',
   1, 1, 0, '');

-- Neha Joshi (Analyst — IG-EMP-0005)
INSERT OR IGNORE INTO ig_users
  (identifier, password_hash, password_salt, totp_secret, totp_enabled,
   role, portal, dashboard_url, is_active, mfa_required, is_demo, totp_demo_pin)
VALUES
  ('neha.joshi@indiagully.com',
   '30e7d94acd85b97577b1c51f1fbf46bfb3e3a4a97cc6f9510cb43ad3d1a99bf7',
   'ig-salt-emp-neha-2026',
   'BMU6MPUFDPHFVIAFAKFOO5C46MMCOIRA', 0,
   'Employee', 'employee', '/portal/employee/dashboard',
   1, 1, 0, '');

-- Update seed_users CMS stat to match live KPI (₹2,100 Cr+)
UPDATE ig_cms_content SET value='₹2,100 Cr+' WHERE key='stats.pipeline';

-- Deactivate generic placeholder identifiers (IG-EMP-0001 etc.) in favour of real emails
-- Keep is_active=0 so they can still be referenced in audit logs
UPDATE ig_users SET is_active=0 WHERE identifier IN ('IG-EMP-0001','IG-KMP-0001') AND is_demo=1;

SELECT 'Migration 0017 complete — ' || COUNT(*) || ' real user accounts' as status
FROM ig_users WHERE is_demo=0 AND is_active=1;