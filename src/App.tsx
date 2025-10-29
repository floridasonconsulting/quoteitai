import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Layout } from "@/components/Layout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useNotifications } from "@/hooks/useNotifications";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Diagnostics from "./pages/Diagnostics";
import Quotes from "./pages/Quotes";
import QuoteDetail from "./pages/QuoteDetail";
import PublicQuoteView from "./pages/PublicQuoteView";
import NewQuote from "./pages/NewQuote";
import Customers from "./pages/Customers";
import Items from "./pages/Items";
import Settings from "./pages/Settings";
import Subscription from "./pages/Subscription";
import Help from "./pages/Help";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function AppContent() {
  const notifications = useNotifications();
  const { user, loading } = useAuth();
  
  // Show proper loading spinner during auth initialization
  // Only show Landing page when we know user is not authenticated
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={user !== null ? <Navigate to="/dashboard" /> : <Landing />} />
      <Route path="/help" element={<Help />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <Auth />} />
      <Route path="/quote/view/:shareToken" element={<PublicQuoteView />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <ErrorBoundary>
              <Dashboard />
            </ErrorBoundary>
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/diagnostics" element={
        <ProtectedRoute>
          <Layout>
            <Diagnostics />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/quotes" element={
        <ProtectedRoute>
          <Layout>
            <Quotes />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/quotes/new" element={
        <ProtectedRoute>
          <Layout>
            <NewQuote />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/quotes/:id" element={
        <ProtectedRoute>
          <Layout>
            <QuoteDetail />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/quotes/:id/edit" element={
        <ProtectedRoute>
          <Layout>
            <NewQuote />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/customers" element={
        <ProtectedRoute>
          <Layout>
            <Customers />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/items" element={
        <ProtectedRoute>
          <Layout>
            <Items />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout>
            <Settings />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/subscription" element={
        <ProtectedRoute>
          <Layout>
            <Subscription />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/subscription-success" element={
        <ProtectedRoute>
          <Layout>
            <Subscription />
          </Layout>
        </ProtectedRoute>
      } />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
