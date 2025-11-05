-- Add executive_summary column to quotes table
ALTER TABLE public.quotes
ADD COLUMN executive_summary TEXT;