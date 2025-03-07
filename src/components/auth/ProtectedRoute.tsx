import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  redirectTo = "/auth/login" 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log('ProtectedRoute state:', { 
      isAuthenticated, 
      isLoading, 
      path: location.pathname 
    });
  }, [isAuthenticated, isLoading, location.pathname]);

  // Show loading state while checking authentication
  if (isLoading) {
    console.log('ProtectedRoute: Still loading auth state...');
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated, preserving the intended destination
  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, redirecting to', redirectTo);
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Render children if authenticated
  console.log('ProtectedRoute: User authenticated, rendering protected content');
  return <>{children}</>;
} 