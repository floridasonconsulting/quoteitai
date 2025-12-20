import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { checkRateLimit } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendQuoteEmailRequest {
  customerEmail: string;
  customerName: string;
  subject: string;
  greeting: string;
  bodyText: string;
  closingText: string;
  includeSummary: boolean;
  executiveSummary?: string;
  includeShareLink: boolean;
  shareLink?: string;
  quoteNumber: string;
  quoteTitle: string;
  quoteTotal: number;
  companyName?: string;
  companyLogo?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let {
      customerEmail,
      customerName,
      subject,
      greeting,
      bodyText,
      closingText,
      includeSummary,
      executiveSummary,
      includeShareLink,
      shareLink,
      quoteNumber,
      quoteTitle,
      quoteTotal,
      companyName,
      companyLogo,
    }: SendQuoteEmailRequest = await req.json();

    console.log(`Sending quote email to ${customerEmail} for quote ${quoteNumber}`);

    // CRITICAL: Validate logo URL to prevent SSRF attacks
    if (companyLogo) {
      try {
        const logoUrl = new URL(companyLogo);
        const ALLOWED_DOMAINS = ['supabase.co', 'quoteit.ai', 'localhost'];
        const isAllowed = ALLOWED_DOMAINS.some(domain =>
          logoUrl.hostname === domain || logoUrl.hostname.endsWith(`.${domain}`)
        );

        if (!isAllowed) {
          console.warn(`⚠️ Rejected logo URL from disallowed domain: ${logoUrl.hostname}`);
          throw new Error(`Logo URL domain not allowed: ${logoUrl.hostname}`);
        }

        // Only allow HTTPS (except localhost for development)
        if (logoUrl.protocol !== 'https:' && !logoUrl.hostname.includes('localhost')) {
          throw new Error('Only HTTPS URLs are allowed for logos');
        }
      } catch (error) {
        console.error('Invalid logo URL:', error);
        // Continue without logo rather than failing the entire email
        companyLogo = undefined;
      }
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Check environment and test mode
    const environment = Deno.env.get('ENVIRONMENT') || 'development';
    const isProduction = environment === 'production' || environment === 'prod';
    const resendAccountEmail = Deno.env.get('RESEND_ACCOUNT_EMAIL');

    // Test mode logic: if not production AND a test account is set, redirect
    // OR if no verified domain is available (indicated by another toggle maybe)
    const resendTestMode = Deno.env.get('RESEND_TEST_MODE') === 'true';
    const actualRecipient = customerEmail;

    // Default to test mode if not explicitly in production and we have an account email
    const isTestMode = resendTestMode || (!isProduction && !!resendAccountEmail);
    const recipientEmail = (isTestMode && resendAccountEmail) ? resendAccountEmail : customerEmail;

    if (isTestMode) {
      console.warn(`⚠️ Resend testing mode active (Env: ${environment})`);
      if (resendAccountEmail) {
        console.warn(`⚠️ Redirecting email from ${customerEmail} to ${resendAccountEmail}`);
      } else {
        console.warn(`⚠️ No RESEND_ACCOUNT_EMAIL set. Attempting to send to ${customerEmail} anyway (may fail if domain not verified)`);
      }
    }

    const testModeNotice = isTestMode ? `
      <tr>
        <td style="padding: 20px 40px;">
          <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 16px; border-radius: 6px;">
            <p style="margin: 0 0 8px; font-size: 14px; font-weight: bold; color: #856404;">
              ⚠️ Testing Mode Notice
            </p>
            <p style="margin: 0; font-size: 13px; color: #856404; line-height: 1.5;">
              This email would have been sent to: <strong>${actualRecipient}</strong><br>
              To send emails to all recipients, verify your domain at 
              <a href="https://resend.com/domains" style="color: #0066cc;">resend.com/domains</a>
            </p>
          </div>
        </td>
      </tr>
    ` : '';

    const logoSection = companyLogo ? `
      <tr>
        <td style="padding: 20px 40px; text-align: center;">
          <img src="${companyLogo}" alt="${companyName || 'Company'} Logo" style="max-width: 200px; height: auto;" />
        </td>
      </tr>
    ` : '';

    const summarySection = includeSummary && executiveSummary ? `
      <tr>
        <td style="padding: 0 40px 30px;">
          <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 12px; font-size: 16px; color: #1e40af;">Executive Summary</h3>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e3a8a; white-space: pre-wrap;">${executiveSummary}</p>
          </div>
        </td>
      </tr>
    ` : '';

    const shareLinkSection = includeShareLink && shareLink ? `
      <tr>
        <td style="padding: 0 40px 30px; text-align: center;">
          <a href="${shareLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
            📄 View & Download Quote
          </a>
          <p style="margin: 12px 0 0; font-size: 13px; color: #666666;">
            Click the button above to view the full quote online and download a PDF
          </p>
        </td>
      </tr>
    ` : '';

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
                  ${testModeNotice}
                  
                  ${logoSection}
                  
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px;">
                      <h1 style="margin: 0 0 12px; font-size: 24px; color: #333333;">${companyName || 'Quote'}</h1>
                      <p style="margin: 0; font-size: 14px; color: #666666;">Quote #${quoteNumber}: ${quoteTitle}</p>
                    </td>
                  </tr>
                  
                  <!-- Greeting and Body -->
                  <tr>
                    <td style="padding: 0 40px 30px;">
                      <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #333333;">
                        ${greeting}
                      </p>
                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333; white-space: pre-wrap;">
                        ${bodyText}
                      </p>
                    </td>
                  </tr>
                  
                  ${summarySection}
                  
                  <!-- Quote Details -->
                  <tr>
                    <td style="padding: 0 40px 30px;">
                      <div style="background-color: #f9fafb; border-radius: 6px; padding: 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 8px 0; font-size: 14px; color: #666666;">Quote Number:</td>
                            <td style="padding: 8px 0; font-size: 14px; color: #333333; font-weight: 600; text-align: right;">${quoteNumber}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-size: 14px; color: #666666;">Total Amount:</td>
                            <td style="padding: 8px 0; font-size: 18px; color: #2563eb; font-weight: 700; text-align: right;">$${quoteTotal.toFixed(2)}</td>
                          </tr>
                        </table>
                      </div>
                    </td>
                  </tr>
                  
                  ${shareLinkSection}
                  
                  <!-- Closing -->
                  <tr>
                    <td style="padding: 0 40px 40px;">
                      <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #333333; white-space: pre-wrap;">
                        ${closingText}
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 40px; text-align: center; border-top: 1px solid #e5e5e5; background-color: #f9fafb;">
                      <p style="margin: 0; font-size: 12px; color: #666666;">
                        ${companyName ? `${companyName} - ` : ''}Powered by Quote-it AI
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

    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || Deno.env.get('FROM_EMAIL_ADDRESS') || 'Quote-it AI <notifications@resend.dev>';
    const recipientEmailFinal = isTestMode && resendAccountEmail ? resendAccountEmail : customerEmail;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipientEmailFinal],
        subject: isTestMode ? `[Test Mode] ${subject}` : subject,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Resend API error:', errorData);

      if (errorData.includes('validation_error') || errorData.includes('verify a domain')) {
        console.warn('⚠️ Domain not verified with Resend. To send emails to all recipients, verify your domain at https://resend.com/domains');
        throw new Error('Email domain not verified. Emails can only be sent to verified addresses. Please verify your domain at resend.com/domains');
      }

      throw new Error(`Failed to send email: ${response.status} ${errorData}`);
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        emailId: result.id,
        testMode: isTestMode,
        actualRecipient: isTestMode ? actualRecipient : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error sending quote email:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to send quote email',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
