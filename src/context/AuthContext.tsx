import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Define types for the context
type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{
    error: Error | null;
    data: { user: User | null; session: Session | null } | null;
  }>;
  signUp: (email: string, password: string) => Promise<{
    error: Error | null;
    data: { user: User | null; session: Session | null } | null;
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
};

// Create context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook for using the auth context
// Moved up here for better Fast Refresh compatibility
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Function to refresh the session
  const refreshSession = async () => {
    try {
      console.log('AuthContext: Refreshing session...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        return;
      }
      
      if (data.session) {
        console.log('AuthContext: Session refreshed successfully');
        setSession(data.session);
        setUser(data.session.user);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('Failed to refresh session:', err);
    }
  };

  useEffect(() => {
    // Check for active session on initial load
    const getSession = async () => {
      setIsLoading(true);
      console.log('AuthContext: Checking for active session...');
      try {
        const { data, error } = await supabase.auth.getSession();
        
        console.log('AuthContext: getSession result:', { 
          hasSession: !!data.session, 
          error: error ? 'Error occurred' : 'No error' 
        });
        
        if (!error && data.session) {
          setSession(data.session);
          setUser(data.session.user);
          setIsAuthenticated(true);
          console.log('AuthContext: Session found, user set');
          
          // Check if the token will expire soon (within 60 minutes)
          const expiresAt = data.session.expires_at;
          if (expiresAt) {
            const expiresIn = expiresAt - Math.floor(Date.now() / 1000);
            console.log(`AuthContext: Session expires in ${expiresIn} seconds`);
            if (expiresIn < 3600) { // Less than 60 minutes
              console.log('AuthContext: Session expiring soon, refreshing...');
              await refreshSession();
            }
          }
        } else {
          setIsAuthenticated(false);
          console.log('AuthContext: No active session found');
        }
      } catch (err) {
        console.error('AuthContext: Error getting session:', err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
        console.log('AuthContext: Finished loading session');
      }
    };

    getSession();

    // Set up listener for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('AuthContext: Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && newSession) {
          console.log('AuthContext: User signed in, updating state');
          setSession(newSession);
          setUser(newSession.user);
          setIsAuthenticated(true);
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          console.log('AuthContext: User signed out, clearing state');
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          console.log('AuthContext: Token refreshed, updating session');
          setSession(newSession);
          setUser(newSession.user);
          setIsAuthenticated(true);
          setIsLoading(false);
        } else if (newSession) {
          console.log(`AuthContext: Other auth event (${event}), updating session`);
          setSession(newSession);
          setUser(newSession.user);
          setIsAuthenticated(true);
          setIsLoading(false);
        } else {
          console.log(`AuthContext: Other auth event (${event}), no session`);
          setIsLoading(false);
        }
      }
    );

    // Refresh session periodically (every 30 minutes)
    const refreshInterval = setInterval(() => {
      if (session) {
        refreshSession();
      }
    }, 30 * 60 * 1000); // 30 minutes

    // Clean up subscription and interval on unmount
    return () => {
      authListener.subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string, rememberMe = false) => {
    console.log('AuthContext: Attempting sign in with email:', email, 'rememberMe:', rememberMe);
    try {
      setIsLoading(true);
      // Using 'rememberMe' to control session persistence
      const response = await supabase.auth.signInWithPassword({ 
        email, 
        password,
      });
      
      console.log('AuthContext: Sign in response:', { 
        error: response.error ? 'Error occurred' : 'No error',
        hasSession: !!response.data.session
      });
      
      if (!response.error && response.data.session) {
        setSession(response.data.session);
        setUser(response.data.session.user);
        setIsAuthenticated(true);
      }
      
      return response;
    } catch (err) {
      console.error('AuthContext: Unexpected error in signIn:', err);
      return { 
        error: err as Error, 
        data: { user: null, session: null } 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await supabase.auth.signUp({ email, password });
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
  };

  // Create value object
  const value = {
    user,
    session,
    isLoading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 