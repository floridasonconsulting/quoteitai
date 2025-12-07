# 🎨 How to Update Category Images in Quote.it AI

**Last Updated**: December 7, 2025  
**Version**: 1.0

---

## 📋 Overview

Quote.it AI uses a **smart image library system** that automatically selects appropriate images based on your quote's industry and categories. This guide explains how the system works and how to customize images for your specific needs.

---

## 🎯 Current Image System (Tier 1: Smart Defaults)

### **How It Works**

The system maintains a curated library of 50+ high-quality professional images that automatically match your quote content:

**Automatic Matching Logic**:
```
1. Analyzes your quote title for keywords
   Example: "Pool Renovation" → Selects pool-related images

2. Detects industry from categories
   Example: Categories = ["Pool Structure", "Equipment"] → Pool industry detected

3. Maps categories to relevant images
   Example: "Equipment" category → Equipment background image

4. Falls back to professional generic images if no match
```

---

## 🖼️ Image Types & Their Sources

### **1. Cover Page Hero Images**
**Location**: Title page background
**Source**: `src/lib/proposal-image-library.ts` → `DEFAULT_COVER_IMAGES`

**Industries Covered**:
- Construction & Renovation
- Pool & Spa Services
- Landscaping & Lawn Care
- Home Services (Plumbing, Electrical, HVAC, Roofing, Painting, Flooring)
- Outdoor & Exterior (Decking, Fencing, Patio)
- Interior Work (Kitchen, Bathroom)
- Professional Services (Design, Consulting)

**How to Change**:
```typescript
// File: src/lib/proposal-image-library.ts
export const DEFAULT_COVER_IMAGES = {
  pool: 'https://images.unsplash.com/photo-YOUR-IMAGE-ID?w=1920&q=80',
  hvac: 'https://images.unsplash.com/photo-YOUR-IMAGE-ID?w=1920&q=80',
  // Add more industries as needed
}
```

---

### **2. Category Background Images**
**Location**: Category section title banners
**Source**: `src/lib/proposal-image-library.ts` → `CATEGORY_IMAGES`

**Categories Covered**:
- Pool Categories: Pool Structure, Coping, Tile, Decking, Equipment, Accessories
- Construction: Foundation, Framing, Drywall, Siding
- Home Services: Plumbing, Electrical, HVAC, Roofing, Painting, Flooring
- Landscaping: Landscaping, Irrigation, Hardscaping, Lighting
- Interior: Kitchen, Bathroom, Cabinets, Countertops
- Services: Installation, Maintenance, Repair

**How to Change**:
```typescript
// File: src/lib/proposal-image-library.ts
export const CATEGORY_IMAGES = {
  'Pool Structure': 'https://images.unsplash.com/photo-YOUR-IMAGE-ID?w=1920&q=80',
  'Equipment': 'https://images.unsplash.com/photo-YOUR-IMAGE-ID?w=1920&q=80',
  // Add more categories as needed
}
```

---

### **3. Product/Item Images**
**Location**: Individual item cards within categories
**Source**: Database → `items.image_url` column

**How to Add**:
```sql
-- Update an existing item
UPDATE items 
SET image_url = 'https://images.unsplash.com/photo-YOUR-IMAGE-ID?w=800&q=80'
WHERE id = 'your-item-id';

-- Or add when creating a new item
INSERT INTO items (name, description, image_url, ...)
VALUES ('Pool Pump', 'Variable speed pump', 'https://images.unsplash.com/...', ...);
```

---

## 🔧 Step-by-Step: Adding Custom Images

### **Method 1: Update Image Library (Recommended for System-Wide Changes)**

**When to Use**: You want to change the default image for a specific industry or category across ALL quotes

**Steps**:

