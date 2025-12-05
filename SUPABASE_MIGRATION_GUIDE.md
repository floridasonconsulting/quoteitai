# 🔄 Migrate to Your Own Supabase Account

This guide will help you transfer Quote.it AI from the Softgen-managed Supabase to your own Supabase account.

---

## 📋 Prerequisites

- A Supabase account (free tier works fine)
- Access to Softgen settings (upper right corner)

---

## 🚀 Step-by-Step Migration Process

### Step 1: Create Your Supabase Project

1. Go to https://supabase.com
2. Click **"New Project"**
3. Choose:
   - **Name**: quote-it-ai (or any name you prefer)
   - **Database Password**: Save this securely!
   - **Region**: Choose closest to you
4. Click **"Create new project"**
5. Wait 2-3 minutes for project to spin up

---

### Step 2: Run the Schema Migration

1. In your Supabase project, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Open the file: `supabase/migrations/00000000000000_complete_schema.sql`
4. Copy ALL the SQL content
5. Paste it into the Supabase SQL Editor
6. Click **"Run"** (bottom right corner)
7. Wait for completion (you'll see a success message)

**Expected Output:**
```
✅ Quote.it AI Database Schema Setup Complete!

📊 Tables Created:
   - customers (with RLS)
   - items (with min_quantity and image_url columns)
   - quotes (with RLS and public sharing)
   - company_settings (with RLS)
   - user_roles (with RLS)
   - subscription_usage (with RLS)

🔒 Security:
   - Row Level Security enabled on all tables
   - Policies configured for user isolation
   - Public quote viewing via share_token
```

---

### Step 3: Get Your Supabase Credentials

1. In your Supabase project, click **"Settings"** (gear icon, bottom left)
2. Click **"API"** in the Settings menu
3. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

---

### Step 4: Connect Softgen to Your Supabase

1. In your Softgen app, click **Settings icon** (upper right corner)
2. Click **"Supabase"** tab
3. Enter:
   - **Supabase URL**: Paste your Project URL
   - **Supabase Anon Key**: Paste your anon public key
4. Click **"Save"** or **"Connect"**

---

### Step 5: Verify the Connection

1. The app will refresh automatically
2. You should see a blank slate (no data yet - that's expected!)
3. Try creating a test item or customer
4. Go to Supabase dashboard → **"Table Editor"**
5. You should see your new data in the tables! ✅

---

## 🎯 What This Accomplishes

✅ **Your own database** - Complete control and ownership  
✅ **All features working** - min_quantity and image_url columns ready  
✅ **Security configured** - RLS policies protecting your data  
✅ **No sync errors** - Schema matches the app perfectly  
✅ **Free tier eligible** - Supabase free tier is generous  

---

## 📊 Data Migration (Optional)

If you want to transfer existing data from Softgen Supabase:

### Option 1: Manual Export/Import
1. In the Softgen-connected app, go to **Settings → Data Management**
2. Click **"Export All Data"** (creates a JSON backup)
3. Switch to your Supabase connection
4. Click **"Import All Data"** and select the JSON file

### Option 2: CSV Export/Import
1. Export Customers, Items, and Quotes as CSV
2. Switch Supabase connections
3. Import each CSV file

---

## 🔧 Troubleshooting

### Issue: "Could not find the 'X' column"
**Solution:** Make sure you ran the complete schema SQL in Step 2.

### Issue: "Permission denied" errors
**Solution:** Check that you copied the **anon public** key, not the service_role key.

### Issue: App still shows old data
**Solution:** 
1. Clear browser cache
2. In browser console: `localStorage.clear()`
3. Refresh the page

### Issue: No data appears after connection
**Solution:** This is normal! Your new Supabase is empty. Start adding data fresh, or import from backup.

---

## 👤 Setting Up Admin Test Accounts

After running the schema migration, you need to create admin accounts for testing.

### Quick Method: SQL Function

The schema includes helper functions to easily set user roles!

**Step 1: Create Your Test Account**
1. In the app, sign up with your test email (e.g., `admin@test.com`)
2. This creates the account as 'free' tier by default

**Step 2: Upgrade to Admin/MAX**
In Supabase SQL Editor, run:

```sql
-- Option A: Set role by email (easiest!)
SELECT set_user_role_by_email('admin@test.com', 'admin');

-- Option B: Set multiple accounts at once
SELECT set_user_role_by_email('admin@test.com', 'admin');
SELECT set_user_role_by_email('test1@test.com', 'max');
SELECT set_user_role_by_email('test2@test.com', 'pro');
```

**Step 3: Verify**
```sql
-- List all users and their roles
SELECT * FROM list_users_with_roles();
```

### Available Roles
- `admin` - Full system access + unlimited AI
- `max` - Unlimited AI access
- `pro` - 100 AI requests/month
- `free` - 10 AI requests/month
- `business` - White-label features

### Bulk Admin Setup Script
If you have multiple test accounts:

```sql
-- Create admin accounts for your test team
SELECT set_user_role_by_email('admin1@yourcompany.com', 'admin');
SELECT set_user_role_by_email('admin2@yourcompany.com', 'admin');
SELECT set_user_role_by_email('tester1@yourcompany.com', 'max');
SELECT set_user_role_by_email('tester2@yourcompany.com', 'pro');

-- Verify all were set correctly
SELECT * FROM list_users_with_roles();
```

---

## 📞 Need Help?

- Check the Supabase project logs: **Logs & Analytics** tab
- Review browser console for errors (F12)
- Verify environment variables in Softgen settings

---

## 🎉 Success!

Once complete, you'll have:
- ✅ Your own Supabase database
- ✅ Full schema with all features
- ✅ Complete data ownership
- ✅ No more sync errors
- ✅ Ready to deploy independently

**Your app is now running on YOUR infrastructure!** 🚀