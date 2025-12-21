-- Migration: Add custom brand colors to company_settings
-- Description: Adds primary_color and accent_color columns to track business branding.

ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS primary_color text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS accent_color text;
