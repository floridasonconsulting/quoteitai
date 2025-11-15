# 🚀 Edge Functions Deployment Guide

**Last Updated:** 2025-11-15  
**Status:** Production-Ready

This guide covers deploying all Supabase Edge Functions for Quote-It AI.

---

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Supabase CLI installed**
```bash
npm install -g supabase
```

2. **Supabase project created**
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Create new project (if not already done)
   - Note your project reference ID

3. **Environment secrets ready**
   - OpenAI API key
   - Stripe secret key
   - Stripe webhook secret
   - Email service API key (SendGrid or Resend)

---

## 🔗 Link Your Project

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# You'll be prompted for your database password
# This only needs to be done once
```

---

## 🔐 Set Environment Secrets

All Edge Functions need these secrets configured:

```bash
# OpenAI API Key (for AI features)
supabase secrets set OPENAI_API_KEY=sk-...

# Stripe Keys (for payments)
supabase secrets set STRIPE_SECRET_KEY=sk_test_... # Use sk_live_... for production
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

# Email Service (choose SendGrid OR Resend)
supabase secrets set SENDGRID_API_KEY=SG...
supabase secrets set SENDGRID_FROM_EMAIL=noreply@quoteitai.com

# OR (if using Resend instead)
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set RESEND_FROM_EMAIL=noreply@quoteitai.com

# App Configuration
supabase secrets set VITE_APP_URL=https://quoteitai.com
supabase secrets set VITE_SUPPORT_EMAIL=quoteitai@gmail.com
```

**Verify secrets were set:**
```bash
supabase secrets list
```

---

## 📦 Deploy All Edge Functions

### Option A: Deploy All at Once (Recommended)

```bash
# Deploy all functions in one command
supabase functions deploy ai-assist && \
supabase functions deploy send-quote-email && \
supabase functions deploy send-quote-notification && \
supabase functions deploy send-follow-up-email && \
supabase functions deploy create-checkout && \
supabase functions deploy customer-portal && \
supabase functions deploy check-subscription && \
supabase functions deploy create-payment-intent && \
supabase functions deploy stripe-webhook && \
supabase functions deploy update-quote-status && \
supabase functions deploy manage-user-role && \
supabase functions deploy analytics && \
supabase functions deploy generate-manifest
```

### Option B: Deploy Individually

**AI Features:**
```bash
supabase functions deploy ai-assist
```

**Email Functions:**
```bash
supabase functions deploy send-quote-email
supabase functions deploy send-quote-notification
supabase functions deploy send-follow-up-email
```

**Payment Functions:**
```bash
supabase functions deploy create-checkout
supabase functions deploy customer-portal
supabase functions deploy check-subscription
supabase functions deploy create-payment-intent
supabase functions deploy stripe-webhook
```

**Utility Functions:**
```bash
supabase functions deploy update-quote-status
supabase functions deploy manage-user-role
supabase functions deploy analytics
supabase functions deploy generate-manifest
```

---

## ✅ Verify Deployment

After deploying, verify each function is working:

### 1. Check Function Status

```bash
# List all deployed functions
supabase functions list
```

You should see all 13 functions listed.

### 2. Test Each Function

**Test AI Assist:**
```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/ai-assist \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"generate_title","context":"Kitchen renovation","userId":"test"}'
```

**Test Create Payment Intent:**
```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/create-payment-intent \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"quoteId":"test-quote-id","amount":10000,"depositPercentage":100}'
```

**Expected Response:** Should return a Stripe checkout session URL

---

## 🔧 Configure Stripe Webhooks

For the `stripe-webhook` function to work, you need to configure Stripe:

### 1. Get Your Webhook URL

```
https://your-project.supabase.co/functions/v1/stripe-webhook
```

### 2. Add to Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter your webhook URL
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **Signing Secret** (starts with `whsec_`)
7. Update your Supabase secrets:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Test Webhook

Use Stripe CLI to test:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks to your local environment
stripe listen --forward-to https://your-project.supabase.co/functions/v1/stripe-webhook

# Trigger a test event
stripe trigger checkout.session.completed
```

---

## 🧪 Testing Edge Functions

### Test AI Features (ai-assist)

```typescript
// In your app code:
const { data, error } = await supabase.functions.invoke('ai-assist', {
  body: {
    action: 'generate_title',
    context: 'Website redesign for law firm',
    userId: user.id
  }
});

console.log(data); // Should return AI-generated title
```

### Test Email Sending (send-quote-email)

```typescript
// In your app code:
const { data, error } = await supabase.functions.invoke('send-quote-email', {
  body: {
    quoteId: 'your-quote-id',
    recipientEmail: 'customer@example.com',
    recipientName: 'John Doe',
    subject: 'Your Quote from Quote-It AI',
    userId: user.id
  }
});

console.log(data); // Should return success message
```

### Test Payment Intent (create-payment-intent)

```typescript
// In your app code:
const { data, error } = await supabase.functions.invoke('create-payment-intent', {
  body: {
    quoteId: 'your-quote-id',
    amount: 50000, // $500.00
    depositPercentage: 30 // 30% deposit
  }
});

console.log(data.checkoutUrl); // Stripe checkout URL
```

---

## 📊 Monitor Function Performance

### View Logs

```bash
# View logs for a specific function
supabase functions logs ai-assist

# Follow logs in real-time
supabase functions logs ai-assist --follow

# Filter by error level
supabase functions logs ai-assist --level error
```

### Check Function Metrics

