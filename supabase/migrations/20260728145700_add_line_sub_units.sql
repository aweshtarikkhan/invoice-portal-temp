ALTER TABLE public.invoice_lines ADD COLUMN IF NOT EXISTS sub_unit text;
ALTER TABLE public.invoice_lines ADD COLUMN IF NOT EXISTS sub_unit_conversion_rate numeric(15,2);

ALTER TABLE public.bill_lines ADD COLUMN IF NOT EXISTS sub_unit text;
ALTER TABLE public.bill_lines ADD COLUMN IF NOT EXISTS sub_unit_conversion_rate numeric(15,2);

ALTER TABLE public.estimate_lines ADD COLUMN IF NOT EXISTS sub_unit text;
ALTER TABLE public.estimate_lines ADD COLUMN IF NOT EXISTS sub_unit_conversion_rate numeric(15,2);

ALTER TABLE public.purchase_order_lines ADD COLUMN IF NOT EXISTS sub_unit text;
ALTER TABLE public.purchase_order_lines ADD COLUMN IF NOT EXISTS sub_unit_conversion_rate numeric(15,2);

ALTER TABLE public.credit_note_lines ADD COLUMN IF NOT EXISTS sub_unit text;
ALTER TABLE public.credit_note_lines ADD COLUMN IF NOT EXISTS sub_unit_conversion_rate numeric(15,2);
