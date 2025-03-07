import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

export function UserProfile() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Your Profile</CardTitle>
        <CardDescription>Your account information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Email</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Account ID</p>
          <p className="text-sm text-muted-foreground">{user.id}</p>
        </div>
        {user.user_metadata && (
          <div className="space-y-1">
            <p className="text-sm font-medium">User Metadata</p>
            <pre className="text-xs p-2 bg-muted rounded-md overflow-auto">
              {JSON.stringify(user.user_metadata, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="destructive" 
          className="w-full" 
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </CardFooter>
    </Card>
  );
} 