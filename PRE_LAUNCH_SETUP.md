# 🚀 Quote-It AI - Pre-Launch Setup Guide

**Target:** Production-ready deployment  
**Time Required:** 2-4 hours  
**Status:** Use this guide for final launch preparation

---

## 📋 Critical Pre-Launch Checklist

Complete these steps in order before going live:

### 1. ✅ Environment Configuration (30 min)

#### Required Services
You'll need accounts and API keys for:

1. **Supabase** (Database & Auth)
   - Sign up at [supabase.com](https://supabase.com)
   - Create new project
   - Note project URL and anon key

2. **Stripe** (Payments)
   - Sign up at [stripe.com](https://stripe.com)
   - Get test keys for development
   - Get live keys for production
   - Note publishable and secret keys

3. **OpenAI** (AI Features)
   - Sign up at [openai.com](https://openai.com)
   - Create API key
   - Add billing method (usage-based)

4. **Email Service** (Choose ONE)
   - **Option A: SendGrid** (Recommended)
     - Sign up at [sendgrid.com](https://sendgrid.com)
     - Verify sender domain
     - Get API key
   - **Option B: Resend** (Alternative)
     - Sign up at [resend.com](https://resend.com)
     - Verify sender domain
     - Get API key

#### Environment Variables Setup

1. Copy the example file:
```bash
cp .env.example .env.local
```

2. Fill in all values in `.env.local`:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... # Use pk_live_... for production
STRIPE_SECRET_KEY=sk_test_... # Use sk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_... # Get from Stripe dashboard

# OpenAI Configuration
OPENAI_API_KEY=sk-... # Your OpenAI API key

# Email Configuration (choose SendGrid OR Resend)
SENDGRID_API_KEY=SG.... # If using SendGrid
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# OR
RESEND_API_KEY=re_... # If using Resend
RESEND_FROM_EMAIL=noreply@yourdomain.com

# App Configuration
VITE_APP_URL=https://yourdomain.com # Your production domain
VITE_SUPPORT_EMAIL=support@yourdomain.com
```

3. **IMPORTANT:** Never commit `.env.local` to git!

---

### 2. 🗄️ Database Setup (20 min)

#### Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in project details:
   - Name: `quote-it-ai-production`
   - Database Password: (save securely!)
   - Region: (choose closest to your users)
4. Wait for project to be created (~2 minutes)

#### Run Database Migrations

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Link your project:
```bash
supabase link --project-ref your-project-ref
```

3. Run all migrations:
```bash
supabase db push
```

4. Verify tables exist:
   - Go to Supabase Dashboard → Table Editor
   - Should see: `profiles`, `quotes`, `customers`, `items`, `notifications`, etc.

#### Deploy Edge Functions

```bash
# Deploy all Edge Functions to Supabase
supabase functions deploy ai-assist
supabase functions deploy send-quote-email
supabase functions deploy send-quote-notification
supabase functions deploy send-follow-up-email
supabase functions deploy create-checkout
supabase functions deploy customer-portal
supabase functions deploy check-subscription
supabase functions deploy create-payment-intent
supabase functions deploy stripe-webhook
supabase functions deploy update-quote-status
supabase functions deploy manage-user-role
supabase functions deploy analytics
supabase functions deploy generate-manifest
```

#### Set Edge Function Secrets

```bash
# OpenAI API Key
supabase secrets set OPENAI_API_KEY=sk-...

# Stripe Keys
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

# Email Service (SendGrid or Resend)
supabase secrets set SENDGRID_API_KEY=SG...
# OR
supabase secrets set RESEND_API_KEY=re_...

# App URLs
supabase secrets set VITE_APP_URL=https://yourdomain.com
```

---

### 3. 💳 Stripe Setup (30 min)

#### Configure Stripe Account

1. **Go to Stripe Dashboard** → Settings → Payment Methods
   - Enable: Card, Apple Pay, Google Pay
   - Set currency (USD recommended)

2. **Set up Products**
   - Go to Products → Create Product
   - Create tiers: Free, Pro, Max
   - Add monthly/annual pricing
   - Note down Price IDs

3. **Configure Webhooks**
   - Go to Developers → Webhooks
   - Click **"Add Endpoint"**
   - URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy webhook secret to `.env.local`

4. **Test Mode First!**
   - Use test keys initially
   - Make test payments
   - Verify webhooks work
   - Only switch to live keys when ready to accept real money

---

### 4. 📧 Email Service Setup (20 min)

#### Option A: SendGrid Setup

1. **Sign up** at [sendgrid.com](https://sendgrid.com)
2. **Verify sender identity**
   - Settings → Sender Authentication
   - Verify single sender email OR
   - Set up domain authentication (recommended)
3. **Create API Key**
   - Settings → API Keys → Create API Key
   - Name: `quote-it-ai-production`
   - Full Access
   - Copy key to `.env.local`
4. **Create Email Templates** (optional)
   - Email API → Dynamic Templates
   - Create templates for: Quote Email, Follow-up, Receipt

#### Option B: Resend Setup

1. **Sign up** at [resend.com](https://resend.com)
2. **Verify domain**
   - Domains → Add Domain
   - Add DNS records provided
   - Wait for verification
3. **Create API Key**
   - API Keys → Create
   - Name: `quote-it-ai-production`
   - Copy key to `.env.local`

---

### 5. 🧪 Testing (60 min)

Run through these workflows to verify everything works:

#### A. Authentication Flow
- [ ] Sign up with new email
- [ ] Receive welcome email
- [ ] Log in successfully
- [ ] Password reset works
- [ ] Profile update works

#### B. Quote Creation Flow
- [ ] Create new customer
- [ ] Add items to catalog
- [ ] Create new quote
- [ ] AI title generation works
- [ ] AI notes generation works
- [ ] PDF generation works
- [ ] Email sending works

#### C. Payment Flow
- [ ] Create quote with payment link
- [ ] Visit public quote page
- [ ] Click "Accept & Pay"
- [ ] Complete test payment (use Stripe test card: 4242 4242 4242 4242)
- [ ] Verify quote status updates to "Accepted"
- [ ] Verify payment recorded

#### D. Offline Mode
- [ ] Create quote while online
- [ ] Turn off network (DevTools → Network → Offline)
- [ ] Create another quote (should work)
- [ ] Edit existing quote (should work)
- [ ] Turn network back on
- [ ] Verify changes synced

#### E. Mobile Testing
- [ ] Open app on mobile device
- [ ] Test all key workflows
- [ ] Verify responsive design
- [ ] Test offline mode
- [ ] Check performance

---

### 6. 🚀 Production Deployment (30 min)

#### Build for Production

```bash
# Install dependencies
npm install

# Build production bundle
npm run build

# Test production build locally
npm run preview
```

#### Deploy Options

**Option A: Vercel (Recommended - Easiest)**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

**Option B: Netlify**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod

# Set environment variables in Netlify dashboard
```

**Option C: Self-Hosted (VPS/Cloud)**
```bash
# Build the app
npm run build

# Upload dist/ folder to your server
# Configure nginx/Apache to serve static files
# Set up SSL certificate (Let's Encrypt)
# Configure reverse proxy if needed
```

#### Configure Domain

1. **Add custom domain** in your hosting platform
2. **Update DNS records**:
   - A record: points to your server IP
   - CNAME record: `www` → your domain
3. **Set up SSL** (usually automatic with Vercel/Netlify)
4. **Update environment variables**:
   - Change `VITE_APP_URL` to your actual domain
   - Redeploy if needed

#### Final Environment Check

Before going live, verify:
- [ ] All environment variables set correctly
- [ ] Using **LIVE** Stripe keys (not test keys)
- [ ] Email sending works from production domain
- [ ] Webhooks pointing to production URLs
- [ ] SSL certificate active
- [ ] Custom domain working

---

### 7. 📊 Monitoring Setup (20 min)

#### Analytics

**Option A: Google Analytics**
```html
<!-- Add to index.html before </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

**Option B: Plausible (Privacy-friendly)**
```html
<!-- Add to index.html before </head> -->
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

#### Error Tracking

**Sentry (Recommended)**
```bash
# Install Sentry
npm install @sentry/react

# Add to src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  tracesSampleRate: 0.1,
});
```

#### Uptime Monitoring

- **UptimeRobot** (free): [uptimerobot.com](https://uptimerobot.com)
- **Pingdom**: [pingdom.com](https://pingdom.com)
- Set up alerts for downtime

---

### 8. 📱 Mobile App Preparation (Optional - Post-Web-Launch)

If building native mobile apps:

```bash
# Install Capacitor CLI
npm install -g @capacitor/cli

# Initialize Capacitor
npx cap init

# Add platforms
npx cap add ios
npx cap add android

# Build web assets
npm run build

# Sync to native projects
npx cap sync

# Open native IDEs
npx cap open ios     # Opens Xcode
npx cap open android # Opens Android Studio
```

**iOS Requirements:**
- Mac computer with Xcode
- Apple Developer account ($99/year)
- Provisioning profiles and certificates

**Android Requirements:**
- Android Studio
- Google Play Developer account ($25 one-time)
- Signing keys

---

## 🎯 Launch Day Checklist

On the day you go live:

### Morning
- [ ] Final test of all critical workflows
- [ ] Verify all API keys are LIVE (not test)
- [ ] Check database backups are configured
- [ ] Verify email sending works
- [ ] Test payment flow one more time
- [ ] Review Terms of Service and Privacy Policy

### Go-Live
- [ ] Switch Stripe to live mode
- [ ] Update environment variables to production
- [ ] Deploy to production
- [ ] Verify deployment successful
- [ ] Test production site end-to-end
- [ ] Set up monitoring alerts

### Afternoon
- [ ] Post launch announcement on social media
- [ ] Send email to waitlist (if you have one)
- [ ] Submit to Product Hunt (if planned)
- [ ] Update status page / blog
- [ ] Monitor error logs closely

### Evening
- [ ] Check analytics dashboard
- [ ] Respond to any user issues
- [ ] Monitor Stripe dashboard for payments
- [ ] Review error tracking
- [ ] Celebrate! 🎉

---

## 🆘 Troubleshooting Common Issues

### "Supabase connection failed"
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check if Supabase project is paused (free tier)
- Verify network connectivity

### "Email not sending"
- Check API keys are correct
- Verify sender domain is verified
- Check Edge Function logs in Supabase
- Test with SendGrid/Resend dashboard

### "Payment not working"
- Verify Stripe keys are correct (pk_ and sk_ must match environment)
- Check webhook secret is set
- Review Stripe dashboard for errors
- Use Stripe test cards for testing

### "Offline mode not syncing"
- Check browser console for errors
- Verify Supabase connection
- Clear browser cache and try again
- Check for conflicting localStorage data

### "AI features not working"
- Verify OpenAI API key is set correctly
- Check OpenAI account has credits
- Review Edge Function logs
- Ensure rate limits not exceeded

---

## 📚 Additional Resources

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Vite Docs](https://vitejs.dev)
- [React Router](https://reactrouter.com)

### Support Channels
- Supabase Discord
- Stripe Support
- Stack Overflow
- Your own support email

### Security Best Practices
- Never commit `.env` files to git
- Use environment-specific keys (test vs live)
- Enable 2FA on all service accounts
- Regular security audits
- Keep dependencies updated

---

## ✅ Final Pre-Launch Verification

Before announcing your launch, confirm:

- [ ] All environment variables set correctly
- [ ] Database migrations completed
- [ ] Edge Functions deployed and working
- [ ] Stripe integration tested (test mode)
- [ ] Email sending verified
- [ ] AI features working
- [ ] Offline mode functional
- [ ] Mobile responsive
- [ ] SSL certificate active
- [ ] Custom domain working
- [ ] Analytics tracking
- [ ] Error monitoring active
- [ ] Backup strategy in place
- [ ] Legal pages accessible (Terms, Privacy)
- [ ] Support email monitored
- [ ] Marketing materials ready
- [ ] Launch announcement prepared

---

**You're ready to launch! 🚀**

Remember: Launch with the web app first. Mobile app store submissions can come later once you've validated product-market fit with web users.

Good luck with your launch!
