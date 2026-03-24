-- ── Diagnostic: Check user state ───────────────────────────────────────
SELECT identifier, role, is_demo, is_active 
FROM ig_users 
ORDER BY id;
