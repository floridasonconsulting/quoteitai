# 🔍 Proposal Image & Company Info Debug Guide

**Last Updated**: December 7, 2025  
**Status**: Comprehensive Debugging Protocol

---

## 🎯 **ISSUE SUMMARY**

**Problem**: Company info and product images not displaying in proposals

**Symptoms**:
- Company name/logo not showing in sidebar
- Product images not showing in item cards
- Category images may not be relevant

---

## 📊 **DATA FLOW ARCHITECTURE**

```
Database (Supabase)
  ├─ company_settings table
  │  └─ Fields: name, logo, email, phone, address, terms
  │
  ├─ items table
  │  └─ Fields: name, description, image_url, enhanced_description
  │
  └─ quotes table
     └─ Fields: title, items (JSONB), customer_name

                    ↓

PublicQuoteView.tsx (Data Fetcher)
  ├─ Fetches quote by share_token
  ├─ Fetches company_settings by user_id
  ├─ Formats data into Quote and CompanySettings objects
  └─ Passes to ProposalViewer

                    ↓

ProposalViewer.tsx (Orchestrator)
  ├─ Receives quote and settings props
  ├─ Calls transformQuoteToProposal()
  └─ Passes ProposalData to child components

                    ↓

proposal-transformation.ts (Transformer)
  ├─ Creates ProposalData structure
  ├─ Maps items with imageUrl
  ├─ Sets sender info from settings
  └─ Returns structured proposal

                    ↓

Child Components (Renderers)
  ├─ ProposalViewer → Sidebar (logo/name)
  ├─ CategoryGroupSection → Item images
  └─ ProposalCover → Company name
```

---

## 🔍 **STEP-BY-STEP DEBUGGING PROTOCOL**

### **STEP 1: Verify Database Has Data**

**Check Company Settings**:
```sql
-- Run in Supabase SQL Editor
SELECT 
  user_id,
  name,
  logo,
  email,
  phone,
  address,
  city,
  state
FROM company_settings
WHERE user_id = 'YOUR_USER_ID';
```

**Expected Result**:
```
user_id: abc-123-def
name: "ABC Pool Company"
logo: "https://..."
email: "contact@abcpool.com"
phone: "(555) 123-4567"
```

**Check Items Have Images**:
```sql
-- Run in Supabase SQL Editor
SELECT 
  id,
  name,
  image_url,
  enhanced_description,
  category
FROM items
WHERE user_id = 'YOUR_USER_ID'
LIMIT 10;
```

**Expected Result**:
```
name: "Pool Pump"
image_url: "https://images.unsplash.com/photo-..."
enhanced_description: "High-efficiency variable speed pump..."
category: "Equipment"
```

**Check Quote Items Structure**:
```sql
-- Run in Supabase SQL Editor
SELECT 
  id,
  title,
  items,
  customer_name
FROM quotes
WHERE share_token = 'YOUR_SHARE_TOKEN';
```

**Expected Items JSONB**:
```json
[
  {
    "name": "Pool Pump",
    "description": "Variable speed pump",
    "imageUrl": "https://images.unsplash.com/photo-...",
    "enhancedDescription": "High-efficiency pump...",
    "category": "Equipment",
    "quantity": 1,
    "price": 2500,
    "total": 2500
  }
]
```

---

### **STEP 2: Check Browser Console Logs**

**Open Browser Console**: Press `F12` → Console tab

**Look for These Logs (in order)**:

#### **A. PublicQuoteView Data Loading**
```javascript
[PublicQuoteView] Fetching company settings for user: abc-123-def

[PublicQuoteView] ✅ Settings loaded successfully: {
  name: "ABC Pool Company",
  email: "contact@abcpool.com",
  phone: "(555) 123-4567",
  address: "123 Main St",
  city: "Phoenix",
  state: "AZ",
  zip: "85001",
  website: "www.abcpool.com",
  hasLogo: true,
  logoUrl: "https://...",
  termsLength: 250
}

[PublicQuoteView] ✅ Settings object constructed: {
  name: "ABC Pool Company",
  logo: "https://...",
  email: "contact@abcpool.com",
  ...
}

[PublicQuoteView] Quote data: {
  quoteId: "xyz-789",
  itemCount: 5,
  firstItemHasImage: true,
  sampleItem: {
    name: "Pool Pump",
    imageUrl: "https://images.unsplash.com/photo-...",
    enhancedDescription: "High-efficiency pump..."
  }
}
```

#### **B. ProposalViewer Receiving Data**
```javascript
[ProposalViewer] Settings received: {
  hasSettings: true,
  settingsName: "ABC Pool Company",
  settingsLogo: "https://...",
  settingsEmail: "contact@abcpool.com",
  settingsPhone: "(555) 123-4567",
  settingsAddress: "123 Main St"
}

[ProposalViewer] Quote data: {
  quoteId: "xyz-789",
  itemCount: 5,
  firstItemHasImage: true,
  sampleItem: {
    name: "Pool Pump",
    imageUrl: "https://...",
    enhancedDescription: "..."
  }
}

[ProposalViewer] Transforming quote: xyz-789
[ProposalViewer] Using visuals: { coverImage: "https://...", logo: "https://..." }
[ProposalViewer] Using settings: { name: "ABC Pool Company", logo: "https://..." }
[ProposalViewer] Settings name: "ABC Pool Company"
[ProposalViewer] Settings logo: "https://..."
```

