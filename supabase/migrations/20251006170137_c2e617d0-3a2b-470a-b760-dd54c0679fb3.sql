-- Add unique constraint to usage_tracking.user_id
ALTER TABLE public.usage_tracking 
ADD CONSTRAINT usage_tracking_user_id_key UNIQUE (user_id);

-- Create profiles for any existing users who don't have one
INSERT INTO public.profiles (user_id, email)
SELECT id, email 
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.profiles);