import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the intended destination from location state or default to dashboard
  const from = location.state?.from?.pathname || "/";

  // Effect to handle navigation after authentication
  useEffect(() => {
    if (isAuthenticated && !isLoading && !isSubmitting) {
      console.log('LoginForm: User is authenticated, navigating to:', from);
      // Use a timeout to ensure state updates have propagated
      const timer = setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, isSubmitting, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isLoading) return;
    
    setIsSubmitting(true);
    console.log('Starting login attempt...');

    try {
      console.log('Calling signIn with email:', email);
      const { error, data } = await signIn(email, password, rememberMe);
      
      console.log('Sign in response:', { error, session: data?.session ? 'exists' : 'null' });
      
      if (error) {
        console.error('Sign in error:', error);
        toast({
          title: "Error signing in",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      console.log('Sign in successful, session:', data?.session ? 'exists' : 'null');
      toast({
        title: "Success",
        description: "You've successfully signed in!",
      });

      // Navigation will be handled by the useEffect
    } catch (err) {
      console.error('Unexpected error during sign in:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting || isLoading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting || isLoading}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="rememberMe" 
              checked={rememberMe} 
              onCheckedChange={(checked) => setRememberMe(checked === true)}
              disabled={isSubmitting || isLoading}
            />
            <label
              htmlFor="rememberMe"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Remember me
            </label>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 