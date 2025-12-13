# 📸 Proposal Image Strategy Guide

## Overview
Quote.it AI uses a **Hybrid Smart Library Approach** to handle images for multi-industry proposals. This strategy balances automation, quality control, and user flexibility.

---

## 🎯 The Three-Tier System

### **Tier 1: Smart Defaults (Curated Library)** ✅ IMPLEMENTED
**Status**: Production Ready  
**Tier Access**: All users (Free, Pro, Max)

**How It Works:**
1. System maintains a curated repository of 50+ high-quality professional images
2. Images are organized by:
   - **Cover Images**: Industry-specific hero backgrounds
   - **Category Images**: Specific to job types (Construction, Plumbing, HVAC, etc.)
3. Smart matching algorithm selects relevant images based on:
   - Quote title keywords
   - Category names
   - Industry detection

**Industries Covered:**
- Construction & Renovation
- Pool & Spa Services
- Landscaping & Lawn Care
- Home Services (Plumbing, Electrical, HVAC)
- Roofing, Painting, Flooring
- Interior Work (Kitchen, Bathroom)
- Professional Services (Design, Consulting)
- Generic Commercial & Residential

**Fallback Chain:**
```
1. Match quote title keywords (e.g., "pool" → pool hero image)
2. Match primary category (e.g., "HVAC" → HVAC image)
3. Detect industry from combined text
4. Use generic modern fallback
```

**Code Location:**
- `src/lib/proposal-image-library.ts` - Image repository
- `src/lib/proposal-transformation.ts` - Smart matching logic

---

### **Tier 2: User Library (Manual Upload)** 🔄 PLANNED
**Status**: Phase 2 Development  
**Tier Access**: Pro, Max

**Features:**
1. **Settings → Proposal Visuals Library**
   - Upload custom cover images
   - Upload category-specific backgrounds
   - Manage image library
   - Set default images per category

2. **Quote Editor → Visuals Tab**
   - Override any auto-selected image
   - Upload quote-specific images
   - Preview before sending

3. **Image Management:**
   - Store in Supabase Storage
   - Organize by industry/category
   - Reuse across multiple quotes

**Priority Override Chain:**
```
1. Quote-specific user upload (highest priority)
2. User's default category image (from library)
3. Smart default from Tier 1 (fallback)
```

**Implementation Plan:**
- [ ] Create image upload component
- [ ] Add Supabase Storage integration
- [ ] Build visual library manager in Settings
- [ ] Add drag-and-drop support
- [ ] Implement image cropping/resizing

---

### **Tier 3: AI Auto-Match (Smart Suggestions)** 🤖 PLANNED
**Status**: Phase 3 Development  
**Tier Access**: Max only

**How It Works:**
1. User clicks "AI Auto-Match" in Quote Editor
2. System analyzes:
   - Quote title
   - Project description
   - Category names
   - Item descriptions
3. AI queries Unsplash/Pexels API for relevant images
4. **User reviews suggestions** before accepting
5. User can replace any image before sending

**Safety Features:**
- ✅ **Preview Required**: Never auto-sends AI images
- ✅ **Manual Approval**: User must click "Approve" button
- ✅ **Individual Replace**: Can swap any single image
- ✅ **Fallback Safety**: If API fails, uses Tier 1 defaults

**Workflow:**
```
Quote Editor → Visuals Tab
  ├─ Click "AI Auto-Match" button
  ├─ AI analyzes content (2-3 seconds)
  ├─ Preview all suggested images
  ├─ Replace any image individually
  ├─ Click "Approve & Apply"
  └─ Images saved to quote
```

**API Integration:**
- Unsplash API (primary)
- Pexels API (fallback)
- Edge Function: `supabase/functions/ai-image-match/`

**Implementation Plan:**
- [ ] Create Unsplash Edge Function
- [ ] Build AI matching algorithm
- [ ] Design preview/approval UI
- [ ] Add individual image replace
- [ ] Implement loading states
- [ ] Add error handling

---

## 🎨 Current Implementation Status

### ✅ What's Working Now (Tier 1)

1. **Cover Page Hero Images:**
   - Smart selection based on quote title
   - Industry-specific defaults
   - High-quality Unsplash images
   - Proper dark overlay for text readability

2. **Category Background Images:**
   - Relevant images per category type
   - Title banner layout (not full background)
   - Professional, clean design
   - Works across all industries

3. **Product/Item Images:**
   - Displays when `item.imageUrl` is present
   - Falls back to text-only layout
   - Magazine-style cards
   - Responsive design

4. **Smart Fallbacks:**
   - Never shows broken images
   - Always has professional appearance
   - Consistent branding

### 📋 Example: How Images Are Selected

**Scenario 1: Pool Renovation Quote**
```
Quote Title: "Luxury Pool Renovation - Smith Residence"
Categories: [Pool Structure, Equipment, Decking]

Selected Images:
- Cover: https://unsplash.com/.../photo-1600585154340-be6161a56a0c (pool)
- Pool Structure: https://unsplash.com/.../photo-1576013551627-0cc20b468848
- Equipment: https://unsplash.com/.../photo-1621905251918-48416bd8575a
- Decking: https://unsplash.com/.../photo-1600566753190-17f0baa2a6c3
```

