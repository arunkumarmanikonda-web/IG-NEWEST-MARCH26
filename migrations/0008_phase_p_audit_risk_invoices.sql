-- Migration 0008: Phase P — Ensure unique constraints and seed Phase P data
-- Ensure ig_invoices has invoice_number index (invoice_number UNIQUE NOT NULL defined in 0001)
-- PATCH: Add actor/module columns to ig_audit_log
ALTER TABLE ig_audit_log ADD COLUMN actor TEXT;
ALTER TABLE ig_audit_log ADD COLUMN module TEXT;


CREATE INDEX IF NOT EXISTS idx_invoices_no ON ig_invoices(invoice_number);

-- Ensure ig_audit_log has id as PK with INSERT OR IGNORE support
CREATE INDEX IF NOT EXISTS idx_audit_module ON ig_audit_log(module);
CREATE INDEX IF NOT EXISTS idx_audit_actor  ON ig_audit_log(actor);
CREATE INDEX IF NOT EXISTS idx_audit_time   ON ig_audit_log(created_at);

-- Ensure ig_risk_registry indexes
CREATE INDEX IF NOT EXISTS idx_risk_score ON ig_risk_registry(risk_score);
CREATE INDEX IF NOT EXISTS idx_risk_sector ON ig_risk_registry(sector);

-- Seed sample risk registry entries if empty
INSERT OR IGNORE INTO ig_risk_registry (id, property_name, sector, value, risk_score, trend, assigned_to, factors_json, recommendations_json, created_at, updated_at)
VALUES
  ('RSK-001', 'GST audit trigger — high transaction volume', 'Regulatory', '0', 12, 'stable', 'CFO',
   '{"probability":"Medium","impact":"High","mitigation":"Monthly GST reconciliation, EY tax advisory engaged"}',
   '["Continue monthly reconciliation","Engage EY for pre-audit review"]',
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('RSK-002', 'Overdue receivable — Demo Client', 'Credit', '180000', 12, 'increasing', 'CEO',
   '{"probability":"High","impact":"Medium","mitigation":"Legal notice issued, 7-day cure period"}',
   '["Issue legal notice","Monitor payment","Escalate to NCLT if unpaid >60d"]',
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('RSK-003', 'Key person dependency — senior advisors', 'Operational', '0', 6, 'stable', 'CHRO',
   '{"probability":"Low","impact":"Medium","mitigation":"Cross-training programme underway"}',
   '["Document institutional knowledge","Build succession plan","Cross-train junior advisors"]',
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed sample audit log entries
INSERT OR IGNORE INTO ig_audit_log (actor, action, module, details, created_at)
VALUES
  ('superadmin', 'Phase P D1 wiring deployed', 'System',
   '{"phase":"P","fixes":9,"build":"passing"}', CURRENT_TIMESTAMP),
  ('superadmin', 'Risk register seeded — 3 entries', 'Risk',
   '{"records":3,"source":"migration_0008"}', CURRENT_TIMESTAMP);
