-- Migration 0010: Phase R — compliance signoffs index, reports metadata, CMS approvals
-- Compliance signoffs indexes
CREATE INDEX IF NOT EXISTS idx_signoffs_module ON ig_compliance_signoffs(module);
CREATE INDEX IF NOT EXISTS idx_signoffs_period ON ig_compliance_signoffs(period);

-- CMS approvals reviewer_email index (for review-reminders query)
CREATE INDEX IF NOT EXISTS idx_cms_approvals_status   ON ig_cms_approvals(status);
CREATE INDEX IF NOT EXISTS idx_cms_approvals_reviewer ON ig_cms_approvals(reviewer_email);

-- Audit log composite index for 24h queries
CREATE INDEX IF NOT EXISTS idx_audit_time_module ON ig_audit_log(created_at, module);

-- Documents category index for cms/assets
CREATE INDEX IF NOT EXISTS idx_docs_category ON ig_documents(category);

-- Seed initial compliance signoff record
INSERT OR IGNORE INTO ig_compliance_signoffs (id, module, signed_by, score, reference, created_at)
VALUES
  ('CFO-SEED-2026-01', 'Finance/CFO', 'cfo@indiagully.com', 100, 'CFO-SEED-2026-01', CURRENT_TIMESTAMP),
  ('GOLD-SEED-2026-01', 'Platform/GoldCert', 'superadmin', 100, 'GOLD-CERT-V26-001', CURRENT_TIMESTAMP);
