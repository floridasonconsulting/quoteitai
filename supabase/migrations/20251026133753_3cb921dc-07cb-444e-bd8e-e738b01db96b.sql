-- Add email notification preferences to company_settings
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS notify_email_accepted BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_email_declined BOOLEAN DEFAULT true;

-- Add tracking columns to notifications table (optional but useful)
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE;