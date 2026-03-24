-- ============================================================================
-- Fix Script: Correct superadmin flags (run if superadmin missing from dashboard)
-- ============================================================================
UPDATE ig_users 
SET is_demo = 0, is_active = 1 
WHERE identifier = 'superadmin@indiagully.com';

-- Verify
SELECT identifier, role, is_demo, is_active 
FROM ig_users 
WHERE identifier = 'superadmin@indiagully.com';
