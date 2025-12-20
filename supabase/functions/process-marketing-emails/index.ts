import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL_ADDRESS') || 'onboarding@quoteit.ai'

const templates = {
    welcome: {
        subject: "Welcome to Quote-it Pro: Let's automate your payments!",
        html: (name: string) => `
      <h1>Welcome to the Pro family, ${name}!</h1>
      <p>You've just unlocked the most powerful tools in Quote-it AI. To get the most out of your upgrade, we recommend two immediate steps:</p>
      <ul>
        <li><strong>Connect QuickBooks:</strong> Sync your customers and items instantly under Settings > Integrations.</li>
        <li><strong>Enable Stripe:</strong> Start collecting deposits and full payments directly on your proposals.</li>
      </ul>
      <p>Questions? Just reply to this email.</p>
      <p>Best,<br>The Quote-it Team</p>
    `
    },
    sow_magic: {
        subject: "Magic trick: Generate your first Scope of Work in seconds",
        html: (name: string) => `
      <h1>Hey ${name}, ready to save hours of typing?</h1>
      <p>We noticed you haven't tried our AI SOW Generator yet. It's one of our Pro members' favorite features.</p>
      <p>Next time you create a quote, look for the <strong>"Generate AI SOW"</strong> button. It will draft a professional, detailed scope of work based on your line items instantly.</p>
      <p><a href="https://app.quoteit.ai/quotes">Try it now &rarr;</a></p>
    `
    },
    retention: {
        subject: "Closing your first Pro deal",
        html: (name: string) => `
      <h1>${name}, let's get that first "Accepted" quote!</h1>
      <p>You're all set up, but you haven't had a quote accepted yet. Here's a pro tip: use our <strong>AI Follow-up</strong> tool.</p>
      <p>Go to your Sent quotes, click "AI Follow-up", and we'll draft a perfect nudge for your client to help close the deal.</p>
      <p><a href="https://app.quoteit.ai/quotes">View your quotes &rarr;</a></p>
    `
    }
}

serve(async (req: Request) => {
    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        console.log('--- Processing Marketing Emails ---')

        // 1. Fetch all organizations with pro_upgraded_at
        const { data: orgs, error: orgsError } = await supabase
            .from('organizations')
            .select('id, name, pro_upgraded_at')
            .not('pro_upgraded_at', 'is', null)

        if (orgsError) throw orgsError
        console.log(`Checking ${orgs?.length || 0} organizations...`)

        for (const org of orgs || []) {
            const upgradeTime = new Date(org.pro_upgraded_at).getTime()
            const now = Date.now()
            const diffMs = now - upgradeTime

            // A. Welcome Email (5 minutes)
            if (diffMs > 5 * 60 * 1000) {
                await maybeSendEmail(supabase, org.id, 'welcome', org.name)
            }

            // B. SOW Magic (24 hours + No SOWs)
            if (diffMs > 24 * 60 * 60 * 1000) {
                const { count } = await supabase
                    .from('quotes')
                    .select('*', { count: 'exact', head: true })
                    .eq('organization_id', org.id)
                    .not('scope_of_work', 'is', null)

                if (count === 0) {
                    await maybeSendEmail(supabase, org.id, 'sow_magic', org.name)
                }
            }

            // C. Retention Email (72 hours + No Accepted Quotes)
            if (diffMs > 72 * 60 * 60 * 1000) {
                const { count } = await supabase
                    .from('quotes')
                    .select('*', { count: 'exact', head: true })
                    .eq('organization_id', org.id)
                    .eq('status', 'accepted')

                if (count === 0) {
                    await maybeSendEmail(supabase, org.id, 'retention', org.name)
                }
            }
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 })
    } catch (error: any) {
        console.error('Error in marketing processor:', error)
        return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), { status: 500 })
    }
})

async function maybeSendEmail(supabase: any, orgId: string, emailType: string, orgName: string) {
    // Check if already sent
    const { data: existing } = await supabase
        .from('marketing_emails')
        .select('id')
        .eq('organization_id', orgId)
        .eq('email_type', emailType)
        .maybeSingle()

    if (existing) return

    console.log(`Sending ${emailType} email to ${orgName}...`)

    // Get first user of the org to send to
    const { data: profile } = await supabase
        .from('profiles')
        .select('email, first_name')
        .eq('organization_id', orgId)
        .limit(1)
        .single()

    if (!profile?.email) {
        console.error(`No email found for org ${orgId}`)
        return
    }

    const template = templates[emailType as keyof typeof templates]

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
            from: FROM_EMAIL,
            to: [profile.email],
            subject: template.subject,
            html: template.html(profile.first_name || orgName),
        }),
    })

    if (res.ok) {
        // Record as sent
        await supabase
            .from('marketing_emails')
            .insert({ organization_id: orgId, email_type: emailType })
        console.log(`✓ ${emailType} email sent to ${profile.email}`)
    } else {
        const err = await res.text()
        console.error(`Failed to send ${emailType} email:`, err)
    }
}
