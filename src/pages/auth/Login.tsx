import { LoginForm } from "@/components/auth/LoginForm";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

export default function LoginPage() {
  const location = useLocation();

  useEffect(() => {
    // Show verification success message if it exists
    const message = location.state?.message;
    if (message) {
      toast({
        title: "Success",
        description: message,
      });
    }
  }, [location.state]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access your account
          </p>
        </div>
        
        <LoginForm />
        
        <div className="text-center space-y-4">
          <div className="text-sm">
            <Link to="/auth/reset-password" className="text-primary hover:underline">
              Forgot your password?
            </Link>
          </div>
          
          <div className="text-sm">
            Don't have an account?{" "}
            <Link to="/auth/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
          
          <div className="pt-4">
            <Button variant="outline" asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 