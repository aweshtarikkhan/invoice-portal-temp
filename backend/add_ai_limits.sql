-- Add AI import tracking columns to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS ai_imports_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_imports_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
