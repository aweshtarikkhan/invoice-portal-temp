ALTER TABLE public.items 
  ADD COLUMN IF NOT EXISTS has_expiry boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS expiry_date date;
