-- Migration: Add last_behavioral_followup_at to quotes
-- Description: Tracks the last time a behavioral-triggered follow-up was sent to prevent frequency overload.

ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS last_behavioral_followup_at timestamptz;
