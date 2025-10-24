-- Enable realtime on quotes table
ALTER PUBLICATION supabase_realtime ADD TABLE public.quotes;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service can insert notifications
CREATE POLICY "Service can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Index for performance
CREATE INDEX notifications_user_id_idx ON public.notifications(user_id, created_at DESC);