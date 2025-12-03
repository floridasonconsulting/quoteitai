# 🚀 Vercel Deployment Guide - Quote.it AI

**Last Updated:** December 3, 2025  
**Status:** Ready for deployment

## 📋 Overview

This guide walks you through deploying Quote.it AI to **your personal Vercel account** (ahill005@gmail.com). The project is currently hosted on the Softgen GitHub organization, so we'll need to authorize Vercel to access it.

---

## 🎯 Prerequisites

Before starting, ensure you have:
- ✅ Vercel account (ahill005@gmail.com)
- ✅ Access to the Softgen GitHub repository
- ✅ Supabase project credentials
- ✅ (Optional) Stripe API keys for payment features

---

## 📦 Step 1: Import Project to Vercel

### 1.1 Navigate to Vercel Import Page
Go to: **https://vercel.com/new**

### 1.2 Authorize GitHub Access
1. Click **"Import Git Repository"**
2. Click **"Add GitHub Account"**
3. Select **"softgenai"** organization from the list
4. Authorize Vercel to access the organization
5. Select repository: `sg-b694112b-c970-4b95-b2b0-997c240046f7-1763217839`

### 1.3 Configure Project Settings
- **Project Name:** `quote-it-ai` (or your preferred name)
- **Framework Preset:** Vite
- **Root Directory:** `./` (leave as default)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

---

## 🔧 Step 2: Environment Variables

Add these environment variables in the Vercel project settings:

### Required Variables

```bash
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Where to find these:**
1. Go to your Supabase project dashboard
2. Click "Settings" → "API"
3. Copy "Project URL" → use for `VITE_SUPABASE_URL`
4. Copy "anon public" key → use for `VITE_SUPABASE_ANON_KEY`

### Optional Variables (Enable features as needed)

```bash
# Stripe (for payment features)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# QuickBooks (for accounting integration)
VITE_QUICKBOOKS_CLIENT_ID=your_client_id
VITE_QUICKBOOKS_REDIRECT_URI=https://your-domain.vercel.app/oauth/quickbooks/callback
VITE_QUICKBOOKS_ENVIRONMENT=production

# Feature Flags
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_ANALYTICS=false
```

### How to Add Environment Variables in Vercel

1. Go to your project in Vercel dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Add each variable:
   - **Key:** Variable name (e.g., `VITE_SUPABASE_URL`)
   - **Value:** Your actual value
   - **Environments:** Select "Production", "Preview", and "Development"
4. Click **"Save"**

---

## ⚙️ Step 3: Build & Deployment Settings

### 3.1 Build Configuration (Already Set)

The project includes these optimizations in `vite.config.ts`:

```typescript
build: {
  outDir: "dist",
  sourcemap: false,  // ✅ Disabled to reduce memory usage
  rollupOptions: {
    output: {
      manualChunks: {
        // Optimized chunking strategy
      }
    }
  }
}
```

### 3.2 Vercel Configuration

The `vercel.json` file includes:
- Security headers (HSTS, CSP, X-Frame-Options)
- SPA routing (all routes → index.html)
- CORS configuration

**No changes needed** - configuration is production-ready.

---

## 🚀 Step 4: Deploy

### First Deployment

1. After adding environment variables, click **"Deploy"**
2. Vercel will:
   - Clone the repository
   - Install dependencies (~10s)
   - Build the project (~15s)
   - Deploy to production

### Expected Build Time
- **Total:** 20-30 seconds
- **Install:** ~10 seconds
- **Build:** ~15 seconds
- **Deploy:** ~5 seconds

### Deployment URL
Your app will be available at:
- **Production:** `https://quote-it-ai.vercel.app` (or your custom domain)
- **Preview:** Automatically generated for each branch/PR

---

## ✅ Step 5: Verify Deployment

### 5.1 Check Build Logs
1. Go to Vercel dashboard → Your project
2. Click on the latest deployment
3. View build logs to ensure success

### 5.2 Test the Application
1. Visit your deployment URL
2. Test key features:
   - ✅ Login/signup works
   - ✅ Dashboard loads
   - ✅ Can create a quote
   - ✅ Supabase connection working
   - ✅ Offline functionality works

