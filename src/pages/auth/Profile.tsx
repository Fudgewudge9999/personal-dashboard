import { UserProfile } from "@/components/auth/UserProfile";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  // Redirect to login if not authenticated
  if (!isLoading && !user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your account details
          </p>
        </div>
        
        <UserProfile />
        
        <div className="text-center">
          <Button variant="outline" asChild>
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 