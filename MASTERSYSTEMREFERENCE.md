# 📚 Master System Reference - Quote.it AI

**Version:** 2.2
**Last Updated:** December 2, 2025
**Status:** ✅ Phase 1 & 2 Complete | ✅ Proposal System Integrated | 🔄 Phase 3 Ongoing

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Data Models](#data-models)
5. [Core Workflows](#core-workflows)
6. [File Structure](#file-structure)
7. [Authentication & Security](#authentication--security)
8. [Performance & Optimization](#performance--optimization)
9. [Testing Strategy](#testing-strategy)
10. [Deployment](#deployment)
11. [Integrations](#integrations)
12. [Troubleshooting](#troubleshooting)
13. [Roadmap](#roadmap)

---

## 🎯 System Overview

### Purpose
Quote.it AI is a comprehensive, AI-powered quote management platform designed for small to medium businesses. It provides intelligent quote generation, customer relationship management, item cataloging, and automated proposal creation with advanced AI assistance.

### Key Features
- **AI-Powered Quote Generation** - Intelligent quote creation with context awareness and minimum quantity enforcement
- **Customer Management** - Comprehensive CRM for client relationships
- **Item Catalog** - Organized product/service inventory with pricing and minimum quantity requirements
- **Secure Interactive Proposals** - OTP-protected proposals with flip animations, comment system, and accept/reject actions
- **Proposal Templates** - Multiple professional proposal formats with swipe navigation
- **Email Integration** - Automated quote sending and follow-ups
- **Mobile PWA** - Full progressive web app with offline support
- **Multi-Tier Subscriptions** - Free, Pro, and Max AI tiers
- **White-Label Support** - Custom branding for Business tier

### User Roles & Permissions
- **Free Tier** - Basic quote creation (10 AI assists/month).
- **Pro Tier** - Advanced features (100 AI assists/month).
- **Max Tier** - Unlimited AI (Unlimited AI assists) + White Labeling.
- **Admin** - Full system access for testing and management.

---

## 🏗️ Architecture

### System Design Pattern
**Hybrid Architecture**: Client-side first with cloud sync.

### Smart Proposal Engine (✅ New v2.2)
The proposal system uses a **JSON-driven architecture** where the entire proposal (content, styling, logic) is defined by a single portable `ProposalData` object.

**Core Components:**
1.  **Data Layer (`ProposalData`)**: A schema defining sections (Hero, Line Items, Pricing, Legal).
2.  **Transformation Layer**: Converts legacy SQL `Quote` objects into `ProposalData` on the fly.
3.  **Viewer Engine**: Renders the JSON into an interactive React microsite.
4.  **Editor Engine**: A split-screen builder for real-time manipulation of the JSON structure.

### Data Flow Architecture

**Create Quote Flow:**
```
User Input → Validation → Local State → Memory Cache → 
IndexedDB (primary) → Sync Queue → Supabase DB → 
AI Enhancement (Optional) → Email Delivery (Optional) → 
Success Response
```

**Offline-First Strategy:**
1. All operations work offline (IndexedDB primary).
2. Sync queue buffers changes when offline.
3. Automatic sync when connection restored.
4. Conflict resolution with "last write wins".

---

## 💻 Technology Stack

### Frontend Framework
- **React 18.3** - UI library with hooks and concurrent features.
- **TypeScript 5.6** - Type-safe JavaScript.
- **Vite 6.0** - Fast build tool and dev server.
- **React Router 7** - Client-side routing.

### UI Components
- **Shadcn/UI** - Accessible component library.
- **Tailwind CSS 3.4** - Utility-first CSS framework.
- **Lucide React** - Icon library.
- **Sonner** - Toast notifications.

### Client-Side Storage (Phase 1 & 2 Complete)
- **IndexedDB** - Primary storage (50MB+, async, indexed).
- **Workbox** - Service Worker caching strategies (CacheFirst, NetworkFirst).
- **Memory Cache** - Fast in-memory memoization layer.

---

## 📁 File Structure

### Core Directories

```
quote-it-ai/
├── src/
│   ├── components/
│   │   ├── proposal/      # ✅ Smart Proposal System
│   │   │   ├── viewer/    # Client-facing microsite components
│   │   │   │   ├── HeroSection.tsx
│   │   │   │   ├── LineItemSection.tsx
│   │   │   │   ├── PricingSection.tsx
│   │   │   │   └── ProposalViewer.tsx
│   │   │   └── editor/    # Admin builder interface
│   │   │       ├── ProposalBuilder.tsx
│   │   │       └── ProposalEditorLayout.tsx
│   │   ├── ui/            # Shadcn/UI components
│   │   └── ...
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── ProposalContext.tsx # ✅ Proposal state management
│   ├── lib/
│   │   ├── proposal-transformation.ts # ✅ Legacy -> New adapter
│   │   ├── indexed-db.ts  # IndexedDB wrapper
│   │   └── ...
│   ├── pages/
│   │   ├── ProposalEditor.tsx # ✅ New Editor Page
│   │   ├── PublicQuoteView.tsx # ✅ Updated Public View
│   │   └── ...
```

---

## 🔐 Authentication & Security

- **Provider**: Supabase Auth.
- **Row-Level Security (RLS)**: All database tables enforce user isolation.
- **Encryption**: AES-GCM for sensitive local data.

---

## ⚡ Performance & Optimization

### Caching Strategy
1.  **Memory Cache**: Instant access (L1).
2.  **IndexedDB**: Persistent local storage (L2).
3.  **Service Worker**: Static asset & API caching (L3).
4.  **Supabase**: Cloud source of truth.

### Performance Metrics (Current)
- **LCP**: ~1.2s ✅
- **TTI**: ~2.8s ✅
- **IndexedDB Query**: 5-10ms ✅
- **Offline Support**: Full Read/Write ✅

---

## 🗺️ Roadmap

### ✅ Completed (Week 1 - November 17, 2025)
- ✅ Storage cache layer.
- ✅ Optimization of sync manager.
- ✅ Comprehensive test suites.

### ✅ Completed (Week 2, Day 3 - December 3, 2025)
- ✅ **Minimum Quantity Feature (100% Complete)**
  - ✅ Database migration adds min_quantity column to items table
  - ✅ TypeScript types updated with minQuantity field
  - ✅ ItemForm component includes minQuantity input
  - ✅ Items page handles minQuantity in CRUD operations
  - ✅ NewQuote page uses item.minQuantity when adding items
  - ✅ FullQuoteGenerationAI includes min_quantity in catalog
  - ✅ AI backend system prompt includes quantity rules
  - ✅ CSV import/export includes minQuantity field
  - ✅ CSV template generation includes 'Min Quantity' column
  - ✅ Sample CSV data includes minQuantity values
  - ✅ All tests passing (38/38 tests ✅)

- ✅ **Secure Interactive Proposal Viewer (100% Complete)**
  - ✅ OTP email verification wall (OTPSecurityWall.tsx)
  - ✅ Interactive action bar with Comment/Accept/Reject (ProposalActionBar.tsx)
  - ✅ Swiper integration with flip/cube animations (ProposalViewer.tsx)
  - ✅ Complete PublicQuoteView integration
  - ✅ Database tables (proposal_access_codes, proposal_comments)
  - ✅ Edge Functions (generate-access-code, verify-access-code)
  - ✅ Session management (24-hour expiry)
  - ✅ Mobile-optimized swipe gestures
  - ✅ Theme support (Modern Corporate, Creative Studio, Minimalist)
  - ✅ Responsive controls and keyboard navigation

- ✅ **Settings Page Refactoring (100% Complete)**
  - ✅ Removed deprecated ProposalTemplateSection component
  - ✅ Updated Proposal Settings to document new secure proposal features
  - ✅ Fixed compilation errors
  - ✅ Maintained all functional settings sections
  - ✅ Cleaned up App.tsx (removed ProposalEditor route)

### ✅ Completed (Week 2, Day 1-2 - November 24, 2025)
- ✅ **IndexedDB Foundation**: Full implementation and migration.
- ✅ **Advanced Caching**: Service Worker with Workbox strategies.
- ✅ **Integration Testing**: 100% test pass rate (38 tests).
- ✅ **Data Migration**: Two-phase localStorage → IndexedDB → Supabase.
- ✅ **User Isolation**: Proper data separation by userId.

### ✅ Completed (Week 2 - Day 2 - December 2, 2025)
- ✅ **Public Quote View Fix**: Onboarding wizard now properly skips public pages.
- ✅ **CSP Update**: Allow WebSocket connections for development.
- ✅ **Bug Fixes**: 
  - Fixed onboarding wizard appearing on public pages.
  - Fixed CSP blocking Vite dev server WebSocket.
  - Fixed customer loading issues with proper dependency management.
- ✅ **Documentation**: Complete Master System Reference update.

### 🔄 In Progress (Week 2 - Phase 3: Performance & UX - December 2-6, 2025)

#### 📋 Day 3: Service Worker Foundation (December 3, 2025)
- ⬜ **Service Worker Architecture**: Refactor with Workbox-based lifecycle.
- ⬜ **Cache Warmup System**: Pre-cache critical assets on install.
- ⬜ **Cache Management**: Implement quota management and expiration policies.

#### 📋 Day 4: Performance & UX Polish (December 4, 2025)
- ⬜ **Performance Monitoring**: Core Web Vitals tracking dashboard.
- ⬜ **Optimistic UI**: Instant feedback for all CRUD operations.
- ⬜ **Mobile UX**: Pull-to-refresh, swipe gestures, haptic feedback.
- ⬜ **Advanced Error Recovery**: Retry with exponential backoff.

### Q1 2026 - Major Features
- ⬜ QuickBooks Integration.
- ⬜ Team collaboration features.
- ⬜ Mobile app submission (iOS/Android).

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Public Quote View Not Loading
**Symptom:** Public quote view shows authentication errors or onboarding wizard

**Cause:** Onboarding wizard running on public pages

**Fix:** ✅ **RESOLVED (December 2, 2025)**
- OnboardingWizard now detects public routes before any async operations
- Early return prevents rendering on public pages
- CSP updated to allow dev server WebSocket connections

**Resolution Status:** ✅ Fixed in v2.2

#### 2. Customers Not Showing
**Symptom:** Customer list appears empty after loading

**Cause:** Complex dependency chain in customer loading logic

**Fix:** ✅ **RESOLVED (December 2, 2025)**
- Simplified `loadCustomers` dependency array
- Added `dataKey` increment AFTER data loads to force re-renders
- Removed circular dependencies with `customers.length`

**Resolution Status:** ✅ Fixed in v2.2

#### 3. Onboarding Wizard Reappearing
**Symptom:** Onboarding wizard shows after completion

**Cause:** Completion flags not persisting or verification failing

**Fix:** ✅ **RESOLVED (December 2, 2025)**
- Set completion flags FIRST before any async operations
- Removed blocking verification logic
- Always close wizard after first completion attempt

**Resolution Status:** ✅ Fixed in v2.2

---

## 📝 Document Maintenance

**Version:** 2.2
**Last Updated:** December 2, 2025, 21:57 UTC
**Next Review:** December 3, 2025
**Status:** ✅ Phase 1 & 2 Complete | ✅ Public View Fixed | 🔄 Phase 3 Starting

---

**Recent Changes (December 2, 2025):**
- ✅ Fixed public quote view authentication issues
- ✅ Updated CSP to allow dev server WebSocket connections
- ✅ Fixed customer loading dependency issues
- ✅ Completed Phase 2 integration testing
- ✅ All 38 tests passing

---

*This document is the single source of truth for Quote.it AI system architecture and should be referenced for all development decisions.*