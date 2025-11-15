
import { DemoRecorder } from "@/components/DemoRecorder";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function AdminDemoRecorder() {
  const { user } = useAuth();

  // Check if user is admin
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // For now, we'll use a simple check. In production, you'd check against a role/permission system
  // You can update this to check user.role === 'admin' if you have roles implemented
  const isAdmin = user.email?.includes('admin') || user.email === 'demo@example.com';

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            This page is only accessible to administrators. Please contact your system administrator if you need access.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <DemoRecorder />;
}
