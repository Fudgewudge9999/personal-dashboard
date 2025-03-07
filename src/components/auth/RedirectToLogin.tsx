import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function RedirectToLogin() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    console.log('RedirectToLogin state:', { isAuthenticated, isLoading });
    
    if (!isLoading && !isAuthenticated) {
      console.log('RedirectToLogin: Not authenticated, redirecting to login');
      navigate("/auth/login", { replace: true });
    } else if (!isLoading && isAuthenticated) {
      console.log('RedirectToLogin: User authenticated, redirecting to dashboard');
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading state while checking authentication
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p>Loading...</p>
      </div>
    </div>
  );
} 