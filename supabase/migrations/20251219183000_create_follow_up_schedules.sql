-- Create follow_up_schedules table for automated follow-ups
CREATE TABLE IF NOT EXISTS public.follow_up_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  
  -- Schedule configuration
  schedule_type TEXT NOT NULL DEFAULT 'one_time', -- 'one_time', 'recurring'
  frequency_days INTEGER DEFAULT NULL, -- For recurring: days between follow-ups
  max_follow_ups INTEGER DEFAULT 3, -- Maximum number of automated follow-ups
  follow_ups_sent INTEGER DEFAULT 0, -- Counter
  
  -- Timing
  next_send_at TIMESTAMPTZ NOT NULL,
  last_sent_at TIMESTAMPTZ DEFAULT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused', 'completed', 'cancelled'
  
  -- Email content
  subject_template TEXT DEFAULT NULL, -- Optional custom subject
  message_template TEXT DEFAULT NULL, -- Optional custom message
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient querying of pending follow-ups
CREATE INDEX IF NOT EXISTS idx_follow_up_schedules_pending 
  ON public.follow_up_schedules(next_send_at, status) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_follow_up_schedules_user 
  ON public.follow_up_schedules(user_id);

CREATE INDEX IF NOT EXISTS idx_follow_up_schedules_quote 
  ON public.follow_up_schedules(quote_id);

-- RLS Policies
ALTER TABLE public.follow_up_schedules ENABLE ROW LEVEL SECURITY;

-- Users can only see their own schedules
CREATE POLICY "Users can view own follow-up schedules"
  ON public.follow_up_schedules FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own schedules
CREATE POLICY "Users can create own follow-up schedules"
  ON public.follow_up_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own schedules
CREATE POLICY "Users can update own follow-up schedules"
  ON public.follow_up_schedules FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own schedules
CREATE POLICY "Users can delete own follow-up schedules"
  ON public.follow_up_schedules FOR DELETE
  USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE public.follow_up_schedules IS 'Automated follow-up email schedules for quotes';
COMMENT ON COLUMN public.follow_up_schedules.schedule_type IS 'one_time = single future email, recurring = repeat every X days';
COMMENT ON COLUMN public.follow_up_schedules.status IS 'active = will send, paused = temporarily stopped, completed = all done, cancelled = user stopped';
