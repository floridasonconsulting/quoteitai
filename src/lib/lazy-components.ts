// Lazy loading configuration for code splitting and performance optimization
import { lazy } from "react";

// Heavy components that can be lazy loaded
export const LazyDashboard = lazy(() => import("@/pages/Dashboard"));
export const LazyQuotes = lazy(() => import("@/pages/Quotes"));
export const LazyNewQuote = lazy(() => import("@/pages/NewQuote"));
export const LazyQuoteDetail = lazy(() => import("@/pages/QuoteDetail"));
export const LazyCustomers = lazy(() => import("@/pages/Customers"));
export const LazyItems = lazy(() => import("@/pages/Items"));
export const LazySettings = lazy(() => import("@/pages/Settings"));
export const LazyHelp = lazy(() => import("@/pages/Help"));
export const LazyDiagnostics = lazy(() => import("@/pages/Diagnostics"));
export const LazySubscription = lazy(() => import("@/pages/Subscription"));

// Heavy UI components
export const LazyDemoRecorder = lazy(() => import("@/components/DemoRecorder"));
export const LazyAIUpgradeDialog = lazy(() => import("@/components/AIUpgradeDialog"));
export const LazyFollowUpDialog = lazy(() => import("@/components/FollowUpDialog"));
export const LazySendQuoteDialog = lazy(() => import("@/components/SendQuoteDialog"));
