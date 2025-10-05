-- Phase 1: Setup AI Infrastructure

-- Add AI feature type enum
CREATE TYPE public.ai_feature_type AS ENUM (
  'quote_title',
  'notes_generator',
  'item_description',
  'email_draft',
  'full_quote_generation',
  'item_recommendations',
  'pricing_optimization',
  'follow_up_suggestions',
  'customer_insights',
  'competitive_analysis'
);

-- Modify usage_tracking table to track AI requests
ALTER TABLE public.usage_tracking
ADD COLUMN IF NOT EXISTS last_ai_request_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ai_features_used JSONB DEFAULT '[]'::jsonb;

-- Create AI usage log table for detailed tracking
CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_type ai_feature_type NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on ai_usage_log
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_usage_log
CREATE POLICY "Users can view their own AI usage log"
ON public.ai_usage_log
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI usage log"
ON public.ai_usage_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user_id ON public.ai_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_created_at ON public.ai_usage_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON public.usage_tracking(user_id);