#### **C. Transformation Layer Processing**
```javascript
[Transformation] Starting with: {
  quoteId: "xyz-789",
  hasSettings: true,
  hasVisuals: true,
  visualsCoverImage: "https://...",
  settingsLogo: "https://..."
}

[Transformation] Quote items: [
  {
    name: "Pool Pump",
    category: "Equipment",
    imageUrl: "https://images.unsplash.com/photo-...",
    enhancedDescription: "High-efficiency pump..."
  },
  {
    name: "Pool Filter",
    category: "Equipment",
    imageUrl: "https://images.unsplash.com/photo-...",
    enhancedDescription: "Cartridge filter..."
  }
]

[Transformation] Smart cover image selected: https://images.unsplash.com/photo-...
```

#### **D. Category Rendering**
```javascript
[CategoryGroupSection] Rendering: {
  category: "Equipment",
  itemCount: 2,
  backgroundImage: "https://images.unsplash.com/photo-...",
  firstItemImage: "https://images.unsplash.com/photo-...",
  sampleItem: {
    name: "Pool Pump",
    imageUrl: "https://images.unsplash.com/photo-...",
    enhancedDescription: "..."
  }
}
```

---

### **STEP 3: Identify Missing Data**

**If You See**:
```javascript
[PublicQuoteView] Settings fetch error: { code: "PGRST116" }
```
**Problem**: No company_settings record in database
**Solution**: 
1. Go to Settings page in app
2. Fill out company information
3. Save settings
4. Try viewing proposal again

---

**If You See**:
```javascript
[PublicQuoteView] ✅ Settings loaded successfully: {
  name: "",
  email: "",
  phone: "",
  hasLogo: false,
  logoUrl: undefined
}
```
**Problem**: Company settings exist but are empty
**Solution**:
1. Update company_settings in database:
```sql
UPDATE company_settings
SET 
  name = 'ABC Pool Company',
  email = 'contact@abcpool.com',
  phone = '(555) 123-4567',
  address = '123 Main St',
  logo = 'https://your-logo-url.com/logo.png'
WHERE user_id = 'YOUR_USER_ID';
```

---

**If You See**:
```javascript
[PublicQuoteView] Quote data: {
  firstItemHasImage: false,
  sampleItem: {
    name: "Pool Pump",
    imageUrl: null,
    enhancedDescription: null
  }
}
```
**Problem**: Items in database don't have image_url
**Solution**:
1. Update items table:
```sql
UPDATE items
SET 
  image_url = 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&q=80',
  enhanced_description = 'High-efficiency variable speed pump with digital controls'
WHERE name = 'Pool Pump';
```

2. Or use the Items page in the app to add image URLs

---

**If You See**:
```javascript
[ProposalViewer] Settings received: {
  hasSettings: false,
  settingsName: undefined
}
```
**Problem**: Settings not being passed from PublicQuoteView
**Solution**: Check earlier logs in PublicQuoteView section

---

### **STEP 4: Visual Inspection**

**Desktop Sidebar**:
1. Look at left sidebar (navigation area)
2. Top section should show:
   - Company logo (if set) OR
   - Company name as text (if no logo)
3. Below that: "Owner Preview Mode" badge (if viewing as owner)

**Expected Appearance**:
```
┌──────────────────────┐
│  [Company Logo]      │ ← Should appear here
│  ABC Pool Company    │
│                      │
│  [Owner Preview]     │ ← If viewing as owner
├──────────────────────┤
│  • Executive Summary │
│  • Pool Structure    │
│  • Equipment         │
│  • Decking          │
└──────────────────────┘
```

**Item Cards**:
1. Navigate to a category section
2. Look at item cards
3. Each card should show:
   - Product image (if imageUrl present) OR
   - Text-only layout (if no image)

**Expected Appearance**:
```
┌─────────────────────────────────────┐
│ [Product Image]  │  Pool Pump       │
│  (800x600)       │  High-efficiency │
│                  │  variable speed  │
│                  │  Qty: 1 @ $2,500 │
│                  │  Total: $2,500   │
└─────────────────────────────────────┘
```

---

## 🛠️ **COMMON FIXES**

### **Fix 1: Add Company Settings**
```typescript
// Navigate to: Settings → Company Info
// Fill out:
- Company Name: "ABC Pool Company"
- Email: "contact@abcpool.com"
- Phone: "(555) 123-4567"
- Address: "123 Main St"
- City: "Phoenix"
- State: "AZ"
- Zip: "85001"

// Optional:
- Logo: Upload or paste URL
- Website: "www.abcpool.com"
- License #: "C-42-123456"
```

