# 🚀 Quote-it AI - Smart Quote Management System

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 📖 Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
- [Mobile Apps](#mobile-apps)
- [Project Structure](#project-structure)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Support](#support)

## 🎯 Overview

Quote-it AI is a modern, AI-powered quote management system designed for businesses of all sizes. Create professional quotes in seconds, track their lifecycle, and never miss a follow-up opportunity with intelligent aging alerts and cross-device synchronization.

**Project URL**: https://lovable.dev/projects/84bc8b24-61a5-4785-9ea1-c7a592fbd3fd

## ✨ Key Features

### 💼 Quote Management
- **AI-Powered Generation**: Auto-generate quote titles, descriptions, and terms & conditions
- **Multi-Status Tracking**: Track quotes through Draft, Sent, Accepted, and Declined stages
- **Quote Aging Analysis**: Visual indicators (Fresh/Warm/Aging/Stale) show quote freshness
- **Professional PDF Export**: Generate branded, polished quote documents with company information
- **Email Integration**: Send professional HTML emails with editable templates, download buttons, and automated follow-ups

### 📊 Business Intelligence
- **Dashboard Analytics**: Track revenue, win rates, pending value, and active quotes
- **Customer Insights**: Complete contact management with import/export capabilities
- **Item Catalog**: Pre-configured products/services library for lightning-fast quote creation
- **Performance Metrics**: Acceptance rates, average quote value, and aging distribution

### 🚀 Productivity Features
- **Cross-Device Sync**: Work seamlessly across desktop, tablet, and mobile with real-time cloud sync
- **Offline Capable**: Full offline functionality with automatic sync when reconnected
- **Mobile Apps**: Native Android & iOS support via Capacitor 7.4.3
- **Real-time Updates**: Instant data synchronization across all your devices

### 🤖 AI Features (Max AI Plan)
- Smart quote title suggestions
- Automated terms & conditions generation
- Context-aware item recommendations
- Intelligent pricing optimization
- Customer insights and analytics
- Follow-up timing suggestions

## 🛠️ Tech Stack

### Frontend
- **React 18** + **TypeScript** - Modern UI development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** + **shadcn/ui** - Beautiful, responsive design system
- **React Router DOM** - Client-side routing
- **TanStack Query** - Server state management
- **date-fns** - Date manipulation
- **html2canvas** + **jspdf** - PDF generation
- **Lucide React** - Icon system

### Backend (Lovable Cloud)
- **Supabase** - PostgreSQL database with real-time capabilities
- **Row Level Security (RLS)** - Database-level access control
- **Edge Functions** - Serverless backend logic
- **Supabase Auth** - User authentication
- **Supabase Storage** - File storage (logos, exports)

### Mobile
- **Capacitor 7.4.3** - Cross-platform mobile framework
- **Android** - Native Android app support
- **iOS** - Native iOS app support

### AI Integration
- **Lovable AI Gateway** - Unified AI API access
- **Google Gemini 2.5** - AI quote generation and suggestions
- **OpenAI GPT-5** - Advanced AI capabilities

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** and **npm**
- **Git**
- (Optional) **Android Studio** for Android development
- (Optional) **Xcode** (macOS) for iOS development

### Installation

1. **Clone the repository**
```bash
git clone <YOUR_GIT_URL>
cd quote-it-ai
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**

The project uses Lovable Cloud, which automatically configures environment variables. The `.env` file is pre-configured with:

```env
VITE_SUPABASE_URL=<auto-configured>
VITE_SUPABASE_PUBLISHABLE_KEY=<auto-configured>
VITE_SUPABASE_PROJECT_ID=<auto-configured>
```

4. **Start development server**
```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## 📚 Usage Guide

### Creating Your First Quote

1. **Sign up** for an account at `/auth`
2. **Configure company settings** in Settings (add logo, business info, terms)
3. **Add customers** in the Customers section
4. **Create items** in your catalog (Items section)
5. **Create a quote**:
   - Click "New Quote" from Dashboard or Quotes page
   - Select a customer
   - Add items from catalog or create custom items
   - Use AI to generate professional title and terms (Pro/Max AI plans)
   - Save as draft or mark as sent
6. **Download PDF** from the quote detail page

### Understanding Quote Aging

- 🟢 **Fresh (0-7 days)**: Just sent, monitor for response
- 🟡 **Warm (8-14 days)**: Consider a gentle follow-up
- 🟠 **Aging (15-30 days)**: Follow up recommended
- 🔴 **Stale (30+ days)**: Urgent follow-up or mark as declined

### Using AI Features

**AI Quote Titles** (Pro/Max AI):
- Click the AI sparkle button next to the title field
- AI analyzes customer and items to suggest relevant titles

**AI Terms & Conditions** (Max AI):
- Click "Generate" in the terms section
- AI creates customized payment terms based on quote details

**AI Limits**:
- Free: Limited AI features
- Pro: 50 AI requests/month
- Max AI: Unlimited requests

## 📱 Mobile Apps

Quote-it AI supports native mobile apps for Android and iOS using Capacitor.

### Quick Start
See [MOBILE_DEPLOYMENT.md](./MOBILE_DEPLOYMENT.md) for complete mobile deployment guide.

### Building Mobile Apps

1. **Add platforms**
```bash
npx cap add android  # For Android
npx cap add ios      # For iOS (macOS only)
```

2. **Build the web app**
```bash
npm run build
```

3. **Sync to native platforms**
```bash
npx cap sync
```

4. **Run on device/emulator**
```bash
npx cap run android  # Android
npx cap run ios      # iOS (macOS only)
```

### Mobile Features
- Full offline functionality with local storage
- Automatic cloud sync when online
- Native device capabilities (camera, file access)
- Push notifications support (configurable)
- Biometric authentication support

## 🏗️ Project Structure

```
quote-it-ai/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── Layout.tsx      # App layout wrapper
│   │   ├── ProtectedRoute.tsx
│   │   └── ThemeProvider.tsx
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useAI.tsx       # AI integration
│   │   ├── useSyncManager.ts
│   │   └── useNotifications.tsx
│   ├── integrations/       # External services
│   │   └── supabase/
│   │       ├── client.ts   # Supabase client
│   │       └── types.ts    # Auto-generated types
│   ├── lib/                # Utility functions
│   │   ├── db-service.ts   # Database operations
│   │   ├── storage.ts      # Local storage
│   │   ├── csv-utils.ts    # CSV import/export
│   │   ├── quote-utils.ts  # Quote helpers
│   │   └── utils.ts        # General utilities
│   ├── pages/              # Route pages
│   │   ├── Landing.tsx     # Public landing page
│   │   ├── Auth.tsx        # Login/signup
│   │   ├── Dashboard.tsx   # Main dashboard
│   │   ├── Quotes.tsx      # Quote list
│   │   ├── NewQuote.tsx    # Create/edit quote
│   │   ├── QuoteDetail.tsx # Quote details
│   │   ├── Customers.tsx   # Customer management
│   │   ├── Items.tsx       # Item catalog
│   │   ├── Settings.tsx    # App settings
│   │   ├── Subscription.tsx # Billing
│   │   ├── Help.tsx        # Help center
│   │   └── NotFound.tsx
│   ├── types/              # TypeScript types
│   │   └── index.ts
│   ├── App.tsx             # Main app component
│   ├── index.css           # Global styles
│   └── main.tsx            # App entry point
├── supabase/
│   ├── functions/          # Edge functions
│   │   ├── ai-assist/      # AI integration
│   │   ├── check-subscription/
│   │   ├── create-checkout/
│   │   └── customer-portal/
│   ├── migrations/         # Database migrations
│   └── config.toml         # Supabase config
├── public/                 # Static assets
├── capacitor.config.ts     # Capacitor config
├── tailwind.config.ts      # Tailwind config
├── vite.config.ts          # Vite config
└── package.json
```

## 💻 Development

### Available Scripts

```bash
npm run dev          # Start dev server (port 8080)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage
```

### Database Migrations

The project uses Supabase migrations for database schema changes. Migrations are located in `supabase/migrations/` and are automatically applied.

Key tables:
- `profiles` - User profiles and subscription tiers
- `quotes` - Quote data with JSONB items
- `customers` - Customer contacts
- `items` - Product/service catalog
- `company_settings` - Business configuration
- `subscriptions` - Stripe subscription data
- `usage_tracking` - AI usage monitoring
- `ai_usage_log` - AI request logs

### Row Level Security (RLS)

All tables implement RLS policies ensuring users can only access their own data:
```sql
-- Example RLS policy
CREATE POLICY "Users can view their own quotes"
  ON quotes FOR SELECT
  USING (auth.uid() = user_id);
```

### 🎬 Demo Recording

The project includes an automated demo recording system for creating marketing materials:

**Access**: Navigate to `/demo-recorder` (requires authentication)

**Features**:
- Automated screenshot capture of complete quote workflow
- 14 predefined workflow steps covering all features
- Configurable timing and element highlighting
- Bulk frame download for post-processing
- Manual recording instructions included

**Quick Start**:
1. Navigate to `/demo-recorder`
2. Click "Prepare Sample Data"
3. Click "Start Recording"
4. Download captured frames
5. Convert to GIF using ezgif.com or ffmpeg

**Documentation**: See [DEMO_RECORDING_GUIDE.md](./DEMO_RECORDING_GUIDE.md) for complete instructions.

## 🌐 Deployment

### Web Deployment (Lovable)

1. **Publish via Lovable**
   - Click "Publish" in the Lovable editor
   - Your app is deployed instantly
   - Custom domains available on paid plans

2. **Manual Deployment**
```bash
npm run build
# Deploy the dist/ folder to your hosting provider
```

### Mobile App Deployment

See [MOBILE_DEPLOYMENT.md](./MOBILE_DEPLOYMENT.md) for:
- Building release APKs (Android)
- Publishing to Google Play Store
- Building for iOS App Store
- Code signing and certificates

## 📄 How to Edit

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/84bc8b24-61a5-4785-9ea1-c7a592fbd3fd) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow the existing code style
- Write meaningful commit messages
- Update documentation as needed
- Add tests for new features
- Ensure all tests pass before submitting

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Documentation
- **Help Center**: Visit `/help` in the app for comprehensive guides
- **Video Tutorials**: [YouTube Playlist](https://www.youtube.com/playlist?list=PLbVHz4urQBZkJiAWdG8HWoJTdgEysigIO)
- **API Docs**: [Lovable Documentation](https://docs.lovable.dev)

### Get Help
- **Email**: quoteitai@gmail.com
- **Discord**: [Lovable Community](https://discord.gg/lovable)
- **GitHub Issues**: Report bugs or request features

### Response Times
- **Free Plan**: 48-72 hours
- **Pro Plan**: 24 hours
- **Max AI Plan**: Priority support, <12 hours

## 🙏 Acknowledgments

Built with:
- [Lovable](https://lovable.dev) - AI-powered development platform
- [Supabase](https://supabase.com) - Backend infrastructure
- [shadcn/ui](https://ui.shadcn.com) - Beautiful UI components
- [Capacitor](https://capacitorjs.com) - Mobile app framework

## 📊 Roadmap

- [x] ✅ Email integration for quote delivery - **COMPLETED**
- [ ] Advanced analytics and reporting
- [ ] Multi-currency support
- [ ] Quote templates
- [ ] Team collaboration features
- [ ] Webhook integrations
- [ ] API for third-party integrations
- [ ] Email open tracking and analytics

---

**Made with ❤️ using [Lovable](https://lovable.dev)**

For more information, visit our [landing page](/) or [help center](/help).

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/84bc8b24-61a5-4785-9ea1-c7a592fbd3fd) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
