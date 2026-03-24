-- ============================================================================
-- MASTER FIX: All 8 User Accounts — Correct Passwords + TOTP Secrets
-- Generated: 22 Mar 2026
-- All hashes verified via PBKDF2-SHA256 (100,000 iterations)
-- Run: npx wrangler d1 execute india-gully-production --remote --file=migrations/fix_all_users_final.sql
-- ============================================================================

-- ── 1. Super Admin ────────────────────────────────────────────────────────────
-- Password: India@5327**  | TOTP: CG5LSHWCQHZL7TV7CQE6Z3DJIAO2MMBZ
UPDATE ig_users SET
  password_hash = '531e7f8d58df22dc04f4883380c7def8ea1f7a548938d62065d46cf1c011ec1c',
  password_salt = 'ig-salt-admin-v3-2026',
  totp_secret   = 'CG5LSHWCQHZL7TV7CQE6Z3DJIAO2MMBZ',
  totp_enabled  = 1, is_active = 1, is_demo = 0, mfa_required = 1,
  updated_at    = CURRENT_TIMESTAMP
WHERE identifier = 'superadmin@indiagully.com';

-- ── 2. Arun Manikonda (MD / Board) ───────────────────────────────────────────
-- Password: Arun@IG2026  | TOTP: ZMUGY577GXFLTDG6KXKUT3DWZZXOA4JQ
UPDATE ig_users SET
  password_hash = 'cdd6bc852a717f91b12f69240f31e79a2395c0fc78933c1085a09898f9dbe5ad',
  password_salt = 'ig-salt-board-akm-2026',
  totp_secret   = 'ZMUGY577GXFLTDG6KXKUT3DWZZXOA4JQ',
  totp_enabled  = 1, is_active = 1, is_demo = 0, mfa_required = 1,
  updated_at    = CURRENT_TIMESTAMP
WHERE identifier = 'akm@indiagully.com';

-- ── 3. Pavan Manikonda (ED / Board) ──────────────────────────────────────────
-- Password: Pavan@IG2026  | TOTP: OGLMM2FKY3CI26XF2W6PMUPXMV3EY4DO
UPDATE ig_users SET
  password_hash = '1acec72c5694e8b9422a5dc4f53619e640df99c78d7ea50f265433a888b9c69c',
  password_salt = 'ig-salt-board-pavan-2026',
  totp_secret   = 'OGLMM2FKY3CI26XF2W6PMUPXMV3EY4DO',
  totp_enabled  = 1, is_active = 1, is_demo = 0, mfa_required = 1,
  updated_at    = CURRENT_TIMESTAMP
WHERE identifier = 'pavan@indiagully.com';

-- ── 4. Amit Jhingan (President / Board) ──────────────────────────────────────
-- Password: Amit@IG2026  | TOTP: BI6OWJWK2F5B3C6MZW2UJJOFAV7M3GSR
UPDATE ig_users SET
  password_hash = '93a39866cc13631cdc12d38c762869938bfcee2a649250c4952bce79ebebd836',
  password_salt = 'ig-salt-board-amit-2026',
  totp_secret   = 'BI6OWJWK2F5B3C6MZW2UJJOFAV7M3GSR',
  totp_enabled  = 1, is_active = 1, is_demo = 0, mfa_required = 1,
  updated_at    = CURRENT_TIMESTAMP
WHERE identifier = 'amit.jhingan@indiagully.com';

-- ── 5. Atul Rana (Head Sales / Employee) ─────────────────────────────────────
-- Password: Atul@IG2026#  | TOTP: GX6QF2VEKJVQ6LYN7ZTV3SNHBUHPPQQU
UPDATE ig_users SET
  password_hash = 'f1868b84e10fb9ba07c183969b669591a82e97f55927cc1ef7fbf8d7bb1d8066',
  password_salt = 'ig-salt-emp-atul-2026',
  totp_secret   = 'GX6QF2VEKJVQ6LYN7ZTV3SNHBUHPPQQU',
  totp_enabled  = 1, is_active = 1, is_demo = 0, mfa_required = 1,
  updated_at    = CURRENT_TIMESTAMP
WHERE identifier = 'atul.rana@indiagully.com';

-- ── 6. HR Manager ─────────────────────────────────────────────────────────────
-- Password: HR@IG2026#  | TOTP: 6CYKXRA3K7ENLOPSY5S25FECVXX3BT3Z
INSERT OR REPLACE INTO ig_users
  (identifier, password_hash, password_salt, totp_secret, totp_enabled,
   role, portal, dashboard_url, is_active, mfa_required, is_demo, totp_demo_pin)
VALUES
  ('hr@indiagully.com',
   'b00b260813234b492e7d553c6baf9db49dff4cf30e3260cfb1d841ae1331508f',
   'ig-salt-hr-2026',
   '6CYKXRA3K7ENLOPSY5S25FECVXX3BT3Z', 1,
   'Employee', 'employee', '/admin/hr',
   1, 1, 0, '');

-- ── 7. Finance CFO ────────────────────────────────────────────────────────────
-- Password: Finance@IG2026#  | TOTP: INRLENYXGKG66B4G7PVWZFG7NQLRJHUD
INSERT OR REPLACE INTO ig_users
  (identifier, password_hash, password_salt, totp_secret, totp_enabled,
   role, portal, dashboard_url, is_active, mfa_required, is_demo, totp_demo_pin)
VALUES
  ('finance@indiagully.com',
   'bea826a65411a726a511dfe3e9cc22f230e71854a74d923b8967724f98eedad7',
   'ig-salt-finance-2026',
   'INRLENYXGKG66B4G7PVWZFG7NQLRJHUD', 1,
   'Employee', 'employee', '/admin/finance',
   1, 1, 0, '');

-- ── 8. Legal CS ───────────────────────────────────────────────────────────────
-- Password: Legal@IG2026#  | TOTP: CK76ZZNXPCGWCQNFQZDK4YTQH3DH2YL5
INSERT OR REPLACE INTO ig_users
  (identifier, password_hash, password_salt, totp_secret, totp_enabled,
   role, portal, dashboard_url, is_active, mfa_required, is_demo, totp_demo_pin)
VALUES
  ('legal@indiagully.com',
   '255f716a8d4c3476776ed5b2971806991ea67083befba1f311ab255270bb70ab',
   'ig-salt-legal-2026',
   'CK76ZZNXPCGWCQNFQZDK4YTQH3DH2YL5', 1,
   'Employee', 'employee', '/admin/governance',
   1, 1, 0, '');

-- ── VERIFY ALL 8 ──────────────────────────────────────────────────────────────
SELECT
  identifier,
  role,
  is_active,
  totp_enabled,
  CASE WHEN totp_secret != '' AND totp_secret IS NOT NULL THEN 'TOTP_OK' ELSE 'MISSING' END AS totp,
  CASE WHEN password_hash != '' AND password_hash IS NOT NULL THEN 'PWD_OK' ELSE 'MISSING' END AS pwd
FROM ig_users
WHERE identifier IN (
  'superadmin@indiagully.com',
  'akm@indiagully.com',
  'pavan@indiagully.com',
  'amit.jhingan@indiagully.com',
  'atul.rana@indiagully.com',
  'hr@indiagully.com',
  'finance@indiagully.com',
  'legal@indiagully.com'
)
ORDER BY id;
