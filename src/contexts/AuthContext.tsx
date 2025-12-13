import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { checkAndMigrateData } from '@/lib/migration-helper';

interface SubscriptionData {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
}

type UserRole = 'admin' | 'free' | 'pro' | 'business' | 'max';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  subscription: SubscriptionData | null;
  userRole: UserRole | null;
  subscriptionTier: UserRole | null; // Alias for userRole for backward compatibility
  isAdmin: boolean;
  isMaxAITier: boolean;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  checkUserRole: (sessionToUse?: Session | null) => Promise<void>;
  updateUserRole: (userId: string, newRole: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const navigate = useNavigate();
  
  const isInitializing = useRef(false);
  const roleCheckInProgress = useRef(false);

  const isAdmin = userRole === 'admin';
  const isMaxAITier = userRole === 'max' || userRole === 'admin';

  const checkUserRole = async (sessionToUse?: Session | null) => {
    if (roleCheckInProgress.current) {
      console.log('[AuthContext] Role check already in progress, skipping');
      return;
    }
    
    const activeSession = sessionToUse ?? session;
    
    if (!activeSession) {
      console.log('[AuthContext] No session, setting role to null');
      setUserRole(null);
      return;
    }

    console.log('[AuthContext] Checking role for user:', activeSession.user.id);
    roleCheckInProgress.current = true;
    
    try {
      // Try to get role via RPC function (direct database call)
      const rolePromise = supabase.rpc('get_user_role', {
        _user_id: activeSession.user.id,
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Role check timeout")), 3000)
      );
      
      const { data, error } = await Promise.race([rolePromise, timeoutPromise]) as { data: unknown, error: AuthError | null };

      if (error) {
        console.error('[AuthContext] Error fetching user role:', error);
        setUserRole('free');
        return;
      }

      console.log('[AuthContext] Role fetched:', data);
      setUserRole(data as UserRole);
    } catch (error) {
      console.error('[AuthContext] Error checking user role:', error);
      setUserRole('free');
    } finally {
      roleCheckInProgress.current = false;
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      console.log('[AuthContext] Updating user role via direct database access...');
      
      // Use direct database update instead of Edge Function
      const { error: dbError } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: userId, 
          role: newRole, 
          updated_at: new Date().toISOString() 
        }, {
          onConflict: 'user_id'
        });
      
      if (dbError) {
        console.error('[AuthContext] Direct database update failed:', dbError);
        throw new Error('Failed to update user role');
      }
      
      console.log('[AuthContext] ✓ Role updated via direct database access');
      await checkUserRole();
    } catch (error) {
      console.error('[AuthContext] Error updating user role:', error);
      throw error;
    }
  };

  const loadSubscription = async (userId: string) => {
    // Subscription checking is optional - don't fail auth if it doesn't work
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.log('[AuthContext] No valid session for subscription check');
        setSubscription(null);
        return;
      }

      const expiresAt = sessionData.session.expires_at;
      if (expiresAt && (expiresAt * 1000 - Date.now()) < 300000) {
        console.log('[AuthContext] Session expiring soon, refreshing...');
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (!refreshData.session) {
          console.error('[AuthContext] Session refresh failed');
          setSubscription(null);
          return;
        }
      }

      // Try to check subscription via Edge Function, but don't fail if it doesn't exist
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.warn('[AuthContext] Subscription check not available:', error);
        setSubscription(null);
        return;
      }
      
      setSubscription(data);
    } catch (error) {
      console.warn('[AuthContext] Subscription check error (non-critical):', error);
      setSubscription(null);
    }
  };

  useEffect(() => {
    if (isInitializing.current) {
      console.log('[AUTH DEBUG] Auth already initializing, skipping');
      return;
    }
    
    isInitializing.current = true;
    
    const initializeAuth = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        const timeoutDuration = existingSession ? 300 : 800;
        
        const maxLoadingTimeout: NodeJS.Timeout = setTimeout(() => {
          console.warn('[AUTH DEBUG] Auth timeout reached - forcing loading to false');
          setLoading(false);
          isInitializing.current = false;
        }, timeoutDuration);
        
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            clearTimeout(maxLoadingTimeout);
            console.log('[AUTH DEBUG] Auth state change:', event, 'Session:', !!currentSession);
            
            if (currentSession?.refresh_token) {
              try {
                if (currentSession.refresh_token.length < 10) {
                  console.error('[AUTH DEBUG] Invalid refresh token detected');
                  throw new Error('Invalid refresh token');
                }
              } catch (validationError) {
                console.error('[AUTH DEBUG] Session validation failed:', validationError);
                localStorage.clear();
                toast.error('Your session expired. Please sign in again.');
                setSession(null);
                setUser(null);
                setSubscription(null);
                setUserRole(null);
                setLoading(false);
                return;
              }
            }
            
            if (event === 'TOKEN_REFRESHED' && !currentSession) {
              console.error('[AUTH DEBUG] Token refresh failed - clearing corrupted data');
              try {
                localStorage.clear();
                if (navigator.serviceWorker.controller) {
                  navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_AUTH_CACHE' });
                }
              } catch (e) {
                console.error('[AUTH DEBUG] Error clearing storage:', e);
              }
              toast.error('Your session expired. Please sign in again.');
              setSession(null);
              setUser(null);
              setSubscription(null);
              setUserRole(null);
              setLoading(false);
              return;
            }
            
            if (event === 'SIGNED_OUT') {
              console.log('[AUTH DEBUG] Signed out event');
              try {
                localStorage.clear();
              } catch (e) {
                console.error('[AUTH DEBUG] Error clearing storage on signout:', e);
              }
              setSession(null);
              setUser(null);
              setSubscription(null);
              setUserRole(null);
              setLoading(false);
              return;
            }
            
            if (!currentSession) {
              console.log('[AUTH DEBUG] No session');
              setSession(null);
              setUser(null);
              setSubscription(null);
              setUserRole(null);
              setLoading(false);
              return;
            }
            
            setSession(currentSession);
            setUser(currentSession.user);
            
            // Keep loading true until role check completes
            try {
              await checkUserRole(currentSession);
            } catch (error) {
              console.error('[AUTH DEBUG] Role check failed:', error);
            } finally {
              console.log('[AUTH DEBUG] Setting loading to false after role check');
              setLoading(false);
            }
            
            // Load subscription and migrate data in background (non-blocking)
            setTimeout(() => {
              loadSubscription(currentSession.user.id).catch(console.error);
              checkAndMigrateData(currentSession.user.id).catch(console.error);
            }, 100);
          }
        );

        return () => {
          clearTimeout(maxLoadingTimeout);
          authSubscription.unsubscribe();
          isInitializing.current = false;
        };
      } catch (error) {
        console.error('[AUTH DEBUG] Auth initialization error:', error);
        setLoading(false);
        isInitializing.current = false;
      }
    };

    initializeAuth();
  }, []);

  const refreshSubscription = async () => {
    if (!session) return;
    await loadSubscription(session.user.id);
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      
      if (error) {
        console.error('[AuthContext] Sign up error:', error);
        return { error };
      }
      
      if (!data.user) {
        return { error: new Error('No user returned from sign up') as AuthError };
      }
      
      toast.success('Account created! You can now sign in.');
      
      /* 
      // DISABLED AUTO-SEEDING to prevent ghost data issues
      // Generate sample data in background (non-blocking)
      setTimeout(async () => {
        try {
          const { generateSampleData } = await import('@/lib/sample-data');
          await generateSampleData(data.user!.id, true);
          console.log('[AuthContext] Sample data generated for new user');
          toast.success('Sample data has been added to help you get started!');
        } catch (sampleError) {
          console.error('[AuthContext] Failed to generate sample data:', sampleError);
        }
      }, 2000);
      */
      
      return { error: null };
    } catch (err) {
      console.error('[AuthContext] Sign up exception:', err);
      return { error: err as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    setSigningIn(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setSigningIn(false);
        return { error };
      }
      
      if (!data.session) {
        setSigningIn(false);
        return { error: new Error('No session returned') as AuthError };
      }
      
      // Use flushSync to ensure state updates are applied immediately
      const { flushSync } = await import('react-dom');
      
      // Set session and user synchronously
      flushSync(() => {
        setSession(data.session);
        setUser(data.session.user);
      });
      
      // Wait for role check to complete
      await checkUserRole(data.session);
      
      // Set loading states to false
      flushSync(() => {
        setLoading(false);
        setSigningIn(false);
      });
      
      // Load subscription in background
      loadSubscription(data.session.user.id).catch(console.error);
      
      toast.success('Signed in successfully!');
      
      // Navigate to dashboard immediately - React will handle the rest
      navigate('/dashboard');
      
      return { error: null };
    } catch (err) {
      setSigningIn(false);
      console.error('[AuthContext] Sign in error:', err);
      return { error: err as AuthError };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
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
        userRole,
        subscriptionTier: userRole,
        isAdmin,
        isMaxAITier,
        loading,
        signUp,
        signIn,
        signOut,
        refreshSubscription,
        checkUserRole,
        updateUserRole,
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