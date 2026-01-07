-- Enable pg_cron extension for scheduled jobs (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create a function to call the edge function for processing follow-ups
CREATE OR REPLACE FUNCTION public.invoke_scheduled_followups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response json;
BEGIN
  -- Call the edge function using http extension
  SELECT content::json INTO response
  FROM http_post(
    current_setting('app.settings.supabase_url') || '/functions/v1/process-scheduled-followups',
    '{}',
    'application/json'
  );
  
  -- Log the response
  RAISE NOTICE 'Scheduled followups processed: %', response;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in scheduled followups: %', SQLERRM;
END;
$$ SET search_path = public;

-- Alternative: Use pg_net for async HTTP calls (recommended for Supabase)
CREATE OR REPLACE FUNCTION public.trigger_scheduled_followups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use pg_net for non-blocking HTTP calls
  PERFORM net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/process-scheduled-followups',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
END;
$$ SET search_path = public;

-- Schedule the job to run every hour
-- Format: minute hour day_of_month month day_of_week
SELECT cron.schedule(
  'process-scheduled-followups',  -- Job name
  '0 * * * *',                    -- Every hour at minute 0
  $$SELECT public.trigger_scheduled_followups()$$
);

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule a job:
-- SELECT cron.unschedule('process-scheduled-followups');

-- Comments
COMMENT ON FUNCTION public.trigger_scheduled_followups() IS 'Triggers the process-scheduled-followups Edge Function on a schedule';