1. **Find High-Quality Images**:
   - Visit [Unsplash.com](https://unsplash.com) (free, high-quality)
   - Or [Pexels.com](https://pexels.com) (free alternative)
   - Search for your industry/category (e.g., "pool renovation")
   - Look for images at least 1920px wide for cover images

2. **Get the Image URL**:
   ```
   Right-click image → Copy Image Address
   
   Example URL format:
   https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80
   
   Key parameters:
   w=1920  (width - use 1920 for covers, 800 for items)
   q=80    (quality - 80 is optimal balance)
   ```

3. **Update the Image Library**:
   ```typescript
   // File: src/lib/proposal-image-library.ts
   
   // For cover images:
   export const DEFAULT_COVER_IMAGES = {
     // ... existing entries
     yourIndustry: 'YOUR_UNSPLASH_URL',
   };
   
   // For category backgrounds:
   export const CATEGORY_IMAGES = {
     // ... existing entries
     'Your Category Name': 'YOUR_UNSPLASH_URL',
   };
   ```

4. **Save and Test**:
   - System will automatically use new images
   - No database changes needed
   - Affects all future quotes

---

### **Method 2: Add Product Images to Items**

**When to Use**: You want specific items to show product images in proposals

**Steps**:

1. **Get Product Image URL** (same as Method 1, but use `w=800`)

2. **Update Database**:
   ```sql
   -- Option A: Via SQL (if you have database access)
   UPDATE items 
   SET image_url = 'https://images.unsplash.com/photo-XXX?w=800&q=80'
   WHERE name = 'Your Item Name';
   
   -- Option B: Via the Quote.it AI Items page (recommended)
   -- 1. Go to Items page in the app
   -- 2. Edit the item
   -- 3. Add the image URL in the "Image URL" field
   -- 4. Save
   ```

3. **Verify in Proposals**:
   - Create a new quote with that item
   - Send/share the quote
   - Open proposal viewer
   - Item image should appear in the item card

---

### **Method 3: Per-Quote Custom Images (Coming in Phase 2)**

**Status**: 🔄 Planned for Phase 2 (2-3 weeks)

**What's Coming**:
- Upload custom cover images per quote
- Override category backgrounds per quote
- Visual library manager in Settings
- Drag-and-drop image uploads

---

## 🎨 Image Best Practices

### **Technical Requirements**:
- **Format**: JPG or PNG
- **Size**: 
  - Cover images: 1920px wide minimum
  - Category backgrounds: 1920px wide
  - Product images: 800px wide
- **Quality**: Use `q=80` parameter (optimal balance)
- **Aspect Ratio**: 
  - Cover: 16:9 (landscape)
  - Products: 4:3 or 1:1 (square)

### **Visual Guidelines**:
- ✅ High contrast for text readability
- ✅ Professional, clean composition
- ✅ Industry-appropriate subject matter
- ✅ Avoid busy backgrounds with text overlays
- ❌ Don't use images with watermarks
- ❌ Avoid cluttered or distracting compositions

### **URL Guidelines**:
- ✅ Use HTTPS (secure)
- ✅ Use Unsplash or Pexels for free stock
- ✅ Include size parameters (`?w=1920&q=80`)
- ❌ Don't use HTTP (insecure)
- ❌ Don't use local file paths

---

## 🔍 Troubleshooting

### **Images Not Showing Up**

**Problem**: Cover or category images not displaying

**Solutions**:
1. Check console for errors (F12 → Console tab)
2. Look for logs: `[Transformation] Smart cover image selected`
3. Verify URL is accessible (paste in browser)
4. Ensure URL uses HTTPS
5. Check image size parameters

**Problem**: Product images not showing in items

**Solutions**:
1. Verify `items.image_url` field is populated in database
2. Check console logs: `[CategoryGroupSection] Rendering:`
3. Verify item has `imageUrl` in quote data
4. Test with a known-good Unsplash URL

---

## 📊 Industry-Specific Image Recommendations

### **Pool & Spa Services**
```typescript
Cover: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80'
Categories:
  - Pool Structure: photo-1576013551627-0cc20b468848
  - Equipment: photo-1621905251918-48416bd8575a
  - Decking: photo-1600566753190-17f0baa2a6c3
```

### **HVAC Services**
```typescript
Cover: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&q=80'
Categories:
  - HVAC: photo-1581092160562-40aa08e78837
  - Installation: photo-1504307651254-35680f356dfd
  - Maintenance: photo-1581578731548-c64695cc6952
```

### **Landscaping**
```typescript
Cover: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1920&q=80'
Categories:
  - Landscaping: photo-1558904541-efa843a96f01
  - Irrigation: photo-1625246333195-78d9c38ad449
  - Hardscaping: photo-1600607687920-4e2a09cf159d
```

---

## 🚀 Future Enhancements

### **Phase 2: User Library (2-3 weeks)**
- Upload custom images in Settings
- Set default images per category
- Visual library manager
- Reuse images across quotes

### **Phase 3: AI Auto-Match (3-4 weeks)**
- AI analyzes project description
- Suggests relevant Unsplash images
- User preview and approval required
- Max tier only

---

## 📞 Need Help?

**For Technical Issues**:
1. Check browser console (F12)
2. Look for error messages
3. Verify image URLs are accessible

**For Custom Implementation**:
1. Review `src/lib/proposal-image-library.ts`
2. See examples in `PROPOSAL_IMAGE_STRATEGY.md`
3. Test changes with sample quotes

---

**Last Updated**: December 7, 2025  
**Questions?** Open an issue or contact support.