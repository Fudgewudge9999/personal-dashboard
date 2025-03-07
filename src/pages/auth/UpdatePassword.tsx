import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

export default function UpdatePasswordPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the token exists in URL
    const token = searchParams.get("token");
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset link.");
      return;
    }
    
    setIsTokenValid(true);
  }, [searchParams]);
  
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get the token from URL
      const token = searchParams.get("token");
      
      if (!token) {
        setError("Invalid reset token. Please request a new password reset link.");
        return;
      }
      
      // Verify token type (should be recovery)
      const type = searchParams.get("type");
      if (type !== "recovery") {
        setError("Invalid token type. Please request a new password reset link.");
        return;
      }
      
      // Update password with the token
      const { error } = await supabase.auth.updateUser({
        password: password,
      });
      
      if (error) {
        toast({
          title: "Error updating password",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated. You can now login with your new password.",
      });
      
      // Redirect to login page after successful password reset
      setTimeout(() => {
        navigate("/auth/login");
      }, 2000);
      
    } catch (err) {
      console.error("Password reset error:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        {!isTokenValid ? (
          <CardContent>
            <div className="text-center text-destructive">
              <p>{error}</p>
              <Button 
                className="mt-4" 
                variant="outline" 
                onClick={() => navigate("/auth/reset-password")}
              >
                Request New Reset Link
              </Button>
            </div>
          </CardContent>
        ) : (
          <form onSubmit={handlePasswordReset}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  New Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm New Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Updating Password..." : "Reset Password"}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
} 