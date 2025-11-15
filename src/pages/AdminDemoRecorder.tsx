import { DemoRecorder } from "@/components/DemoRecorder";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function AdminDemoRecorder() {
  const { user, userRole, loading } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="container mx-auto py-12 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // For development/testing purposes, allow all authenticated users to access the demo recorder
  // In production, you might want to restrict this to admins only:
  // const isAdmin = userRole === 'admin';
  // if (!isAdmin) { return <Alert variant="destructive">...</Alert>; }
  
  // For now, any authenticated user can access the demo recorder
  return <DemoRecorder />;
}