**Scenario 2: HVAC Service Quote**
```
Quote Title: "Commercial HVAC System Upgrade"
Categories: [HVAC, Installation, Maintenance]

Selected Images:
- Cover: https://unsplash.com/.../photo-1581092160562-40aa08e78837 (hvac)
- HVAC: https://unsplash.com/.../photo-1581092160562-40aa08e78837
- Installation: https://unsplash.com/.../photo-1504307651254-35680f356dfd
- Maintenance: https://unsplash.com/.../photo-1581578731548-c64695cc6952
```

**Scenario 3: Generic Handyman Services**
```
Quote Title: "Home Repair Services"
Categories: [Repair, Maintenance, Other]

Selected Images:
- Cover: https://unsplash.com/.../photo-1568605114967-8130f3a36994 (home)
- Repair: https://unsplash.com/.../photo-1590856029826-c7a73142bbf1
- Maintenance: https://unsplash.com/.../photo-1581578731548-c64695cc6952
- Other: https://unsplash.com/.../photo-1600566753086-00f18fb6b3ea
```

---

## 🛠️ Technical Implementation

### Image Storage Strategy

**Current (Tier 1):**
```typescript
// Static URLs from Unsplash
const DEFAULT_COVER_IMAGES = {
  construction: 'https://images.unsplash.com/photo-...',
  pool: 'https://images.unsplash.com/photo-...',
  // ... etc
}
```

**Future (Tier 2 & 3):**
```typescript
// Supabase Storage
supabase.storage
  .from('proposal-images')
  .upload(`${userId}/covers/${filename}`, file)
```

### Database Schema

**Current:**
- `items.image_url` - Product images
- `proposal_visuals` table (already created):
  - `quote_id`
  - `cover_image`
  - `logo_url`
  - `gallery_images`
  - `section_backgrounds`

**Future Additions:**
```sql
-- User's custom image library
CREATE TABLE user_image_library (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  image_url TEXT NOT NULL,
  image_type TEXT, -- 'cover', 'category', 'product'
  category TEXT, -- 'pool', 'hvac', 'landscaping', etc.
  title TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI-suggested images cache
CREATE TABLE ai_image_suggestions (
  id UUID PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id),
  suggested_images JSONB,
  accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📊 Risk Mitigation

### The "Irrelevant Image" Problem

**Problem**: AI might select images that don't match user's brand or project

**Solutions Implemented:**
1. ✅ **Tier 1 Defaults**: Curated, professional images that work everywhere
2. 🔄 **Tier 2 Override**: User can replace before sending (Phase 2)
3. 🤖 **Tier 3 Preview**: AI suggestions require approval (Phase 3)

**Never Happens:**
- ❌ AI images auto-sent to customer without user seeing them
- ❌ Broken/missing images (always has fallback)
- ❌ Unprofessional or irrelevant defaults

---

## 🚀 Recommended Rollout Plan

### **Phase 1: Foundation** (COMPLETE ✅)
- ✅ Tier 1: Smart defaults with curated library
- ✅ Cover image selection logic
- ✅ Category image matching
- ✅ Fallback system
- ✅ Item image display

### **Phase 2: User Control** (2-3 weeks)
1. Build visual library manager in Settings
2. Add image upload component
3. Integrate Supabase Storage
4. Create category → image mapping UI
5. Add quote-level image override

### **Phase 3: AI Enhancement** (3-4 weeks)
1. Create Unsplash Edge Function
2. Build AI matching algorithm
3. Design preview/approval interface
4. Add individual image replacement
5. Implement Max tier gating

### **Phase 4: Advanced Features** (4-6 weeks)
1. Web scraper for client websites
2. Image cropping/resizing tools
3. Industry template packs
4. Bulk image operations
5. Image search and filters

---

## 💡 Best Practices for Users

### For Free Tier Users:
- Rely on smart defaults (already professional)
- Write descriptive quote titles for better matching
- Use standard category names

### For Pro Tier Users:
- Upload 5-10 go-to cover images to library
- Set default category images once
- Reuse across quotes for consistency

### For Max Tier Users:
- Use AI Auto-Match for quick proposals
- Always preview before sending
- Build custom industry template sets
- Leverage AI for variety while maintaining control

---

## 🎯 Success Metrics

**Quality Indicators:**
- ✅ 100% of proposals have hero images
- ✅ 0% broken/missing images
- ✅ Images match industry context
- ✅ Professional appearance maintained

**User Satisfaction:**
- Target: 95%+ approve of image relevance (Tier 1)
- Target: <5% need to replace images (Tier 2)
- Target: 90%+ accept AI suggestions (Tier 3)

---

## 📚 Additional Resources

**Code References:**
- `src/lib/proposal-image-library.ts` - Image repository and smart matching
- `src/lib/proposal-transformation.ts` - Integration logic
- `src/components/proposal/viewer/ProposalViewer.tsx` - Rendering
- `src/components/proposal/editor/tabs/VisualsTab.tsx` - Editor UI

**External APIs:**
- Unsplash API: https://unsplash.com/developers
- Pexels API: https://www.pexels.com/api/

**Design Inspiration:**
- Better Proposals: https://betterproposals.io
- Proposify: https://www.proposify.com

---

**Last Updated**: December 7, 2025  
**Status**: Tier 1 Production Ready | Tier 2 & 3 Planned  
**Next Review**: January 2026