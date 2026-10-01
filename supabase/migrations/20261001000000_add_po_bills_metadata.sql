-- Add fields for display options and costs to bills and purchase_orders

-- BILLS
ALTER TABLE bills
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS discount_type public.discount_type DEFAULT 'percentage'::public.discount_type,
ADD COLUMN IF NOT EXISTS shipping_charge numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS adjustment numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS adjustment_name varchar(255);

-- PURCHASE ORDERS
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_type public.discount_type DEFAULT 'percentage'::public.discount_type,
ADD COLUMN IF NOT EXISTS shipping_charge numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS adjustment numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS adjustment_name varchar(255);

