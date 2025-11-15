import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendFollowUpEmailRequest {
  customerEmail: string;
  customerName: string;
  subject: string;
  greeting: string;
  bodyText: string;
  closingText: string;
  companyName: string;
  companyLogo?: string;
  includeQuoteReference?: boolean;
  quoteNumber?: string;
  quoteTitle?: string;
  quoteTotal?: number;
  quoteShareLink?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      customerEmail,
      customerName,
      subject,
      greeting,
      bodyText,
      closingText,
      companyName,
      companyLogo,
      includeQuoteReference,
      quoteNumber,
      quoteTitle,
      quoteTotal,
      quoteShareLink,
    }: SendFollowUpEmailRequest = await req.json();

    console.log("Sending follow-up email to:", customerEmail);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // Test mode detection
    const isTestMode = Deno.env.get("ENVIRONMENT") !== "production";
    const resendAccountEmail = Deno.env.get("RESEND_ACCOUNT_EMAIL");
    
    let recipientEmail = customerEmail;
    let testWarning = "";
    const actualRecipient = customerEmail;
    
    if (isTestMode && resendAccountEmail) {
      const domain = customerEmail.split("@")[1];
      const resendDomain = resendAccountEmail.split("@")[1];
      
      if (!domain || domain !== resendDomain) {
        recipientEmail = resendAccountEmail;
        testWarning = `<div style="background: #fff3cd; border: 1px solid #ffc107; padding: 12px; margin-bottom: 20px; border-radius: 4px; color: #856404;">
          <strong>⚠️ Test Mode:</strong> This email was originally intended for ${customerEmail}
        </div>`;
        console.log(`Test mode: Redirecting email from ${customerEmail} to ${resendAccountEmail}`);
      }
    }

    // Build quote reference section if included
    let quoteReferenceSection = "";
    if (includeQuoteReference && quoteNumber) {
      const formattedTotal = quoteTotal 
        ? `$${quoteTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
        : "";
      
      const viewButton = quoteShareLink ? `
        <table role="presentation" style="margin: 20px 0;">
          <tr>
            <td style="border-radius: 4px; background: #0066cc;">
              <a href="${quoteShareLink}" style="background: #0066cc; border: none; color: white; padding: 12px 24px; text-decoration: none; display: inline-block; border-radius: 4px; font-weight: 600;">
                📄 View Quote Details
              </a>
            </td>
          </tr>
        </table>
      ` : "";

      quoteReferenceSection = `
        <div style="background: #f8f9fa; border-left: 4px solid #0066cc; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">Quote Reference</h3>
          <p style="margin: 4px 0; color: #666;"><strong>Quote #${quoteNumber}</strong>${quoteTitle ? `: ${quoteTitle}` : ""}</p>
          ${formattedTotal ? `<p style="margin: 4px 0; color: #666;"><strong>Total:</strong> ${formattedTotal}</p>` : ""}
          ${viewButton}
        </div>
      `;
    }

    const logoSection = companyLogo ? `
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="${companyLogo}" alt="${companyName}" style="max-width: 200px; height: auto;" />
      </div>
    ` : "";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${testWarning}
          
          ${logoSection}
          
          <div style="background: white; padding: 32px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="margin: 0 0 16px 0; font-size: 16px;">${greeting}</p>
            
            <div style="white-space: pre-wrap; margin: 16px 0; font-size: 15px; line-height: 1.6;">
              ${bodyText}
            </div>
            
            ${quoteReferenceSection}
            
            <p style="margin: 24px 0 8px 0; font-size: 16px;">${closingText}</p>
            <p style="margin: 0; font-size: 16px; font-weight: 600; color: #0066cc;">${companyName}</p>
          </div>
          
          <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
            <p style="margin: 0;">This is a follow-up message from ${companyName}</p>
          </div>
        </body>
      </html>
    `;

    const fromEmail = Deno.env.get('FROM_EMAIL_ADDRESS') || `${companyName} <notifications@resend.dev>`;
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipientEmail],
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
    console.log('Follow-up email sent successfully:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Follow-up email sent successfully',
        emailId: result.id,
        testMode: isTestMode,
        actualRecipient: isTestMode ? actualRecipient : undefined,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-follow-up-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send follow-up email',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
