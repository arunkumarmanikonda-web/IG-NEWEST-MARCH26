-- ============================================================================
-- Fix: Superadmin Login — Sync D1 with USER_STORE credentials
-- 
-- Root cause: Multiple issues combined to break login:
-- 1. seed_users.sql inserted superadmin with totp_secret='' → TOTP always fails
-- 2. D1 row has OLD password hash (IGAdmin@2026) while USER_STORE was updated 
--    to NEW password (IGAdmin@Test2026!) during security hardening (commit 4b51e62)
--    but D1 was never updated (INSERT OR IGNORE skips existing rows)
-- 
-- This script syncs D1 to match the current USER_STORE credentials exactly.
--
-- CREDENTIALS AFTER THIS FIX:
--   URL:      https://india-gully.pages.dev/admin
--   Email:    superadmin@indiagully.com
--   Password: IGAdmin@Test2026!
--   TOTP:     CG5LSHWCQHZL7TV7CQE6Z3DJIAO2MMBZ  (add to Google Authenticator)
--
-- Apply: npx wrangler d1 execute india-gully-production --remote --file=migrations/fix_superadmin_login.sql
-- ============================================================================

UPDATE ig_users
SET
  password_hash = '0710e299d5de37a3aab1ac14b07b0ba9897d6050f2d8d6c081b5f0939e9b7e4e',
  password_salt = 'ig-salt-admin-v3-2026',
  totp_secret   = 'CG5LSHWCQHZL7TV7CQE6Z3DJIAO2MMBZ',
  totp_enabled  = 1,
  is_active     = 1,
  is_demo       = 0,
  mfa_required  = 1,
  updated_at    = CURRENT_TIMESTAMP
WHERE identifier = 'superadmin@indiagully.com';

-- Verify
SELECT
  identifier, role, is_active, is_demo, mfa_required, totp_enabled,
  CASE WHEN totp_secret != '' AND totp_secret IS NOT NULL THEN 'TOTP_OK' ELSE 'TOTP_MISSING' END AS totp_status,
  CASE WHEN password_hash = '0710e299d5de37a3aab1ac14b07b0ba9897d6050f2d8d6c081b5f0939e9b7e4e' THEN 'PWD_SYNCED' ELSE 'PWD_MISMATCH' END AS pwd_status
FROM ig_users
WHERE identifier = 'superadmin@indiagully.com';
