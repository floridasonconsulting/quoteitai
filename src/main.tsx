import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import AuthPage from "./pages/Auth";
import {
  LazyDashboard,
  LazyQuotes,
  LazyNewQuote,
  LazyQuoteDetail,
  LazyCustomers,
  LazyItems,
  LazySettings,
  LazyHelp,
  LazyDiagnostics,
  LazySubscription
} from "./lib/lazy-components";
import NotFound from "./pages/NotFound";
import PublicQuoteView from "./pages/PublicQuoteView";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Landing from "./pages/Landing";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Landing />,
      },
      {
        path: "/dashboard",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div>Loading...</div>}>
              <LazyDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/quotes",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div>Loading...</div>}>
              <LazyQuotes />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/quotes/new",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div>Loading...</div>}>
              <LazyNewQuote />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/quotes/:id",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div>Loading...</div>}>
              <LazyQuoteDetail />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/customers",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div>Loading...</div>}>
              <LazyCustomers />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/items",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div>Loading...</div>}>
              <LazyItems />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div>Loading...</div>}>
              <LazySettings />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/help",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div>Loading...</div>}>
              <LazyHelp />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/diagnostics",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div>Loading...</div>}>
              <LazyDiagnostics />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/subscription",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div>Loading...</div>}>
              <LazySubscription />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      { path: "auth", element: <AuthPage /> },
      { path: "terms", element: <TermsOfService /> },
      { path: "privacy", element: <PrivacyPolicy /> },
    ],
  },
  {
    path: "/quotes/public/:id",
    element: <PublicQuoteView />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
