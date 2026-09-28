-- Migration: Add 6-digit unique account_id starting with 1, address_line, city, state, and pincode to public.profiles

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS account_id VARCHAR(6) UNIQUE,
  ADD COLUMN IF NOT EXISTS address_line TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);

-- Function to generate a unique 6-digit account ID starting with 1 (range 100000 to 199999)
CREATE OR REPLACE FUNCTION public.generate_unique_account_id()
RETURNS VARCHAR(6) AS $$
DECLARE
  v_account_id VARCHAR(6);
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generates 1 followed by 5 random digits (100000 - 199999)
    v_account_id := (100000 + floor(random() * 100000))::VARCHAR(6);
    
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE account_id = v_account_id) INTO v_exists;
    IF NOT v_exists THEN
      RETURN v_account_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Update existing profiles that don't have an account_id
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE account_id IS NULL LOOP
    UPDATE public.profiles SET account_id = public.generate_unique_account_id() WHERE id = r.id;
  END LOOP;
END $$;

-- Update handle_new_user() trigger to automatically assign unique 6-digit account_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_acc_id VARCHAR(6);
BEGIN
  v_acc_id := public.generate_unique_account_id();
  
  INSERT INTO public.profiles (
    user_id, 
    first_name, 
    last_name, 
    phone,
    account_id
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'mobile', ''),
    v_acc_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