1. Go to Supabase Dashboard
2. Navigate to **Edge Functions**
3. Click on a function name
4. View:
   - Invocation count
   - Error rate
   - Average execution time
   - Recent logs

---

## 🚨 Troubleshooting

### Function Deployment Fails

**Problem:** `Error: Failed to deploy function`

**Solutions:**
1. Check that you're linked to the correct project:
   ```bash
   supabase projects list
   ```
2. Verify your internet connection
3. Check function syntax:
   ```bash
   deno check supabase/functions/function-name/index.ts
   ```

### Function Returns 500 Error

**Problem:** Function deploys but returns internal server error

**Solutions:**
1. Check function logs:
   ```bash
   supabase functions logs function-name --level error
   ```
2. Verify environment secrets are set correctly
3. Test locally first:
   ```bash
   supabase functions serve function-name
   ```

### Secrets Not Available

**Problem:** Function can't access environment variables

**Solutions:**
1. List secrets to verify they're set:
   ```bash
   supabase secrets list
   ```
2. Re-set the missing secret:
   ```bash
   supabase secrets set SECRET_NAME=value
   ```
3. Redeploy the function after setting secrets

### Stripe Webhook Not Receiving Events

**Problem:** Stripe events not triggering webhook

**Solutions:**
1. Verify webhook URL is correct in Stripe Dashboard
2. Check that webhook secret matches:
   ```bash
   supabase secrets list | grep STRIPE_WEBHOOK_SECRET
   ```
3. Test webhook manually using Stripe CLI
4. Check function logs for errors

---

## 🔄 Updating Edge Functions

When you make changes to a function:

```bash
# Test locally first
supabase functions serve function-name

# Deploy updated function
supabase functions deploy function-name

# Verify it's working
supabase functions logs function-name --follow
```

---

## 📝 Function Reference

| Function | Purpose | Dependencies |
|----------|---------|--------------|
| `ai-assist` | AI-powered quote generation | OpenAI API |
| `send-quote-email` | Send quote via email | SendGrid/Resend |
| `send-quote-notification` | Push notifications | None |
| `send-follow-up-email` | Automated follow-ups | SendGrid/Resend |
| `create-checkout` | Create Stripe checkout | Stripe |
| `customer-portal` | Stripe customer portal | Stripe |
| `check-subscription` | Verify subscription status | Stripe |
| `create-payment-intent` | Create payment session | Stripe |
| `stripe-webhook` | Handle Stripe events | Stripe |
| `update-quote-status` | Update quote status | None |
| `manage-user-role` | Admin role management | None |
| `analytics` | Usage analytics | None |
| `generate-manifest` | PWA manifest generation | None |

---

## ✅ Deployment Checklist

Before going live, verify:

- [ ] All 13 Edge Functions deployed successfully
- [ ] Environment secrets configured correctly
- [ ] Stripe webhook endpoint added and tested
- [ ] Email sending tested (real email received)
- [ ] AI features tested (title, notes generation)
- [ ] Payment flow tested (Stripe test card)
- [ ] Function logs reviewed (no critical errors)
- [ ] Performance metrics acceptable (< 2s avg)
- [ ] Error handling working correctly
- [ ] All functions have proper CORS headers

---

## 🚀 Production Readiness

### Switch to Production Mode

**1. Update Stripe to Live Mode:**
```bash
# Replace test keys with live keys
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_... # From live webhook
```

**2. Update Email Configuration:**
```bash
# Use production email domain
supabase secrets set SENDGRID_FROM_EMAIL=noreply@quoteitai.com
```

**3. Update App URL:**
```bash
supabase secrets set VITE_APP_URL=https://quoteitai.com
```

**4. Redeploy All Functions:**
```bash
# Redeploy with production secrets
supabase functions deploy ai-assist
supabase functions deploy send-quote-email
# ... (deploy all 13 functions)
```

### Production Monitoring

Set up alerts for:
- Function errors (> 1% error rate)
- Slow execution (> 5s avg)
- High failure rate (> 5 failures/hour)
- Webhook failures

Use Supabase Dashboard or integrate with:
- Sentry for error tracking
- Datadog for performance monitoring
- PagerDuty for critical alerts

---

## 🎓 Best Practices

1. **Test Locally First**
   - Always test functions locally before deploying
   - Use `supabase functions serve` for local testing

2. **Deploy During Low Traffic**
   - Deploy updates during off-peak hours
   - Monitor closely after deployment

3. **Keep Functions Small**
   - Each function should do one thing well
   - Extract shared logic to `_shared` folder

4. **Handle Errors Gracefully**
   - Always return proper HTTP status codes
   - Log errors for debugging
   - Provide helpful error messages

5. **Monitor Performance**
   - Check function logs regularly
   - Optimize slow functions
   - Set up alerts for critical issues

6. **Version Control**
   - Commit all changes before deploying
   - Tag production deployments
   - Document breaking changes

---

## 📚 Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Deploy Docs](https://deno.com/deploy/docs)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [OpenAI API Reference](https://platform.openai.com/docs)

---

**You're ready to deploy! 🚀**

Run the deployment commands and your Edge Functions will be live and ready to power Quote-It AI.

**Estimated Time:** 15-30 minutes for first-time deployment

**Next Steps:**
1. Deploy all Edge Functions ✅
2. Configure Stripe webhooks ✅
3. Test payment flow ✅
4. Test email sending ✅
5. Monitor for 24 hours ✅
6. Launch! 🎉
