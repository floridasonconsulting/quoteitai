import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { checkAndMigrateData } from '@/lib/migration-helper';

interface SubscriptionData {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  subscription: SubscriptionData | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refreshSubscription = async () => {
    if (!session) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    // Set timeout to prevent infinite loading on slow networks
    timeoutId = setTimeout(() => {
      console.log('[AUTH DEBUG] Auth check timeout - assuming no session');
      setLoading(false);
      setUser(null);
      setSession(null);
      setSubscription(null);
    }, 3000); // 3 second timeout
    
    // Set up auth state listener with error handling
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        clearTimeout(timeoutId);
        console.log('[AUTH DEBUG] Auth state change:', event, 'Session:', !!currentSession);
        
        // Handle token refresh failures
        if (event === 'TOKEN_REFRESHED' && !currentSession) {
          console.log('[AUTH DEBUG] Token refresh failed - clearing session');
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setSubscription(null);
          setLoading(false);
          return;
        }
        
        // Handle sign out
        if (event === 'SIGNED_OUT' || !currentSession) {
          console.log('[AUTH DEBUG] Signed out or no session');
          setSession(null);
          setUser(null);
          setSubscription(null);
          setLoading(false);
          return;
        }
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false); // Critical: Set loading false immediately after setting user
        
        // Defer subscription check and data migration
        if (currentSession?.user) {
          setTimeout(async () => {
            await refreshSubscription();
            await checkAndMigrateData(currentSession.user.id);
          }, 0);
        } else {
          setSubscription(null);
        }
      }
    );

    // Check for existing session with error handling
    supabase.auth.getSession()
      .then(async ({ data: { session: currentSession }, error }) => {
        clearTimeout(timeoutId);
        console.log('[AUTH DEBUG] getSession completed. Error:', !!error, 'Session:', !!currentSession);
        
        if (error) {
          // Session restoration failed - clear everything
          console.error('[AUTH DEBUG] Session restoration error:', error);
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setSubscription(null);
          setLoading(false);
          return;
        }
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
        
        if (currentSession?.user) {
          setTimeout(async () => {
            await refreshSubscription();
            await checkAndMigrateData(currentSession.user.id);
          }, 0);
        }
      })
      .catch(async (err) => {
        clearTimeout(timeoutId);
        console.error('[AUTH DEBUG] Fatal auth error:', err);
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setSubscription(null);
        setLoading(false);
      });

    return () => {
      clearTimeout(timeoutId);
      authSubscription.unsubscribe();
    };
  }, []);

  // Auto-refresh subscription every minute
  useEffect(() => {
    if (!session) return;
    
    const interval = setInterval(() => {
      refreshSubscription();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [session]);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    if (!error) {
      toast.success('Account created! You can now sign in.');
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error) {
      toast.success('Signed in successfully!');
      navigate('/');
    }
    
    return { error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      // Continue with local cleanup even if API call fails
    } finally {
      // Always clear local state and navigate
      setSession(null);
      setUser(null);
      setSubscription(null);
      toast.success('Signed out successfully');
      navigate('/auth', { replace: true });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        subscription,
        loading,
        signUp,
        signIn,
        signOut,
        refreshSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
