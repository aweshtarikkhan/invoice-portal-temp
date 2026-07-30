-- Add TDS/TCS support for Invoices, Bills, and Purchase Orders

-- Invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tds_tcs_applicable boolean DEFAULT false;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tds_tcs_type text DEFAULT 'tds';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tds_tcs_rate numeric(5,2) DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tds_tcs_amount numeric(15,2) DEFAULT 0;

-- Bills
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS tds_tcs_applicable boolean DEFAULT false;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS tds_tcs_type text DEFAULT 'tds';
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS tds_tcs_rate numeric(5,2) DEFAULT 0;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS tds_tcs_amount numeric(15,2) DEFAULT 0;

-- Purchase Orders
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS tds_tcs_applicable boolean DEFAULT false;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS tds_tcs_type text DEFAULT 'tds';
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS tds_tcs_rate numeric(5,2) DEFAULT 0;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS tds_tcs_amount numeric(15,2) DEFAULT 0;
