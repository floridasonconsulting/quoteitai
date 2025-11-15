import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { useNotifications } from "./hooks/useNotifications";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoadingFallback } from "./components/LoadingFallback";

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
const AdminDemoRecorder = lazy(() => import("./pages/AdminDemoRecorder"));

const queryClient = new QueryClient();

function AppRoutes() {
  const location = useLocation();
  useNotifications();

  const publicPages = ['/', '/auth', '/terms', '/privacy'];
  const isPublicPage = publicPages.includes(location.pathname) || location.pathname.startsWith('/quotes/public');

  return (
    &lt;Routes&gt;
      &lt;Route path="/" element={isPublicPage ? &lt;Landing /&gt; : &lt;Layout&gt;&lt;Dashboard /&gt;&lt;/Layout&gt;} /&gt;
      &lt;Route path="/auth" element={&lt;AuthPage /&gt;} /&gt;
      &lt;Route path="/terms" element={&lt;TermsOfService /&gt;} /&gt;
      &lt;Route path="/privacy" element={&lt;PrivacyPolicy /&gt;} /&gt;
      &lt;Route path="/quotes/public/:id" element={&lt;PublicQuoteView /&gt;} /&gt;
      
      &lt;Route element={&lt;Layout /&gt;}&gt;
        &lt;Route path="/dashboard" element={&lt;ProtectedRoute&gt;&lt;Suspense fallback={&lt;LoadingFallback /&gt;}&gt;&lt;Dashboard /&gt;&lt;/Suspense&gt;&lt;/ProtectedRoute&gt;} /&gt;
        &lt;Route path="/quotes" element={&lt;ProtectedRoute&gt;&lt;Suspense fallback={&lt;LoadingFallback /&gt;}&gt;&lt;Quotes /&gt;&lt;/Suspense&gt;&lt;/ProtectedRoute&gt;} /&gt;
        &lt;Route path="/quotes/new" element={&lt;ProtectedRoute&gt;&lt;Suspense fallback={&lt;LoadingFallback /&gt;}&gt;&lt;NewQuote /&gt;&lt;/Suspense&gt;&lt;/ProtectedRoute&gt;} /&gt;
        &lt;Route path="/quotes/:id" element={&lt;ProtectedRoute&gt;&lt;Suspense fallback={&lt;LoadingFallback /&gt;}&gt;&lt;QuoteDetail /&gt;&lt;/Suspense&gt;&lt;/ProtectedRoute&gt;} /&gt;
        &lt;Route path="/customers" element={&lt;ProtectedRoute&gt;&lt;Suspense fallback={&lt;LoadingFallback /&gt;}&gt;&lt;Customers /&gt;&lt;/Suspense&gt;&lt;/ProtectedRoute&gt;} /&gt;
        &lt;Route path="/items" element={&lt;ProtectedRoute&gt;&lt;Suspense fallback={&lt;LoadingFallback /&gt;}&gt;&lt;Items /&gt;&lt;/Suspense&gt;&lt;/ProtectedRoute&gt;} /&gt;
        &lt;Route path="/settings" element={&lt;ProtectedRoute&gt;&lt;Suspense fallback={&lt;LoadingFallback /&gt;}&gt;&lt;Settings /&gt;&lt;/Suspense&gt;&lt;/ProtectedRoute&gt;} /&gt;
        &lt;Route path="/help" element={&lt;ProtectedRoute&gt;&lt;Suspense fallback={&lt;LoadingFallback /&gt;}&gt;&lt;Help /&gt;&lt;/Suspense&gt;&lt;/ProtectedRoute&gt;} /&gt;
        &lt;Route path="/diagnostics" element={&lt;ProtectedRoute&gt;&lt;Suspense fallback={&lt;LoadingFallback /&gt;}&gt;&lt;Diagnostics /&gt;&lt;/Suspense&gt;&lt;/ProtectedRoute&gt;} /&gt;
        &lt;Route path="/subscription" element={&lt;ProtectedRoute&gt;&lt;Suspense fallback={&lt;LoadingFallback /&gt;}&gt;&lt;Subscription /&gt;&lt;/Suspense&gt;&lt;/ProtectedRoute&gt;} /&gt;
        &lt;Route path="/admin/demo-recorder" element={&lt;ProtectedRoute&gt;&lt;Suspense fallback={&lt;LoadingFallback /&gt;}&gt;&lt;AdminDemoRecorder /&gt;&lt;/Suspense&gt;&lt;/ProtectedRoute&gt;} /&gt;
      &lt;/Route&gt;
      
      &lt;Route path="*" element={&lt;NotFound /&gt;} /&gt;
    &lt;/Routes&gt;
  );
}

const App = () => (
  &lt;QueryClientProvider client={queryClient}&gt;
    &lt;ThemeProvider&gt;
      &lt;TooltipProvider&gt;
        &lt;AuthProvider&gt;
          &lt;Toaster /&gt;
          &lt;Sonner /&gt;
          &lt;AppRoutes /&gt;
        &lt;/AuthProvider&gt;
      &lt;/TooltipProvider&gt;
    &lt;/ThemeProvider&gt;
  &lt;/QueryClientProvider&gt;
);

export default App;
