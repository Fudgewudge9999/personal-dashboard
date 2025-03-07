import { SignUpForm } from "@/components/auth/SignUpForm";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create an Account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign up to get started with our application
          </p>
        </div>
        
        <SignUpForm />
        
        <div className="text-center space-y-4">
          <div className="text-sm">
            Already have an account?{" "}
            <Link to="/auth/login" className="text-primary hover:underline">
              Sign in
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