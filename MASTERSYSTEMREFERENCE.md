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
- **Smart Proposal System (NEW)** - Interactive, JSON-driven proposals with digital signing and print-perfect layout.
- **AI-Powered Quote Generation** - Intelligent quote creation with context awareness.
- **Customer Management** - Comprehensive CRM for client relationships.
- **Item Catalog** - Organized product/service inventory with pricing.
- **Mobile PWA** - Full progressive web app with offline support.
- **Multi-Tier Subscriptions** - Free, Pro, and Max AI tiers.
- **White-Label Support** - Custom branding for Business tier.

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

### ✅ Completed (Week 2 - Phase 1 & 2)
- ✅ **IndexedDB Foundation**: Full implementation and migration.
- ✅ **Advanced Caching**: Service Worker with Workbox strategies.
- ✅ **White-Label Features**: Max AI branding implementation.
- ✅ **Test Coverage**: 100% pass rate (207 tests).

### 🔄 In Progress (Week 2 - Phase 3: UX & Polish)

#### ✅ Day 4: Smart Proposal System (Feature Injection)
- ✅ **Architecture**: JSON-driven proposal schema (`src/types/proposal.ts`).
- ✅ **Viewer**: Interactive client microsite with toggles and print styles.
- ✅ **Editor**: Split-screen admin interface with real-time preview.
- ✅ **Integration**: Seamless transformation of legacy quotes to new format.
- ✅ **Public View**: Replaced static view with new `ProposalViewer`.

#### 📋 Day 5: Performance & Mobile Polish (Upcoming)
- ⬜ **Optimistic UI**: Instant feedback for all CRUD operations.
- ⬜ **Mobile Gestures**: Pull-to-refresh, swipe actions.
- ⬜ **Advanced Error Recovery**: Exponential backoff strategies.

### Q1 2026 - Major Features
- ⬜ QuickBooks Integration.
- ⬜ Team collaboration features.
- ⬜ Mobile app submission (iOS/Android).

---

## 📝 Document Maintenance

**Last Updated:** December 2, 2025
**Next Review:** December 3, 2025
**Status:** ✅ Phase 1 & 2 Complete | ✅ Proposal System Integrated | 🔄 Phase 3 Ongoing

---
