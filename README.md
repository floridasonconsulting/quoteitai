# Quote.it AI

**Version:** 2.4.0 (Feature Complete)
**Last Updated:** December 22, 2025

![Quote.it AI Logo](public/logo.png)

Quote.it AI is a comprehensive, AI-powered quote management platform designed for small to medium businesses. It provides intelligent quote generation, customer relationship management, item cataloging, and automated proposal creation with advanced AI assistance.

---

## 🚀 Key Features

### Quote Management
- **Full Quote Lifecycle** - Draft → Sent → Accepted/Declined tracking
- **Quote Aging Indicators** - Fresh, Warm, Aging, Stale status for follow-up prioritization
- **PDF Export** - Professional quote documents with company branding
- **Share Links** - Secure OTP-verified customer proposal viewing

### AI-Powered Intelligence
- **AI Quote Generation** - Create complete quotes from project descriptions
- **AI Scope of Work** - Generate professional SOW documents (Business+)
- **AI Executive Summaries** - Compelling proposal introductions
- **AI Follow-up Messages** - Smart, staleness-based follow-up generation
- **AI Item Descriptions** - Enhanced product/service descriptions

### Interactive Proposals
- **Magazine-Style Viewer** - Swipe-enabled, page-through proposal experience
- **Category Section Pages** - Grouped items with rich imagery
- **Scope of Work Slide** - Dedicated SOW page in proposals
- **Investment Summary** - Professional pricing presentation
- **Pricing Display Modes** - Itemized, category totals, or grand total only

### Integrations
- **QuickBooks** - Connect for invoice syncing (setup required)
- **Stripe Payments** - Accept payments on proposals (setup required)
- **Automated Follow-ups** - Scheduled reminder emails with AI messages

### Visual Customization
- **Visual Rules** - Category-based image mapping
- **Default Cover/Header Images** - Consistent proposal branding
- **Logo Upload** - Custom company branding
- **Custom Favicon** - White-label browser tab icon (Max AI)

---

## 🛠 Tech Stack

- **Frontend:** React + TypeScript + Vite
- **UI Components:** shadcn/ui + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **AI:** Google Gemini via Lovable AI Gateway
- **Deployment:** Vercel

---

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── proposal/        # Proposal viewer components
│   ├── settings/        # Settings page sections
│   └── ui/              # shadcn/ui components
├── contexts/            # React contexts (Auth)
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
│   └── services/        # Data service layer
├── pages/               # Route pages
└── types/               # TypeScript interfaces

supabase/
├── functions/           # Edge Functions
└── migrations/          # Database migrations
```

---

## 🔧 Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Edge Functions require:
- `QUICKBOOKS_CLIENT_ID` / `QUICKBOOKS_CLIENT_SECRET`
- `STRIPE_SECRET_KEY`
- `APP_URL`

---

## 📋 Recent Updates (v2.2.0)

### December 2025 (v2.4.0)
- ✅ **Proposal Content Architecture** - Priority-based system for payment & legal terms
- ✅ **Dedicated Legal Review** - Separate fields for legal clauses vs payment terms
- ✅ **Quote List Sorting** - Recently modified quotes appear first
- ✅ **Item Categorization** - Quote items verify against proposal category order
- ✅ **Scope of Work Proposals** - AI-generated SOW appears as dedicated slide
- ✅ **AI Follow-up Notifications** - Staleness-based message generation with edit/send
- ✅ **Settings Tabs** - Reorganized into Company/Proposals/Integrations/System
- ✅ **Admin-Only Sections** - Dev tools hidden from regular users
- ✅ **Batch Quote Generation** - CSV import for bulk quote creation
- ✅ **Customer Extraction** - AI parses customer names from descriptions
- ✅ **Visual Rules** - Category-to-image mapping for proposals

---

## 📞 Support

- **Email:** quoteitai@gmail.com
- **Help Center:** In-app at /help

---

## 📄 License

Proprietary - Florida Technology Consulting LLC
