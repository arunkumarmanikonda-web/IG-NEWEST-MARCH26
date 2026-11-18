-- Deferred constraints execute after a security-definer RPC has returned.
-- The narrow integrity check needs its owner's read privilege, never a public table grant.
alter function ig_private.check_mandate_practice() security definer;
revoke all on function ig_private.check_mandate_practice() from public,anon,authenticated;
notify pgrst,'reload schema';
