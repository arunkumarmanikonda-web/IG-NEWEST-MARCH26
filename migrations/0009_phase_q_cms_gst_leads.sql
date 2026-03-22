-- Migration 0009: Phase Q — CMS template support, GST filing indexes
-- Add template page_type support to ig_cms_pages
-- PATCH: Add content/page_type columns to ig_cms_pages
ALTER TABLE ig_cms_pages ADD COLUMN content TEXT;
ALTER TABLE ig_cms_pages ADD COLUMN page_type TEXT DEFAULT 'general';


CREATE INDEX IF NOT EXISTS idx_cms_page_type ON ig_cms_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_cms_status    ON ig_cms_pages(status);

-- GST filings form_type index for gstr1/gstr3b queries
-- idx_gst_form_type removed: form_type column not in ig_gst_filings schema
CREATE INDEX IF NOT EXISTS idx_gst_period    ON ig_gst_filings(period);

-- ig_leads source index for valuation enquiries
-- idx_leads_source removed: source column not in ig_leads schema
CREATE INDEX IF NOT EXISTS idx_leads_stage   ON ig_leads(stage);

-- Seed a default CMS template if none exist
INSERT OR IGNORE INTO ig_cms_pages (slug, title, content, page_type, status, created_at, updated_at)
VALUES
  ('template-landing-page', 'Landing Page', '{"blocks":6,"template_type":"Page"}', 'template', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('template-advisory-service', 'Advisory Service', '{"blocks":4,"template_type":"Service"}', 'template', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('template-mandate-showcase', 'Mandate Showcase', '{"blocks":5,"template_type":"Mandate"}', 'template', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
