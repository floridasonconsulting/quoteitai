-- Drop existing foreign key constraints that reference auth.users
ALTER TABLE public.items DROP CONSTRAINT IF EXISTS items_user_id_fkey;
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_user_id_fkey;
ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS quotes_user_id_fkey;

-- Add foreign key constraints that reference profiles.user_id instead
ALTER TABLE public.items 
  ADD CONSTRAINT items_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(user_id) 
  ON DELETE CASCADE;

ALTER TABLE public.customers 
  ADD CONSTRAINT customers_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(user_id) 
  ON DELETE CASCADE;

ALTER TABLE public.quotes 
  ADD CONSTRAINT quotes_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(user_id) 
  ON DELETE CASCADE;

-- Ensure we have a trigger to auto-create profiles when users sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();