import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Reset Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email to receive a password reset link
          </p>
        </div>
        
        <ResetPasswordForm />
        
        <div className="text-center space-y-4">
          <div className="text-sm">
            Remember your password?{" "}
            <Link to="/auth/login" className="text-primary hover:underline">
              Back to Login
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