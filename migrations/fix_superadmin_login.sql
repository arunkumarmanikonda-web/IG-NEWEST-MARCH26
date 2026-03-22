-- ============================================================================
-- Fix: Superadmin Login — Restore TOTP secret + verify flags
-- Root cause: seed_users.sql inserted superadmin with totp_secret='' (empty)
--             verifyTOTPStrict() returns false when totp_secret is empty → login always fails
-- TOTP secret: CG5LSHWCQHZL7TV7CQE6Z3DJIAO2MMBZ  (base32, RFC 6238)
-- Password:    IGAdmin@2026  (PBKDF2-SHA256, salt ig-salt-admin-v3-2026, confirmed)
-- Apply:  npx wrangler d1 execute india-gully-production --remote --file=migrations/fix_superadmin_login.sql
-- ============================================================================

UPDATE ig_users
SET
  totp_secret  = 'CG5LSHWCQHZL7TV7CQE6Z3DJIAO2MMBZ',
  totp_enabled = 1,
  is_active    = 1,
  is_demo      = 0,
  mfa_required = 1,
  updated_at   = CURRENT_TIMESTAMP
WHERE identifier = 'superadmin@indiagully.com';

-- Verify the fix
SELECT
  identifier,
  role,
  is_active,
  is_demo,
  mfa_required,
  totp_enabled,
  CASE WHEN totp_secret != '' AND totp_secret IS NOT NULL THEN 'TOTP_SET' ELSE 'TOTP_EMPTY' END AS totp_status,
  CASE WHEN password_hash != '' AND password_hash IS NOT NULL THEN 'PWD_SET' ELSE 'PWD_EMPTY' END AS password_status
FROM ig_users
WHERE identifier = 'superadmin@indiagully.com';
