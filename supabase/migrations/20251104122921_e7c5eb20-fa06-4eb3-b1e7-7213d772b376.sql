-- Add contact person fields to customers table
ALTER TABLE public.customers
ADD COLUMN contact_first_name TEXT,
ADD COLUMN contact_last_name TEXT;

-- Add a comment explaining the distinction
COMMENT ON COLUMN public.customers.name IS 'Business or company name';
COMMENT ON COLUMN public.customers.contact_first_name IS 'Contact person first name';
COMMENT ON COLUMN public.customers.contact_last_name IS 'Contact person last name';