### 5.3 Common Issues & Fixes

**Issue: "Build failed - out of memory"**
- **Cause:** Large build, insufficient resources
- **Fix:** Already applied (sourcemaps disabled in vite.config.ts)

**Issue: "Supabase connection failed"**
- **Cause:** Missing or incorrect environment variables
- **Fix:** Double-check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

**Issue: "Routes not working (404)"**
- **Cause:** SPA routing not configured
- **Fix:** Already configured in `vercel.json` (rewrites section)

**Issue: "White screen after deployment"**
- **Cause:** JavaScript errors, check browser console
- **Fix:** Check deployment logs for build errors

---

## 🔄 Step 6: Continuous Deployment

### Automatic Deployments
Vercel automatically deploys when you push to GitHub:

- **Push to `main`** → Production deployment
- **Push to other branches** → Preview deployment
- **Pull requests** → Preview deployment with unique URL

### Manual Redeployment
1. Go to Vercel dashboard → Your project
2. Click **"Deployments"**
3. Find the deployment to redeploy
4. Click **"..."** → **"Redeploy"**

---

## 🌐 Step 7: Custom Domain (Optional)

### Add Custom Domain
1. Go to Vercel dashboard → Your project
2. Click **"Settings"** → **"Domains"**
3. Click **"Add Domain"**
4. Enter your domain (e.g., `quoteit.app`)
5. Follow DNS configuration instructions

### Update Environment Variables
After adding a custom domain, update:
```bash
VITE_QUICKBOOKS_REDIRECT_URI=https://your-custom-domain.com/oauth/quickbooks/callback
```

---

## 📊 Monitoring & Logs

### View Logs
1. Vercel dashboard → Your project
2. Click **"Deployments"**
3. Select a deployment → View logs

### Analytics (Optional)
Enable Vercel Analytics:
1. Go to **"Analytics"** tab
2. Click **"Enable"**
3. View real-time traffic, performance metrics

---

## 🆘 Troubleshooting

### Build Fails with Import Errors

**Error:** `"X" is not exported by "Y"`

**Solution:**
1. Check the file exists in the repository
2. Verify the export statement matches the import
3. Example fix already applied:
   ```typescript
   // ❌ Wrong: import { setItem } from './storage'
   // ✅ Correct: import { setStorageItem } from './storage'
   ```

### Environment Variables Not Working

**Symptoms:**
- Supabase connection fails
- Features not working in production

**Solution:**
1. Verify variables are set in Vercel
2. Ensure variable names start with `VITE_`
3. Redeploy after adding/changing variables

### Memory Errors During Build

**Error:** `JavaScript heap out of memory` or `Killed`

**Solution:**
Already applied in `vite.config.ts`:
```typescript
build: {
  sourcemap: false,  // Reduces memory usage
  // Other optimizations...
}
```

### 404 on Routes

**Symptoms:**
- Direct navigation to `/quotes` returns 404
- Routes work when navigating within app

**Solution:**
Already configured in `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 📝 Checklist

Before going live, ensure:

- [ ] ✅ Environment variables configured
- [ ] ✅ Supabase connection tested
- [ ] ✅ Deployment succeeds (green checkmark)
- [ ] ✅ Application loads and works correctly
- [ ] ✅ Login/signup functionality works
- [ ] ✅ Quotes can be created and viewed
- [ ] ✅ Offline functionality works
- [ ] ✅ Mobile responsive design works
- [ ] ✅ (Optional) Custom domain configured
- [ ] ✅ (Optional) Analytics enabled

---

## 🎉 Success!

Your Quote.it AI application is now deployed on Vercel!

**Next Steps:**
1. Share the deployment URL with team members
2. Test all features in production
3. Monitor performance and errors
4. Set up custom domain (optional)
5. Configure email notifications (optional)

---

## 📞 Support

**Need help?**
- **Vercel Docs:** https://vercel.com/docs
- **Project Issues:** Check GitHub repository issues
- **Email:** quoteitai@gmail.com

**Deployment Status:** ✅ Ready  
**Last Tested:** December 3, 2025  
**Build Time:** ~20-30 seconds  
**Estimated Setup Time:** 10-15 minutes
