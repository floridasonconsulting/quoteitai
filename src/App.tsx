import { Suspense, lazy, useEffect } from "react";
// Toaster is unused, Sonner is used for toasts
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "./hooks/useNotifications";
import { Layout } from "@/components/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoadingFallback } from "./components/LoadingFallback";
import { useGlobalKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { useCacheWarmup } from "@/hooks/useCacheWarmup";

import AuthPage from "./pages/Auth";
import NotFound from "./pages/NotFound";
import PublicQuoteView from "./pages/PublicQuoteView";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Landing from "./pages/Landing";
import Diagnostics from "./pages/Diagnostics";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Quotes = lazy(() => import("./pages/Quotes"));
const NewQuote = lazy(() => import("./pages/NewQuote"));
const QuoteDetail = lazy(() => import("./pages/QuoteDetail"));
const Customers = lazy(() => import("./pages/Customers"));
const Items = lazy(() => import("./pages/Items"));
const Settings = lazy(() => import("./pages/Settings"));
const Help = lazy(() => import("./pages/Help"));
const Subscription = lazy(() => import("./pages/Subscription"));
const QuotePreview = lazy(() => import("./pages/QuotePreview"));

const queryClient = new QueryClient();

function AppRoutes() {
  // Initialize global keyboard shortcuts
  useGlobalKeyboardShortcuts();

  // Warm up cache with fresh data
  useCacheWarmup();

  useEffect(() => {
    // Log app initialization
    console.log('Quote.it AI initialized');
  }, []);

  const location = useLocation();
  const { user, loading } = useAuth();
  useNotifications();

  return (
    <>
      <Routes>
        {/* Root route - show Landing if not authenticated, redirect to Dashboard if authenticated */}
        <Route
          path="/"
          element={
            loading ? (
              <LoadingFallback />
            ) : user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Landing />
            )
          }
        />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/quotes/public/:id" element={<PublicQuoteView />} />

        <Route element={<Layout />}>
          <Route path="/dashboard" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense></ProtectedRoute>} />
          <Route path="/quotes" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><Quotes /></Suspense></ProtectedRoute>} />
          <Route path="/quotes/new" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><NewQuote /></Suspense></ProtectedRoute>} />
          <Route path="/quotes/:id" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><QuoteDetail /></Suspense></ProtectedRoute>} />
          <Route path="/quotes/:id/preview" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><QuotePreview /></Suspense></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><Customers /></Suspense></ProtectedRoute>} />
          <Route path="/items" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><Items /></Suspense></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><Settings /></Suspense></ProtectedRoute>} />
          <Route path="/help" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><Help /></Suspense></ProtectedRoute>} />
          <Route path="/diagnostics" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><Diagnostics /></Suspense></ProtectedRoute>} />
          <Route path="/subscription" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><Subscription /></Suspense></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Global Components */}
      <OnboardingWizard />
      <MobileBottomNav />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <ErrorBoundary>
            <Sonner />
            <AppRoutes />
          </ErrorBoundary>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
