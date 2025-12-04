# 🚀 Vercel Environment Variables Setup Guide

## Quick Import Method (Recommended)

1. **Fill in `.env.local`** with your actual credentials
2. **Go to Vercel Dashboard:** https://vercel.com/dashboard
3. **Select your project** (quote-it-ai)
4. **Go to:** Settings → Environment Variables
5. **Click:** "Import .env" button (top right)
6. **Upload:** Your `.env.local` file
7. **Select:** Production, Preview, Development (all three)
8. **Click:** "Import"

---

## Manual Entry Method (Alternative)

If you prefer to add them one by one:

### Step 1: Required Variables (Must Have)

```bash
# Supabase Configuration
VITE_SUPABASE_URL = https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Security Encryption Key
VITE_ENCRYPTION_KEY = (generate using: openssl rand -base64 32)
```

### Step 2: Optional Variables (Enable Features)

```bash
# AI Features (OpenAI)
VITE_OPENAI_API_KEY = sk-...

# Payments (Stripe)
VITE_STRIPE_PUBLIC_KEY = pk_test_...
VITE_STRIPE_SECRET_KEY = sk_test_...
STRIPE_WEBHOOK_SECRET = whsec_...

# Email (Resend)
RESEND_API_KEY = re_...

# QuickBooks
QUICKBOOKS_CLIENT_ID = ...
QUICKBOOKS_CLIENT_SECRET = ...
QUICKBOOKS_REDIRECT_URI = https://quoteitai.com/integrations/quickbooks/callback
```

---

## Where to Get These Values

### 🗄️ Supabase (Required)
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: Settings → API
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### 🔐 Encryption Key (Required)
Generate a secure random key:

**Option 1 - Using OpenSSL:**
```bash
openssl rand -base64 32
```

**Option 2 - Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option 3 - Online Generator:**
- Use: https://generate-random.org/encryption-key-generator
- Select: 256-bit key, Base64 format

### 🤖 OpenAI (Optional - for AI features)
1. Go to: https://platform.openai.com/api-keys
2. Click: "Create new secret key"
3. Copy the key (starts with `sk-`)

### 💳 Stripe (Optional - for payments)
1. Go to: https://dashboard.stripe.com/apikeys
2. For testing:
   - Copy **Publishable key** (starts with `pk_test_`)
   - Copy **Secret key** (starts with `sk_test_`)
3. For webhooks:
   - Go to: Developers → Webhooks
   - Create endpoint: `https://your-domain.com/api/stripe-webhook`
   - Copy the **Signing secret** (starts with `whsec_`)

### 📧 Resend (Optional - for emails)
1. Go to: https://resend.com/api-keys
2. Click: "Create API Key"
3. Copy the key (starts with `re_`)

### 📊 QuickBooks (Optional - for accounting)
1. Go to: https://developer.intuit.com/app/developer/dashboard
2. Create an app or select existing
3. Go to: Keys & credentials
4. Copy:
   - **Client ID**
   - **Client Secret**

---

## After Adding Variables

### Step 1: Trigger Fresh Deployment
1. Go to: Deployments tab
2. Click: Latest deployment → "⋮" (three dots) → "Redeploy"
3. **UNCHECK:** "Use existing Build Cache"
4. Click: "Redeploy"

### Step 2: Verify Deployment
1. Wait for deployment to finish (usually 2-3 minutes)
2. Click: "Visit" to see your live site
3. Test login and basic features

### Step 3: Check Logs for Errors
If anything doesn't work:
1. Go to: Deployments → Click your deployment
2. Check: "Build Logs" and "Function Logs"
3. Copy any error messages and send them to support

---

## 🔒 Security Best Practices

✅ **DO:**
- Keep `.env.local` private (already in `.gitignore`)
- Use different keys for development and production
- Rotate keys periodically
- Use Stripe test keys during development

❌ **DON'T:**
- Commit `.env.local` to Git
- Share keys publicly
- Use production keys in development
- Hardcode keys in source code

---

## 🆘 Troubleshooting

### Problem: "Supabase connection failed"
**Solution:** Double-check your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Problem: "AI features not working"
**Solution:** Verify `VITE_OPENAI_API_KEY` is set and valid

### Problem: "Payments failing"
**Solution:** Check Stripe keys are correct (test keys in dev, live keys in production)

### Problem: "Environment variables not loading"
**Solution:** 
1. Make sure all variables are selected for "Production", "Preview", and "Development"
2. Redeploy without cache
3. Check variable names don't have typos

---

## 📞 Need Help?

If you're stuck:
1. Check Vercel deployment logs
2. Verify all REQUIRED variables are set
3. Make sure variable names match exactly (case-sensitive)
4. Try redeploying without cache

**Still having issues?** Copy the error message from Vercel logs and we can fix it immediately.