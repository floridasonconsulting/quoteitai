import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailNotificationRequest {
  email: string;
  quoteId: string;
  quoteNumber: string;
  customerName: string;
  status: 'accepted' | 'declined';
  quoteLink: string;
  companyName?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, quoteId, quoteNumber, customerName, status, quoteLink, companyName }: EmailNotificationRequest = await req.json();

    console.log(`Sending ${status} notification for quote ${quoteNumber} to ${email}`);

    // Get Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Prepare email content
    const subject = `Quote #${quoteNumber} has been ${status}`;
    const actionColor = status === 'accepted' ? '#10b981' : '#ef4444';
    const actionText = status === 'accepted' ? 'Accepted' : 'Declined';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e5e5e5;">
                      <h1 style="margin: 0; font-size: 24px; color: #333333;">Quote ${actionText}</h1>
                    </td>
                  </tr>
                  
                  <!-- Status Badge -->
                  <tr>
                    <td style="padding: 30px 40px; text-align: center;">
                      <div style="display: inline-block; background-color: ${actionColor}15; border: 2px solid ${actionColor}; border-radius: 8px; padding: 12px 24px;">
                        <span style="font-size: 18px; font-weight: bold; color: ${actionColor}; text-transform: uppercase;">
                          ${actionText}
                        </span>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 0 40px 30px;">
                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                        Great news! Your quote has been ${status} by the customer.
                      </p>
                      
                      <div style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 8px 0; font-size: 14px; color: #666666;">Quote Number:</td>
                            <td style="padding: 8px 0; font-size: 14px; color: #333333; font-weight: 600; text-align: right;">${quoteNumber}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-size: 14px; color: #666666;">Customer:</td>
                            <td style="padding: 8px 0; font-size: 14px; color: #333333; font-weight: 600; text-align: right;">${customerName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-size: 14px; color: #666666;">Status:</td>
                            <td style="padding: 8px 0; font-size: 14px; font-weight: 600; text-align: right;">
                              <span style="color: ${actionColor};">${actionText}</span>
                            </td>
                          </tr>
                        </table>
                      </div>
                      
                      ${status === 'accepted' ? `
                        <p style="margin: 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                          🎉 Time to contact your customer and discuss the next steps!
                        </p>
                      ` : `
                        <p style="margin: 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                          Don't worry - you can follow up with the customer to understand their concerns.
                        </p>
                      `}
                    </td>
                  </tr>
                  
                  <!-- CTA Button -->
                  <tr>
                    <td style="padding: 0 40px 40px; text-align: center;">
                      <a href="${quoteLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                        View Quote Details
                      </a>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 40px; text-align: center; border-top: 1px solid #e5e5e5; background-color: #f9fafb;">
                      <p style="margin: 0; font-size: 12px; color: #666666;">
                        ${companyName ? `Sent by ${companyName} via ` : 'Sent via '}Quote-it AI
                      </p>
                      <p style="margin: 8px 0 0; font-size: 12px; color: #999999;">
                        This is an automated notification. Please do not reply to this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Get from email address (use environment variable or default)
    const fromEmail = Deno.env.get('FROM_EMAIL_ADDRESS') || 'Quote-it AI <notifications@resend.dev>';
    
    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: subject,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Resend API error:', errorData);
      
      // Check if it's a domain verification error
      if (errorData.includes('validation_error') || errorData.includes('verify a domain')) {
        console.warn('⚠️ Domain not verified with Resend. To send emails to all recipients, verify your domain at https://resend.com/domains');
        throw new Error('Email domain not verified. Emails can only be sent to verified addresses. Please verify your domain at resend.com/domains');
      }
      
      throw new Error(`Failed to send email: ${response.status} ${errorData}`);
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);

    // Update notification record to mark email as sent
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase
      .from('notifications')
      .update({ 
        email_sent: true,
        email_sent_at: new Date().toISOString()
      })
      .eq('quote_id', quoteId)
      .eq('type', status === 'accepted' ? 'quote_accepted' : 'quote_declined')
      .order('created_at', { ascending: false })
      .limit(1);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        emailId: result.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error sending email notification:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
