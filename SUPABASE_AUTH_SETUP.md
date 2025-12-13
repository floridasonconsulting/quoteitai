# 🔐 Supabase Authentication Setup Guide

## ❌ Problem: 401 Unauthorized Error on Sign In

If you're seeing these errors:
```
nasniikxboyzbbhezdgr.supabase.co/auth/v1/token?grant_type=password:1  Failed to load resource: the server responded with a status of 401 ()
[AUTH DEBUG] No session
```

This means your Supabase project authentication isn't configured yet.

---

## ✅ Complete Setup Steps

### Step 1: Enable Email Authentication

1. Go to: https://supabase.com/dashboard/project/nasniikxboyzbbhezdgr/auth/providers
2. Under **"Auth Providers"**, find **"Email"**
3. Make sure it's **ENABLED** (toggle should be ON/green)
4. Click **"Save"** if you made changes

---

### Step 2: Configure Email Settings (Important!)

1. Go to: https://supabase.com/dashboard/project/nasniikxboyzbbhezdgr/auth/templates
2. Scroll to **"Email Auth"** section
3. Configure these settings:

**For Development/Testing (Recommended to start):**
- ❌ **Enable email confirmations**: Turn **OFF**
  - This allows instant sign-ups without email verification
  - Great for testing!

- ✅ **Enable email signups**: Turn **ON**
  - Required to create new accounts

- ✅ **Enable anonymous sign-ins**: Turn **OFF**
  - We don't use this feature

**For Production (Later):**
- ✅ Enable email confirmations (sends verification emails)
- Configure SMTP settings for custom email domain

4. Click **"Save"** at the bottom

---

### Step 3: Add Redirect URLs

1. Go to: https://supabase.com/dashboard/project/nasniikxboyzbbhezdgr/auth/url-configuration
2. Under **"Redirect URLs"**, click **"Add URL"**
3. Add each of these URLs (one at a time):

```
https://3000-b694112b-c970-4b95-b2b0-997c240046f7.softgen.dev
https://3000-b694112b-c970-4b95-b2b0-997c240046f7.softgen.dev/**
http://localhost:5173
http://localhost:5173/**
```

**If you have a Vercel deployment, also add:**
```
https://your-vercel-app.vercel.app
https://your-vercel-app.vercel.app/**
```

4. Under **"Site URL"**, set it to your primary domain:
   - For Softgen: `https://3000-b694112b-c970-4b95-b2b0-997c240046f7.softgen.dev`
   - For Vercel: `https://your-vercel-app.vercel.app`

5. Click **"Save"**

---

### Step 4: Verify Database Schema

Make sure you ran the complete schema setup from `supabase/migrations/00000000000000_complete_schema.sql`

**Quick verification:**
1. Go to: https://supabase.com/dashboard/project/nasniikxboyzbbhezdgr/editor
2. Click on **"customers"** table - it should exist
3. Click on **"items"** table - should have `min_quantity` and `image_url` columns
4. Click on **"user_roles"** table - should exist

**If tables are missing:**
- Go to **SQL Editor**
- Open `supabase/migrations/00000000000000_complete_schema.sql`
- Copy ALL the SQL
- Paste and **Run**

---

### Step 5: Test Authentication

1. **Clear browser cache and localStorage:**
   - Open browser DevTools (F12)
   - Go to **Console** tab
   - Run: `localStorage.clear()`
   - Close DevTools

2. **Refresh the page**

3. **Try to sign up** (create a new account):
   - Email: `test@test.com`
   - Password: `TestPassword123!`
   - Should succeed immediately ✅

4. **Verify in Supabase:**
   - Go to: https://supabase.com/dashboard/project/nasniikxboyzbbhezdgr/auth/users
   - You should see your new user! ✅

---

## 🔧 Additional Configuration (Optional but Recommended)

### Rate Limiting
1. Go to: https://supabase.com/dashboard/project/nasniikxboyzbbhezdgr/auth/rate-limits
2. Adjust rate limits if needed:
   - **Sign ups**: 50 per hour (default is fine)
   - **Sign ins**: 100 per hour
   - **Password resets**: 10 per hour

### Password Requirements
1. Go to: https://supabase.com/dashboard/project/nasniikxboyzbbhezdgr/auth/policies
2. Configure password policy:
   - Minimum length: 8 characters
   - Require uppercase, lowercase, numbers, special chars (recommended)

---

## 📞 Still Having Issues?

### Check These Common Problems:

**1. 401 Unauthorized**
- ✅ Email provider is enabled
- ✅ Email confirmations are OFF (for testing)
- ✅ Redirect URLs include your domain
- ✅ Clear browser cache and try again

**2. Invalid credentials**
- Make sure you're using a NEW account (don't try old credentials)
- Password must meet requirements (8+ chars, mixed case, numbers)

**3. Network errors**
- Check browser console for CORS errors
- Verify Supabase project is not paused (free tier pauses after inactivity)
- Check your internet connection

**4. Environment variables**
- Verify in Vercel: Both `NEXT_PUBLIC_SUPABASE_URL` and `VITE_SUPABASE_URL` are set
- Verify anon keys match your Supabase dashboard
- Redeploy after changing env vars

---

## 🎯 Quick Checklist

Before signing in, verify:
- ✅ Email provider is enabled in Supabase
- ✅ Email confirmations are OFF (for testing)
- ✅ Redirect URLs include your domain
- ✅ Database schema is set up (tables exist)
- ✅ Environment variables are correct in Vercel
- ✅ Browser cache is cleared
- ✅ Using a FRESH sign-up (new account)

---

## 🚀 Next Steps After Sign-In Works

1. **Set up admin account:**
   ```sql
   SELECT set_user_role_by_email('your-email@test.com', 'admin');
   ```

2. **Test all features:**
   - Create customers
   - Add items to catalog
   - Generate a quote
   - Verify data appears in Supabase tables

3. **Enable email confirmations** (for production):
   - Go back to Auth settings
   - Turn ON email confirmations
   - Configure SMTP settings
   - Test with a real email address

---

## 📧 Email Configuration (Production Only)

For production, you'll want custom SMTP:

1. Go to: https://supabase.com/dashboard/project/nasniikxboyzbbhezdgr/settings/auth
2. Scroll to **"SMTP Settings"**
3. Configure your email provider:
   - **SendGrid** (recommended)
   - **AWS SES**
   - **Mailgun**
   - Or any SMTP server

4. Test emails work:
   - Enable email confirmations
   - Sign up with a test account
   - Check you receive the confirmation email

---

## ✅ Success Indicators

You'll know everything is working when:
1. ✅ Sign up creates account instantly (no email confirmation needed)
2. ✅ Sign in works and loads dashboard
3. ✅ User appears in Supabase Auth → Users
4. ✅ Creating items/customers saves to Supabase tables
5. ✅ No 401 errors in browser console
6. ✅ Onboarding wizard appears for new users

---

**Need more help?** Check the browser console (F12) for detailed error messages and share them for faster troubleshooting!