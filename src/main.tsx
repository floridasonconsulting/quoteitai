import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoadingFallback } from "./components/LoadingFallback";

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

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Quotes = lazy(() => import("./pages/Quotes"));
const Diagnostics = lazy(() => import("./pages/Diagnostics"));
const AdminDemoRecorder = lazy(() => import("./pages/AdminDemoRecorder"));

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
            <Suspense fallback={<LoadingFallback />}>
              <LazyDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/quotes",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <LazyQuotes />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/quotes/new",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <LazyNewQuote />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/quotes/:id",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <LazyQuoteDetail />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/customers",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <LazyCustomers />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/items",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <LazyItems />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <LazySettings />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/help",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <LazyHelp />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/diagnostics",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Diagnostics />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/demo-recorder",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <AdminDemoRecorder />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/subscription",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
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
    <RouterProvider router={router} />
  </React.StrictMode>
);
