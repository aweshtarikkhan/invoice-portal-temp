ALTER TABLE portal_ads ADD COLUMN IF NOT EXISTS duration integer DEFAULT 5;
ALTER TABLE portal_ads ADD COLUMN IF NOT EXISTS is_sponsored boolean DEFAULT false;
