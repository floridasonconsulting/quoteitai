import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { useNotifications } from "./hooks/useNotifications";
import { Layout } from "@/components/Layout";

const queryClient = new QueryClient();

function AppContent() {
  const location = useLocation();
  useNotifications();

  // Pages that should NOT have the Layout (public pages)
  const publicPages = ['/', '/auth', '/terms', '/privacy', '/quotes/public'];
  const isPublicPage = publicPages.some(page => location.pathname.startsWith(page));

  // If it's a public page, render without Layout
  if (isPublicPage) {
    return <Outlet />;
  }

  // All other pages (authenticated) should have Layout
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
