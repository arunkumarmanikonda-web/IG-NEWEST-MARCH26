-- Migration 0010: Phase R — compliance signoffs index, reports metadata, CMS approvals
-- Compliance signoffs indexes
CREATE INDEX IF NOT EXISTS idx_signoffs_module ON ig_compliance_signoffs(module);
-- idx_signoffs_period removed: period column not in ig_compliance_signoffs
-- CMS approvals reviewer_email index (for review-reminders query)
CREATE INDEX IF NOT EXISTS idx_cms_approvals_status   ON ig_cms_approvals(status);
-- idx_cms_approvals_reviewer removed: reviewer_email column not in ig_cms_approvals
-- Audit log composite index for 24h queries
CREATE INDEX IF NOT EXISTS idx_audit_time_module ON ig_audit_log(created_at, module);

-- Documents category index for cms/assets
CREATE INDEX IF NOT EXISTS idx_docs_category ON ig_documents(category);

-- Seed initial compliance signoff record
INSERT OR IGNORE INTO ig_compliance_signoffs (module, signed_by, score, recorded_at)
VALUES
  ('Finance/CFO', 'cfo@indiagully.com', 100, CURRENT_TIMESTAMP),
  ('Platform/GoldCert', 'superadmin', 100, CURRENT_TIMESTAMP);
