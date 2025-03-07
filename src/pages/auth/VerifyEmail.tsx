import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const verifyEmail = async () => {
      setIsVerifying(true);
      try {
        // Get token from the URL
        const token = searchParams.get("token");
        const type = searchParams.get("type");
        
        if (!token || type !== "email") {
          setError("Invalid verification link. Please request a new one.");
          return;
        }

        // Verify the OTP
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: "email",
        });

        if (error) {
          setError(error.message);
          return;
        }

        setIsVerified(true);
        toast({
          title: "Email verified",
          description: "Your email has been successfully verified!",
        });

        // Wait a moment before redirecting
        await new Promise(resolve => setTimeout(resolve, 2000));

        // If user is already logged in, redirect to dashboard
        if (user) {
          navigate("/");
        } else {
          // Otherwise redirect to login
          navigate("/auth/login", {
            state: { message: "Email verified successfully. Please sign in." }
          });
        }
      } catch (err) {
        console.error("Verification error:", err);
        setError("An unexpected error occurred during verification.");
      } finally {
        setIsVerifying(false);
      }
    };

    if (!isVerified && !error) {
      verifyEmail();
    }
  }, [searchParams, navigate, user, isVerified]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Verification Error</CardTitle>
            <CardDescription>
              There was a problem verifying your email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-destructive">
              <p>{error}</p>
              <p className="mt-2">
                Please try again or request a new verification link.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild variant="outline">
              <Link to="/auth/login">Return to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Email Verification</CardTitle>
          <CardDescription>
            {isVerifying
              ? "Verifying your email..."
              : "Your email has been verified successfully."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center">
            {isVerifying 
              ? "Please wait while we verify your email..."
              : "You will be redirected automatically in a moment."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 