### **Fix 2: Add Product Images to Items**
```typescript
// Navigate to: Items page
// For each item:
1. Click "Edit" button
2. Find "Image URL" field
3. Paste Unsplash URL (see recommendations below)
4. Add "Enhanced Description" (optional)
5. Click "Save"
```

**Recommended Product Images (Unsplash)**:
```
Pool Pumps:
https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&q=80

Pool Filters:
https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80

Pool Heaters:
https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&q=80

Pool Lights:
https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80

Pool Decking:
https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80

Pool Tile:
https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80
```

### **Fix 3: Database Direct Update (If Needed)**
```sql
-- Update company settings
UPDATE company_settings
SET 
  name = 'ABC Pool Company',
  email = 'contact@abcpool.com',
  phone = '(555) 123-4567',
  address = '123 Main St',
  city = 'Phoenix',
  state = 'AZ',
  zip = '85001',
  logo = 'https://your-storage-url.com/logo.png'
WHERE user_id = 'YOUR_USER_ID';

-- Update item images
UPDATE items
SET 
  image_url = 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&q=80',
  enhanced_description = 'High-efficiency variable speed pump with energy-saving features'
WHERE name = 'Variable Speed Pump' AND user_id = 'YOUR_USER_ID';

-- Bulk update multiple items
UPDATE items
SET image_url = CASE name
  WHEN 'Pool Pump' THEN 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&q=80'
  WHEN 'Pool Filter' THEN 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80'
  WHEN 'Pool Heater' THEN 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&q=80'
  ELSE image_url
END
WHERE user_id = 'YOUR_USER_ID';
```

---

## 📋 **CHECKLIST**

### **Pre-Flight Checks**:
- [ ] Company settings exist in database
- [ ] Company name is not empty
- [ ] At least 1 item has image_url populated
- [ ] Quote exists with valid share_token
- [ ] User has permission to view quote

### **Console Log Checks**:
- [ ] `[PublicQuoteView] ✅ Settings loaded successfully` appears
- [ ] `settingsName` has a value (not empty string)
- [ ] `firstItemHasImage: true` in quote data log
- [ ] `[Transformation] Quote items:` shows imageUrl for items
- [ ] `[CategoryGroupSection]` shows firstItemImage URL
- [ ] No error messages in console

### **Visual Checks**:
- [ ] Desktop sidebar shows company logo or name
- [ ] Category sections have background images
- [ ] Item cards show product images (where applicable)
- [ ] Cover page shows company name
- [ ] No broken image icons

---

## 🚨 **TROUBLESHOOTING SCENARIOS**

### **Scenario 1: "Nothing Shows Up"**
**Symptoms**: Blank sidebar, no company info, no images

**Debug Steps**:
1. Check console for `[PublicQuoteView]` logs
2. If logs missing → Component not rendering
3. If logs show errors → Database issue
4. If logs show empty data → Settings not saved

**Solution**: Fill out Settings → Company Info and save

---

### **Scenario 2: "Company Name Shows But Not Logo"**
**Symptoms**: Text appears, but no logo image

**Debug Steps**:
1. Check console for `settingsLogo` value
2. If `undefined` → Logo not uploaded
3. If URL present → Check if URL is accessible
4. Open logo URL in new tab to verify

**Solution**: 
- Upload logo in Settings
- Or use a valid image URL
- Verify URL is HTTPS and publicly accessible

---

### **Scenario 3: "Category Images Wrong"**
**Symptoms**: Generic images instead of industry-specific

**Debug Steps**:
1. Check `[Transformation] Smart cover image selected` log
2. Review quote title and categories
3. Check if keywords match library

**Solution**: 
- Update quote title to include industry keywords
- Or customize images in `src/lib/proposal-image-library.ts`
- See `CATEGORY_IMAGE_UPDATE_GUIDE.md`

---

### **Scenario 4: "Product Images Not Showing"**
**Symptoms**: Item cards text-only, no product images

**Debug Steps**:
1. Check `[PublicQuoteView] Quote data:` for `firstItemHasImage`
2. If `false` → Items don't have image_url in database
3. Check `[Transformation] Quote items:` for imageUrl field
4. If `null` → Database field is empty

**Solution**:
- Add image URLs to items in database
- Or use Items page to edit and add URLs
- Use recommended Unsplash URLs above

---

## 📞 **SUPPORT RESOURCES**

**Documentation**:
- `CATEGORY_IMAGE_UPDATE_GUIDE.md` - How to update category images
- `PROPOSAL_IMAGE_STRATEGY.md` - Overall image strategy
- `PROPOSAL_VIEWER_IMPROVEMENTS_SUMMARY.md` - All improvements

**Database Schema**:
```sql
-- company_settings table
CREATE TABLE company_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  website TEXT,
  logo TEXT, -- Image URL
  terms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- items table
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  enhanced_description TEXT, -- Rich text for proposals
  image_url TEXT, -- Product image URL
  category TEXT,
  base_price DECIMAL,
  markup_type TEXT,
  markup DECIMAL,
  final_price DECIMAL,
  units TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

**Last Updated**: December 7, 2025  
**Need Help?** Check console logs and follow this guide step-by-step.