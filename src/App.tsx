import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useNotifications } from "@/hooks/useNotifications";
import Dashboard from "./pages/Dashboard";
import Quotes from "./pages/Quotes";
import QuoteDetail from "./pages/QuoteDetail";
import NewQuote from "./pages/NewQuote";
import Customers from "./pages/Customers";
import Items from "./pages/Items";
import Settings from "./pages/Settings";
import Subscription from "./pages/Subscription";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient();

function AppContent() {
  const notifications = useNotifications();
  
  useEffect(() => {
    // Register service worker for notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js');
    }
  }, []);
  
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
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
